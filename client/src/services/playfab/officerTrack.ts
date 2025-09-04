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
  OfficerRank,
  OfficerAchievement,
  ARCGrid
} from '@/types/arcTypes';
import type { PlayFabServiceResult } from '@/types/playfab';
import { playFabCore } from './core';
import { playFabAuth } from './auth';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';
import { ARC_CONSTANTS } from '@/types/arcTypes';

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
      pointsToNextRank: ARC_CONSTANTS.RANK_THRESHOLDS.CAPTAIN,
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

    // Merge with existing data if available
    const currentData = this.officerPlayerCache || await this.getOfficerPlayerData();
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

  // =============================================================================
  // OFFICER LEADERBOARDS (SEPARATE FROM MAIN GAME)
  // =============================================================================

  /**
   * Submit score to officer track leaderboard
   */
  public async submitOfficerScore(points: number): Promise<void> {
    await playFabAuth.ensureAuthenticated();

    const request: UpdateOfficerStatisticsRequest = {
      Statistics: [{
        StatisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.OFFICER_TRACK_POINTS,
        Value: points
      }]
    };

    try {
      await playFabCore.makeHttpRequest<UpdateOfficerStatisticsRequest, {}>(
        '/Client/UpdatePlayerStatistics',
        request,
        true
      );

      // Clear leaderboard cache since scores changed
      this.clearLeaderboardCache();

      playFabCore.logOperation('Officer Score Submitted', {
        statistic: PLAYFAB_CONSTANTS.STATISTIC_NAMES.OFFICER_TRACK_POINTS,
        points
      });
    } catch (error) {
      playFabCore.logOperation('Officer Score Submission Failed', error);
      throw error;
    }
  }

  /**
   * Get officer track leaderboard
   */
  public async getOfficerLeaderboard(maxResults: number = 20): Promise<OfficerLeaderboardEntry[]> {
    // Check cache first
    if (this.isLeaderboardCacheValid() && this.leaderboardCache.length > 0) {
      playFabCore.logOperation('Officer Leaderboard Cache Hit', `${this.leaderboardCache.length} entries`);
      return this.leaderboardCache.slice(0, maxResults);
    }

    await playFabAuth.ensureAuthenticated();

    const request: GetOfficerLeaderboardRequest = {
      StatisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.OFFICER_TRACK_POINTS,
      StartPosition: 0,
      MaxResultsCount: maxResults
    };

    try {
      const result = await playFabCore.makeHttpRequest<GetOfficerLeaderboardRequest, OfficerLeaderboardResponse>(
        '/Client/GetLeaderboard',
        request,
        true
      );

      const entries: OfficerLeaderboardEntry[] = result.Leaderboard.map((entry: any) => ({
        displayName: entry.DisplayName || 'Officer',
        officerRank: this.getOfficerRankFromPoints(entry.StatValue),
        officerPoints: entry.StatValue || 0,
        position: entry.Position + 1, // Convert to 1-based
        playerId: entry.PlayFabId,
        completedPuzzles: 0, // Would need additional data lookup
        currentStreak: 0 // Would need additional data lookup
      }));

      // Update cache
      this.leaderboardCache = entries;
      this.lastLeaderboardUpdate = Date.now();

      playFabCore.logOperation('Officer Leaderboard Retrieved', `${entries.length} officers`);

      return entries;
    } catch (error) {
      playFabCore.logOperation('Officer Leaderboard Retrieval Failed', error);
      throw error;
    }
  }

  /**
   * Get current officer's ranking
   */
  public async getOfficerPlayerRanking(): Promise<OfficerLeaderboardEntry | null> {
    const currentPlayerId = playFabAuth.getPlayFabId();
    if (!currentPlayerId) return null;

    try {
      // Get leaderboard around player
      const aroundPlayerRequest = {
        StatisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.OFFICER_TRACK_POINTS,
        PlayFabId: currentPlayerId,
        MaxResultsCount: 1
      };

      const result = await playFabCore.makeHttpRequest<any, OfficerLeaderboardResponse>(
        '/Client/GetLeaderboardAroundPlayer',
        aroundPlayerRequest,
        true
      );

      if (result.Leaderboard && result.Leaderboard.length > 0) {
        const entry = result.Leaderboard[0];
        return {
          displayName: entry.DisplayName || 'Officer',
          officerRank: this.getOfficerRankFromPoints(entry.StatValue),
          officerPoints: entry.StatValue,
          position: entry.Position + 1,
          playerId: entry.PlayFabId,
          completedPuzzles: 0,
          currentStreak: 0
        };
      }

      return null;
    } catch (error) {
      playFabCore.logOperation('Officer Player Ranking Failed', error);
      return null;
    }
  }

  // =============================================================================
  // ARC PUZZLE VALIDATION (CLOUDSCRIPT)
  // =============================================================================

  /**
   * Validate ARC puzzle solution via CloudScript
   */
  public async validateARCSolution(attempt: ARCSolutionAttempt): Promise<ARCValidationResult> {
    await playFabAuth.ensureAuthenticated();

    const request: ExecuteCloudScriptRequest = {
      FunctionName: PLAYFAB_CONSTANTS.CLOUDSCRIPT_FUNCTIONS.VALIDATE_ARC_SOLUTION,
      FunctionParameter: {
        puzzleId: attempt.puzzleId,
        solution: attempt.solution,
        timeElapsed: attempt.timeElapsed,
        hintsUsed: attempt.hintsUsed || 0,
        sessionId: attempt.sessionId,
        attemptNumber: attempt.attemptNumber
      }
    };

    try {
      const result = await playFabCore.makeHttpRequest<ExecuteCloudScriptRequest, ExecuteCloudScriptResponse>(
        '/Client/ExecuteCloudScript',
        request,
        true
      );

      if (result.Error) {
        throw new Error(`CloudScript Error: ${result.Error.Message}`);
      }

      const validationResult: ARCValidationResult = result.FunctionResult;

      // Update local player data if solution was correct
      if (validationResult.correct && this.officerPlayerCache) {
        const updatedData: Partial<OfficerTrackPlayer> = {
          officerPoints: validationResult.newTotalPoints,
          completedPuzzles: [...this.officerPlayerCache.completedPuzzles, attempt.puzzleId],
          stats: {
            ...this.officerPlayerCache.stats,
            totalAttempts: this.officerPlayerCache.stats.totalAttempts + 1,
            successfulSolves: this.officerPlayerCache.stats.successfulSolves + 1
          }
        };

        if (validationResult.rankUp && validationResult.newRank) {
          updatedData.officerRank = validationResult.newRank;
        }

        await this.updateOfficerPlayerData(updatedData);
      }

      playFabCore.logOperation('ARC Solution Validated', {
        puzzleId: attempt.puzzleId,
        correct: validationResult.correct,
        points: validationResult.pointsEarned
      });

      return validationResult;
    } catch (error) {
      playFabCore.logOperation('ARC Solution Validation Failed', error);
      throw error;
    }
  }

  // =============================================================================
  // OFFICER ACHIEVEMENTS
  // =============================================================================

  /**
   * Award achievement to officer
   */
  public async awardAchievement(achievementId: string): Promise<void> {
    const currentData = await this.getOfficerPlayerData();
    
    // Check if achievement already exists
    if (currentData.achievements.some(a => a.id === achievementId)) {
      return;
    }

    const achievement: OfficerAchievement = {
      id: achievementId,
      name: this.getAchievementName(achievementId),
      description: this.getAchievementDescription(achievementId),
      icon: this.getAchievementIcon(achievementId),
      unlockedAt: new Date(),
      rarity: this.getAchievementRarity(achievementId)
    };

    const updatedAchievements = [...currentData.achievements, achievement];
    
    await this.updateOfficerPlayerData({
      achievements: updatedAchievements
    });

    playFabCore.logOperation('Officer Achievement Awarded', {
      id: achievementId,
      name: achievement.name
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Determine officer rank from points
   */
  private getOfficerRankFromPoints(points: number): OfficerRank {
    if (points >= ARC_CONSTANTS.RANK_THRESHOLDS.GENERAL) return OfficerRank.GENERAL;
    if (points >= ARC_CONSTANTS.RANK_THRESHOLDS.COLONEL) return OfficerRank.COLONEL;
    if (points >= ARC_CONSTANTS.RANK_THRESHOLDS.MAJOR) return OfficerRank.MAJOR;
    if (points >= ARC_CONSTANTS.RANK_THRESHOLDS.CAPTAIN) return OfficerRank.CAPTAIN;
    return OfficerRank.LIEUTENANT;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return this.officerPlayerCache !== null; // Simple cache for now
  }

  /**
   * Check if leaderboard cache is valid
   */
  private isLeaderboardCacheValid(): boolean {
    const cacheAge = Date.now() - this.lastLeaderboardUpdate;
    return this.leaderboardCache.length > 0 && cacheAge < this.CACHE_DURATION;
  }

  /**
   * Clear leaderboard cache
   */
  private clearLeaderboardCache(): void {
    this.leaderboardCache = [];
    this.lastLeaderboardUpdate = 0;
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.officerPlayerCache = null;
    this.clearLeaderboardCache();
    playFabCore.logOperation('Officer Track Cache Cleared');
  }

  // Achievement helper methods (simplified for now)
  private getAchievementName(id: string): string {
    const names: Record<string, string> = {
      'first_puzzle_solve': 'First Mission',
      'rank_promotion': 'Promoted!',
      'streak_achievement': 'On a Roll',
      'speed_solve': 'Lightning Fast',
      'complexity_master': 'Pattern Master'
    };
    return names[id] || 'Unknown Achievement';
  }

  private getAchievementDescription(id: string): string {
    const descriptions: Record<string, string> = {
      'first_puzzle_solve': 'Solved your first ARC puzzle',
      'rank_promotion': 'Achieved a new officer rank',
      'streak_achievement': 'Solved multiple puzzles in a row',
      'speed_solve': 'Solved a puzzle in record time',
      'complexity_master': 'Mastered complex pattern recognition'
    };
    return descriptions[id] || 'Achievement unlocked';
  }

  private getAchievementIcon(id: string): string {
    const icons: Record<string, string> = {
      'first_puzzle_solve': '🎯',
      'rank_promotion': '⭐',
      'streak_achievement': '🔥',
      'speed_solve': '⚡',
      'complexity_master': '🧠'
    };
    return icons[id] || '🏆';
  }

  private getAchievementRarity(id: string): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    const rarities: Record<string, 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'> = {
      'first_puzzle_solve': 'common',
      'rank_promotion': 'uncommon',
      'streak_achievement': 'rare',
      'speed_solve': 'epic',
      'complexity_master': 'legendary'
    };
    return rarities[id] || 'common';
  }
}

// Export singleton instance
export const playFabOfficerTrack = PlayFabOfficerTrack.getInstance();