/**
 * Leaderboard API Layer
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Single responsibility: PlayFab HTTP communication only.
 * No caching, no business logic, no leaderboard-specific code.
 * 
 * HOW IT WORKS:
 * - Generic methods that work with any PlayFab statistic
 * - Pure HTTP operations with error handling
 * - Returns raw PlayFab data structures
 * 
 * HOW THE PROJECT USES IT:
 * - LeaderboardService calls these methods for all API operations
 * - Completely stateless and reusable
 */

import type { LeaderboardEntry } from '@/types/playfab';
import { playFabCore } from './core';
import { playFabRequestManager } from './requestManager';

// PlayFab request/response interfaces
interface UpdatePlayerStatisticsRequest {
  Statistics: Array<{
    StatisticName: string;
    Value: number;
  }>;
}

interface GetLeaderboardRequest {
  StatisticName: string;
  StartPosition: number;
  MaxResultsCount: number;
}

interface GetLeaderboardAroundPlayerRequest {
  StatisticName: string;
  PlayFabId: string;
  MaxResultsCount: number;
}

interface PlayFabLeaderboardResponse {
  Leaderboard: Array<{
    DisplayName?: string;
    StatValue: number;
    Position: number;
    PlayFabId: string;
  }>;
  NextReset?: string;
  Version: number;
}

export class LeaderboardAPI {
  private static instance: LeaderboardAPI;

  private constructor() {}

  public static getInstance(): LeaderboardAPI {
    if (!LeaderboardAPI.instance) {
      LeaderboardAPI.instance = new LeaderboardAPI();
    }
    return LeaderboardAPI.instance;
  }

  /**
   * Submit score to any PlayFab statistic
   */
  public async submitScore(statisticName: string, score: number): Promise<void> {
    // Authentication handled automatically by requestManager

    const request: UpdatePlayerStatisticsRequest = {
      Statistics: [{
        StatisticName: statisticName,
        Value: score
      }]
    };

    try {
      await playFabRequestManager.makeRequest<UpdatePlayerStatisticsRequest, {}>(
        'updateStatistics',
        request
      );

      playFabCore.logOperation('Score Submitted', {
        statistic: statisticName,
        value: score
      });
    } catch (error) {
      playFabCore.logOperation('Score Submission Failed', error);
      throw error;
    }
  }

  /**
   * Get leaderboard for any PlayFab statistic
   */
  public async getLeaderboard(
    statisticName: string,
    startPosition: number = 0,
    maxResults: number = 10
  ): Promise<LeaderboardEntry[]> {
    // Authentication handled automatically by requestManager

    const request: GetLeaderboardRequest = {
      StatisticName: statisticName,
      StartPosition: startPosition,
      MaxResultsCount: maxResults
    };

    try {
      const result = await playFabRequestManager.makeRequest<GetLeaderboardRequest, PlayFabLeaderboardResponse>(
        'getLeaderboard',
        request
      );

      return this.mapPlayFabEntries(result.Leaderboard);
    } catch (error) {
      playFabCore.logOperation('Leaderboard Retrieval Failed', error);
      throw error;
    }
  }

  /**
   * Get leaderboard around specific player
   */
  public async getLeaderboardAroundPlayer(
    statisticName: string,
    playerId: string,
    maxResults: number = 10
  ): Promise<LeaderboardEntry[]> {
    // Authentication handled automatically by requestManager

    const request: GetLeaderboardAroundPlayerRequest = {
      StatisticName: statisticName,
      PlayFabId: playerId,
      MaxResultsCount: maxResults
    };

    try {
      const result = await playFabRequestManager.makeRequest<GetLeaderboardAroundPlayerRequest, PlayFabLeaderboardResponse>(
        'getLeaderboard',
        request
      );

      return this.mapPlayFabEntries(result.Leaderboard);
    } catch (error) {
      playFabCore.logOperation('Player-Centered Leaderboard Failed', error);
      throw error;
    }
  }

  /**
   * Map PlayFab entries to our LeaderboardEntry format
   */
  private mapPlayFabEntries(entries: PlayFabLeaderboardResponse['Leaderboard']): LeaderboardEntry[] {
    return entries.map(entry => ({
      DisplayName: entry.DisplayName || 'Unknown',
      StatValue: entry.StatValue || 0,
      Position: entry.Position + 1, // Convert to 1-based ranking
      PlayFabId: entry.PlayFabId
    }));
  }
}

export const leaderboardAPI = LeaderboardAPI.getInstance();
