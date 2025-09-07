/**
 * Leaderboard API Layer
 * Author: Cascade
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
import { playFabAuth } from './auth';

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
    await playFabAuth.ensureAuthenticated();

    const request: UpdatePlayerStatisticsRequest = {
      Statistics: [{
        StatisticName: statisticName,
        Value: score
      }]
    };

    try {
      await playFabCore.makeHttpRequest<UpdatePlayerStatisticsRequest, {}>(
        '/Client/UpdatePlayerStatistics',
        request,
        true
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
    await playFabAuth.ensureAuthenticated();

    const request: GetLeaderboardRequest = {
      StatisticName: statisticName,
      StartPosition: startPosition,
      MaxResultsCount: maxResults
    };

    try {
      const result = await playFabCore.makeHttpRequest<GetLeaderboardRequest, PlayFabLeaderboardResponse>(
        '/Client/GetLeaderboard',
        request,
        true
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
    await playFabAuth.ensureAuthenticated();

    const request: GetLeaderboardAroundPlayerRequest = {
      StatisticName: statisticName,
      PlayFabId: playerId,
      MaxResultsCount: maxResults
    };

    try {
      const result = await playFabCore.makeHttpRequest<GetLeaderboardAroundPlayerRequest, PlayFabLeaderboardResponse>(
        '/Client/GetLeaderboardAroundPlayer',
        request,
        true
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
