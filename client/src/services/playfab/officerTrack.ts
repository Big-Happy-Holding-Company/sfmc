/**
 * PlayFab Officer Track Service - Pure HTTP Implementation
 * Manages officer-specific leaderboards, player data, and ARC puzzle validation
 * Complete separation from main game systems with dedicated statistics and data keys
 */

import type { 
  OfficerTrackPlayer, 
  OfficerLeaderboardEntry,
  ARCValidationResult,
  ARCSolutionAttempt,
  OfficerAchievement,
  ARCGrid
} from '@/types/arcTypes';
import { OfficerRank, ARC_CONSTANTS } from '@/types/arcTypes';
import type { PlayFabServiceResult, CloudScriptValidationRequest, TaskValidationResult } from '@/types/playfab';
import { playFabCore } from './core';
import { playFabAuth } from './auth';
import { playFabValidation } from './validation';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';

// PlayFab request/response interfaces for Officer Track

interface UpdateOfficerStatisticsRequest {
  Statistics: Array<{
    StatisticName: string;
    Value: number;
  }>;
}

interface GetOfficerLeaderboardRequest {
  StatisticName: string;
  StartPosition: number;
  MaxResultsCount: number;
}

interface OfficerLeaderboardResponse {
  Leaderboard: Array<{
    DisplayName?: string;
    StatValue: number;
    Position: number;
    PlayFabId: string;
  }>;
  Version: number;
}

interface UpdateOfficerUserDataRequest {
  Data: Record<string, string>;
}

interface GetOfficerUserDataRequest {
  Keys?: string[];
}

interface GetOfficerUserDataResponse {
  Data?: Record<string, { Value: string }>;
}

interface ExecuteCloudScriptRequest {
  FunctionName: string;
  FunctionParameter: any;
}

interface ExecuteCloudScriptResponse {
  FunctionResult: any;
  Error?: {
    Error: string;
    Message: string;
  };
}

/**
 * Officer Track PlayFab Service - Manages all officer-specific operations
 */
export class PlayFabOfficerTrack {
  private static instance: PlayFabOfficerTrack;
  private officerPlayerCache: OfficerTrackPlayer | null = null;
  private leaderboardCache: OfficerLeaderboardEntry[] = [];
  private lastLeaderboardUpdate: number = 0;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  private constructor() {}

  public static getInstance(): PlayFabOfficerTrack {
    if (!PlayFabOfficerTrack.instance) {
      PlayFabOfficerTrack.instance = new PlayFabOfficerTrack();
    }
    return PlayFabOfficerTrack.instance;
  }

  // =============================================================================
  // OFFICER PLAYER DATA MANAGEMENT
  // =============================================================================

  /**
   * Get officer track player data (separate from main game)
   */
  public async getOfficerPlayerData(): Promise<OfficerTrackPlayer> {
    // Return cached data if available and recent
    if (this.officerPlayerCache && this.isCacheValid()) {
      playFabCore.logOperation('Officer Player Cache Hit', this.officerPlayerCache.officerRank);
      return this.officerPlayerCache;
    }

    await playFabAuth.ensureAuthenticated();

    const request: GetOfficerUserDataRequest = {
      Keys: [
        PLAYFAB_CONSTANTS.USER_DATA_KEYS.OFFICER_PLAYER_DATA,
        PLAYFAB_CONSTANTS.USER_DATA_KEYS.OFFICER_ACHIEVEMENTS,
        PLAYFAB_CONSTANTS.USER_DATA_KEYS.OFFICER_PROGRESS
      ]
    };

    try {
      const result = await playFabCore.makeHttpRequest<GetOfficerUserDataRequest, GetOfficerUserDataResponse>(
        '/Client/GetUserData',
        request,
        true
      );

      let officerPlayer: OfficerTrackPlayer;

      if (result?.Data?.[PLAYFAB_CONSTANTS.USER_DATA_KEYS.OFFICER_PLAYER_DATA]) {
        // Parse existing officer data
        const savedData = JSON.parse(result.Data[PLAYFAB_CONSTANTS.USER_DATA_KEYS.OFFICER_PLAYER_DATA].Value);
        officerPlayer = {
          ...savedData,
          // Ensure dates are properly parsed
          officerEnlistmentDate: new Date(savedData.officerEnlistmentDate),
          lastActive: new Date(savedData.lastActive)
        };
        
        playFabCore.logOperation('Officer Player Data Loaded', 
          `${officerPlayer.officerRank} - ${officerPlayer.officerPoints} points`
        );
      } else {
        // Create new officer profile
        officerPlayer = await this.createNewOfficerProfile();
        playFabCore.logOperation('New Officer Profile Created', officerPlayer.officerRank);
      }

      // Update cache
      this.officerPlayerCache = officerPlayer;
      
      return officerPlayer;
    } catch (error) {
      playFabCore.logOperation('Officer Player Data Load Failed', error);
      throw new Error('Failed to load officer player data');
    }
  }

  /**
   * Create a new officer profile for first-time players
   */
  private async createNewOfficerProfile(): Promise<OfficerTrackPlayer> {
    const playerId = playFabAuth.getPlayFabId();
    if (!playerId) {
      throw new Error('Player not authenticated');
    }

    const newOfficer: OfficerTrackPlayer = {
      playerId,
      officerRank: OfficerRank.LIEUTENANT,
      officerPoints: 0,
      pointsToNextRank: ARC_CONSTANTS.RANK_THRESHOLDS[OfficerRank.CAPTAIN],
      completedPuzzles: [],
      currentStreak: 0,
      bestStreak: 0,
      achievements: [],
      stats: {
        totalAttempts: 0,
        successfulSolves: 0,
        averageTimePerPuzzle: 0,
        favoriteComplexity: 'simple',
        totalTimeSpent: 0
      },
      officerEnlistmentDate: new Date(),
      lastActive: new Date()
    };

    // Save to PlayFab
    await this.updateOfficerPlayerData(newOfficer);

    return newOfficer;
  }

  /**
   * Update officer player data in PlayFab
   */
  public async updateOfficerPlayerData(playerData: Partial<OfficerTrackPlayer>): Promise<void> {
    await playFabAuth.ensureAuthenticated();

    // Use cached data if available, otherwise use the provided data directly (prevents infinite recursion)
    const currentData = this.officerPlayerCache || playerData as OfficerTrackPlayer;
    const updatedData = { ...currentData, ...playerData, lastActive: new Date() };

    const request: UpdateOfficerUserDataRequest = {
      Data: {
        [PLAYFAB_CONSTANTS.USER_DATA_KEYS.OFFICER_PLAYER_DATA]: JSON.stringify(updatedData)
      }
    };

    try {
      await playFabCore.makeHttpRequest<UpdateOfficerUserDataRequest, {}>(
        '/Client/UpdateUserData',
        request,
        true
      );

      // Update cache
      this.officerPlayerCache = updatedData;
      
      playFabCore.logOperation('Officer Player Data Updated', {
        rank: updatedData.officerRank,
        points: updatedData.officerPoints
      });
    } catch (error) {
      playFabCore.logOperation('Officer Player Data Update Failed', error);
      throw error;
    }
  }

  /**
   * Determine officer rank from points
   */
  private getOfficerRankFromPoints(points: number): OfficerRank {
    if (points >= ARC_CONSTANTS.RANK_THRESHOLDS[OfficerRank.GENERAL]) return OfficerRank.GENERAL;
    if (points >= ARC_CONSTANTS.RANK_THRESHOLDS[OfficerRank.COLONEL]) return OfficerRank.COLONEL;
    if (points >= ARC_CONSTANTS.RANK_THRESHOLDS[OfficerRank.MAJOR]) return OfficerRank.MAJOR;
    if (points >= ARC_CONSTANTS.RANK_THRESHOLDS[OfficerRank.CAPTAIN]) return OfficerRank.CAPTAIN;
    return OfficerRank.LIEUTENANT;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return this.officerPlayerCache !== null; // Simple cache for now
  }

  // =============================================================================
  // ARC SOLUTION VALIDATION
  // =============================================================================

  /**
   * Validate ARC puzzle solution via PlayFab CloudScript
   * Transforms ARC format to CloudScript validation request
   */
  public async validateARCSolution(attempt: ARCSolutionAttempt): Promise<ARCValidationResult> {
    await playFabAuth.ensureAuthenticated();

    // Transform ARC format to CloudScript format
    const cloudScriptRequest: CloudScriptValidationRequest = {
      taskId: attempt.puzzleId,
      solution: attempt.solution.map(row => row.map(cell => cell.toString())), // Convert number[][] to string[][]
      timeElapsed: attempt.timeElapsed,
      hintsUsed: attempt.hintsUsed,
      sessionId: attempt.sessionId,
      attemptId: attempt.attemptNumber
    };

    playFabCore.logOperation('ARC Solution Validation', `Puzzle: ${attempt.puzzleId}`);

    try {
      // Use existing validation infrastructure
      const result = await playFabValidation.validateSolution(cloudScriptRequest);
      
      // Transform result back to ARC format
      const arcResult: ARCValidationResult = {
        success: result.success,
        correct: result.correct,
        pointsEarned: result.pointsEarned,
        timeBonus: result.timeBonus || 0,
        hintPenalty: result.hintPenalty || 0,
        message: result.message || (result.correct ? 'Puzzle solved!' : 'Incorrect solution'),
        totalScore: result.totalScore || result.pointsEarned
      };

      playFabCore.logOperation('ARC Validation Complete', {
        correct: arcResult.correct,
        points: arcResult.pointsEarned
      });

      return arcResult;
    } catch (error) {
      playFabCore.logOperation('ARC Validation Failed', error);
      throw error;
    }
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.officerPlayerCache = null;
    playFabCore.logOperation('Officer Track Cache Cleared');
  }
}

// Export singleton instance
export const playFabOfficerTrack = PlayFabOfficerTrack.getInstance();