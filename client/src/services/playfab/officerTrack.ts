/**
 * PlayFab Officer Track Service - Refactored with New Architecture
 * 
 * Single Responsibility: Officer-specific operations using centralized services
 * DRY Compliance: Uses new request manager and authentication manager
 * 
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
import { playFabRequestManager } from './requestManager';
import { playFabAuthManager } from './authManager';
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

interface ExecuteCloudScriptRequest {
  FunctionName: string;
  FunctionParameter: any;
}

interface ExecuteCloudScriptResponse {
  FunctionResult: any;
  Logs?: any[];
  ExecutionTimeMilliseconds?: number;
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
      console.log(`[PlayFabOfficerTrack] Officer Player Cache Hit: ${this.officerPlayerCache.officerRank}`);
      return this.officerPlayerCache;
    }

    await playFabAuthManager.ensureAuthenticated();

    const request: GetOfficerUserDataRequest = {
      Keys: [
        PLAYFAB_CONSTANTS.USER_DATA_KEYS.OFFICER_PLAYER_DATA,
        PLAYFAB_CONSTANTS.USER_DATA_KEYS.OFFICER_ACHIEVEMENTS,
        PLAYFAB_CONSTANTS.USER_DATA_KEYS.OFFICER_PROGRESS
      ]
    };

    try {
      const result = await playFabRequestManager.makeRequest<GetOfficerUserDataRequest, GetOfficerUserDataResponse>(
        'getUserData',
        request
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
        
        console.log(`[PlayFabOfficerTrack] Officer Player Data Loaded: ${officerPlayer.officerRank} - ${officerPlayer.officerPoints} points`);
      } else {
        // Create new officer profile
        officerPlayer = await this.createNewOfficerProfile();
        console.log(`[PlayFabOfficerTrack] New Officer Profile Created: ${officerPlayer.officerRank}`);
      }

      // Update cache
      this.officerPlayerCache = officerPlayer;
      
      return officerPlayer;
    } catch (error) {
      console.error('[PlayFabOfficerTrack] Officer Player Data Load Failed:', error);
      throw new Error('Failed to load officer player data');
    }
  }

  /**
   * Create a new officer profile for first-time players
   */
  private async createNewOfficerProfile(): Promise<OfficerTrackPlayer> {
    const playerId = playFabAuthManager.getPlayFabId();
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
    await playFabAuthManager.ensureAuthenticated();

    // Use cached data if available, otherwise use the provided data directly (prevents infinite recursion)
    const currentData = this.officerPlayerCache || playerData as OfficerTrackPlayer;
    const updatedData = { ...currentData, ...playerData, lastActive: new Date() };

    const request: UpdateOfficerUserDataRequest = {
      Data: {
        [PLAYFAB_CONSTANTS.USER_DATA_KEYS.OFFICER_PLAYER_DATA]: JSON.stringify(updatedData)
      }
    };

    try {
      await playFabRequestManager.makeRequest<UpdateOfficerUserDataRequest, {}>(
        'updateUserData',
        request
      );

      // Update cache
      this.officerPlayerCache = updatedData;
      
      console.log(`[PlayFabOfficerTrack] Officer Player Data Updated: Rank ${updatedData.officerRank}, Points ${updatedData.officerPoints}`);
    } catch (error) {
      console.error('[PlayFabOfficerTrack] Officer Player Data Update Failed:', error);
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

  public async getOfficerLeaderboard(maxResults: number = 10): Promise<OfficerLeaderboardEntry[]> {
    try {
      const result = await playFabRequestManager.makeRequest<any, any>(
        'getLeaderboard', 
        { 
          StatisticName: 'OfficerTotalScore',
          MaxResultsCount: maxResults 
        }
      );
      
      return result.Leaderboard?.map((entry: any, index: number) => ({
        playerId: entry.PlayFabId,
        playerName: entry.DisplayName || `Officer ${entry.PlayFabId.substring(0, 8)}`,
        score: entry.StatValue,
        rank: index + 1
      })) || [];
    } catch (error) {
      console.error('[PlayFabOfficerTrack] Failed to fetch officer leaderboard:', error);
      return [];
    }
  }

  public async submitOfficerScore(points: number): Promise<void> {
    try {
      await playFabRequestManager.makeRequest<any, any>(
        'updatePlayerStatistics',
        {
          Statistics: [{
            StatisticName: 'OfficerTotalScore',
            Value: points
          }]
        }
      );
    } catch (error) {
      console.error('[PlayFabOfficerTrack] Failed to submit officer score:', error);
      throw error;
    }
  }

  public async awardAchievement(achievementId: string): Promise<void> {
    try {
      // Store achievement in user data since PlayFab doesn't have built-in achievements
      const userData = await playFabUserData.getPlayerData();
      const achievements = userData?.officerAchievements ? 
        JSON.parse(userData.officerAchievements) : [];
      
      if (!achievements.includes(achievementId)) {
        achievements.push(achievementId);
        await playFabUserData.updatePlayerData({
          officerAchievements: JSON.stringify(achievements)
        });
      }
    } catch (error) {
      console.error('[PlayFabOfficerTrack] Failed to award achievement:', error);
      throw error;
    }
  }

  public async getOfficerPlayerRanking(): Promise<OfficerLeaderboardEntry | null> {
    try {
      const result = await playFabRequestManager.makeRequest<any, any>(
        'getPlayerStatistics',
        { StatisticNames: ['OfficerTotalScore'] }
      );
      
      if (result.Statistics?.length > 0) {
        const score = result.Statistics[0].Value;
        // Get rank by fetching leaderboard around player
        const leaderboardResult = await playFabRequestManager.makeRequest<any, any>(
          'getLeaderboardAroundPlayer',
          { 
            StatisticName: 'OfficerTotalScore',
            MaxResultsCount: 1
          }
        );
        
        const rank = leaderboardResult.Leaderboard?.[0]?.Position + 1 || null;
        
        return {
          playerId: await playFabAuthManager.getPlayFabId() || 'unknown',
          playerName: 'You',
          score,
          rank: rank || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('[PlayFabOfficerTrack] Failed to get player ranking:', error);
      return null;
    }
  }

  // =============================================================================
  // ARC SOLUTION VALIDATION
  // =============================================================================

  /**
   * Validate ARC puzzle solution via PlayFab CloudScript ValidateARCPuzzle
   */
  public async validateARCSolution(attempt: ARCSolutionAttempt): Promise<ARCValidationResult> {
    await playFabAuthManager.ensureAuthenticated();

    // Prepare CloudScript request for ValidateARCPuzzle function
    // Use solutions array if available (multi-test case), otherwise wrap single solution
    const solutions = attempt.solutions || [attempt.solution];
    
    const cloudScriptRequest: ExecuteCloudScriptRequest = {
      FunctionName: 'ValidateARCPuzzle',
      FunctionParameter: {
        puzzleId: attempt.puzzleId,
        solutions: solutions, // Array of solutions for multiple test cases
        timeElapsed: attempt.timeElapsed,
        attemptNumber: attempt.attemptNumber,
        sessionId: attempt.sessionId
      }
    };

    console.log(`[PlayFabOfficerTrack] Validating ARC Solution for puzzle: ${attempt.puzzleId}`);

    try {
      // Call ValidateARCPuzzle CloudScript function directly
      const response: ExecuteCloudScriptResponse = await playFabRequestManager.makeRequest<ExecuteCloudScriptRequest, ExecuteCloudScriptResponse>(
        'executeCloudScript',
        cloudScriptRequest
      );

      // Extract result from CloudScript response
      const cloudScriptResult = response.FunctionResult;
      
      if (!cloudScriptResult) {
        throw new Error('No result returned from ValidateARCPuzzle CloudScript function');
      }

      if (!cloudScriptResult.success) {
        throw new Error(cloudScriptResult.error || 'CloudScript validation failed');
      }
      
      // Transform result to ARC format (simplified - no complex scoring)
      const arcResult: ARCValidationResult = {
        success: true,
        correct: cloudScriptResult.correct,
        pointsEarned: 0, // No points in Officer Track validation
        timeBonus: 0,
        hintPenalty: 0,
        message: cloudScriptResult.correct ? 'Puzzle solved!' : 'Incorrect solution',
        totalScore: 0,
        timeElapsed: cloudScriptResult.timeElapsed,
        completedAt: cloudScriptResult.completedAt
      };

      console.log(`[PlayFabOfficerTrack] ARC Validation Complete: ${arcResult.correct ? 'Correct' : 'Incorrect'}`);

      return arcResult;
    } catch (error) {
      console.error('[PlayFabOfficerTrack] ARC Validation Failed:', error);
      throw error;
    }
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.officerPlayerCache = null;
    console.log('[PlayFabOfficerTrack] Officer Track Cache Cleared');
  }
}

// Export singleton instance
export const playFabOfficerTrack = PlayFabOfficerTrack.getInstance();