/**
 * PlayFab Leaderboards Service
 * Manages score submission, leaderboard retrieval, and ranking operations
 * Matches Unity's MainManager.cs GetLeaderboard functionality
 */

import type { LeaderboardEntry } from '@/types/playfab';
import { playFabCore } from './core';
import { playFabAuth } from './auth';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';

export class PlayFabLeaderboards {
  private static instance: PlayFabLeaderboards;
  private leaderboardCache: LeaderboardEntry[] = [];
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  private constructor() {}

  public static getInstance(): PlayFabLeaderboards {
    if (!PlayFabLeaderboards.instance) {
      PlayFabLeaderboards.instance = new PlayFabLeaderboards();
    }
    return PlayFabLeaderboards.instance;
  }

  /**
   * Submit score to leaderboard (matches Unity's UpdatePlayerStatistics)
   * MainManager.cs uses "LevelPoints" statistic name
   */
  public async submitScore(score: number): Promise<void> {
    await playFabAuth.ensureAuthenticated();

    const playFab = playFabCore.getPlayFab();
    const request = {
      Statistics: [{
        StatisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.LEVEL_POINTS,
        Value: score
      }]
    };

    try {
      await playFabCore.promisifyPlayFabCall(
        playFab.UpdatePlayerStatistics,
        request
      );

      // Clear cache since scores have changed
      this.clearCache();

      playFabCore.logOperation('Score Submitted', {
        statistic: PLAYFAB_CONSTANTS.STATISTIC_NAMES.LEVEL_POINTS,
        value: score
      });
    } catch (error) {
      playFabCore.logOperation('Score Submission Failed', error);
      throw error;
    }
  }

  /**
   * Get leaderboard (matches Unity's GetLeaderboard exactly)
   * MainManager.cs:267-307 implementation
   */
  public async getLeaderboard(maxResults: number = 10): Promise<LeaderboardEntry[]> {
    // Check cache first
    if (this.isCacheValid() && this.leaderboardCache.length > 0) {
      playFabCore.logOperation('Leaderboard Cache Hit', `${this.leaderboardCache.length} entries`);
      return this.leaderboardCache.slice(0, maxResults);
    }

    await playFabAuth.ensureAuthenticated();

    const playFab = playFabCore.getPlayFab();
    const request = {
      StatisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.LEVEL_POINTS,
      StartPosition: 0,
      MaxResultsCount: maxResults
    };

    try {
      const result = await playFabCore.promisifyPlayFabCall(
        playFab.GetLeaderboard,
        request
      );

      const entries: LeaderboardEntry[] = result.Leaderboard.map((entry: any) => ({
        DisplayName: entry.DisplayName || 'Unknown',
        StatValue: entry.StatValue || 0,
        Position: entry.Position + 1, // Convert to 1-based ranking
        PlayFabId: entry.PlayFabId
      }));

      // Update cache
      this.leaderboardCache = entries;
      this.lastCacheTime = Date.now();

      playFabCore.logOperation('Leaderboard Retrieved', `${entries.length} entries`);
      
      // Log top entries for debugging
      entries.slice(0, 3).forEach((entry, index) => {
        playFabCore.logOperation(`Leaderboard #${index + 1}`, 
          `${entry.DisplayName}: ${entry.StatValue} pts`
        );
      });

      return entries;
    } catch (error) {
      playFabCore.logOperation('Leaderboard Retrieval Failed', error);
      throw error;
    }
  }

  /**
   * Get leaderboard around a specific player
   */
  public async getLeaderboardAroundPlayer(
    playerId: string, 
    maxResults: number = 10
  ): Promise<LeaderboardEntry[]> {
    await playFabAuth.ensureAuthenticated();

    const playFab = playFabCore.getPlayFab();
    const request = {
      StatisticName: PLAYFAB_CONSTANTS.STATISTIC_NAMES.LEVEL_POINTS,
      PlayFabId: playerId,
      MaxResultsCount: maxResults
    };

    try {
      const result = await playFabCore.promisifyPlayFabCall(
        playFab.GetLeaderboardAroundPlayer,
        request
      );

      const entries: LeaderboardEntry[] = result.Leaderboard.map((entry: any) => ({
        DisplayName: entry.DisplayName || 'Unknown',
        StatValue: entry.StatValue || 0,
        Position: entry.Position + 1,
        PlayFabId: entry.PlayFabId
      }));

      playFabCore.logOperation('Player-Centered Leaderboard Retrieved', 
        `${entries.length} entries around ${playerId}`
      );

      return entries;
    } catch (error) {
      playFabCore.logOperation('Player-Centered Leaderboard Failed', error);
      throw error;
    }
  }

  /**
   * Get current player's ranking
   */
  public async getPlayerRanking(): Promise<LeaderboardEntry | null> {
    const currentPlayerId = playFabAuth.getPlayFabId();
    if (!currentPlayerId) {
      throw new Error('No current player ID available');
    }

    try {
      const aroundPlayerResults = await this.getLeaderboardAroundPlayer(currentPlayerId, 1);
      const playerEntry = aroundPlayerResults.find(entry => entry.PlayFabId === currentPlayerId);
      
      if (playerEntry) {
        playFabCore.logOperation('Player Ranking Retrieved', 
          `Rank: ${playerEntry.Position}, Score: ${playerEntry.StatValue}`
        );
        return playerEntry;
      } else {
        playFabCore.logOperation('Player Not Found in Leaderboard', currentPlayerId);
        return null;
      }
    } catch (error) {
      playFabCore.logOperation('Player Ranking Retrieval Failed', error);
      throw error;
    }
  }

  /**
   * Get top N players from leaderboard
   */
  public async getTopPlayers(count: number = 10): Promise<LeaderboardEntry[]> {
    const leaderboard = await this.getLeaderboard(count);
    return leaderboard.slice(0, count);
  }

  /**
   * Get leaderboard statistics
   */
  public async getLeaderboardStats(): Promise<{
    totalPlayers: number;
    highestScore: number;
    averageScore: number;
    playerRank?: number;
    playerScore?: number;
  }> {
    const leaderboard = await this.getLeaderboard(100); // Get larger sample
    const playerRanking = await this.getPlayerRanking();

    if (leaderboard.length === 0) {
      return {
        totalPlayers: 0,
        highestScore: 0,
        averageScore: 0
      };
    }

    const highestScore = leaderboard[0]?.StatValue || 0;
    const totalScore = leaderboard.reduce((sum, entry) => sum + entry.StatValue, 0);
    const averageScore = Math.round(totalScore / leaderboard.length);

    const stats = {
      totalPlayers: leaderboard.length,
      highestScore,
      averageScore,
      playerRank: playerRanking?.Position,
      playerScore: playerRanking?.StatValue
    };

    playFabCore.logOperation('Leaderboard Stats', stats);
    return stats;
  }

  /**
   * Refresh leaderboard data
   */
  public async refreshLeaderboard(maxResults: number = 10): Promise<LeaderboardEntry[]> {
    this.clearCache();
    return await this.getLeaderboard(maxResults);
  }

  /**
   * Clear leaderboard cache
   */
  public clearCache(): void {
    this.leaderboardCache = [];
    this.lastCacheTime = 0;
    playFabCore.logOperation('Leaderboard Cache Cleared');
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    const cacheAge = Date.now() - this.lastCacheTime;
    return this.leaderboardCache.length > 0 && cacheAge < this.CACHE_DURATION;
  }

  /**
   * Get cached leaderboard data
   */
  public getCachedLeaderboard(): LeaderboardEntry[] {
    return this.leaderboardCache;
  }

  /**
   * Get cache information
   */
  public getCacheInfo(): { 
    count: number; 
    ageMs: number; 
    valid: boolean;
    lastUpdate: Date | null;
  } {
    return {
      count: this.leaderboardCache.length,
      ageMs: Date.now() - this.lastCacheTime,
      valid: this.isCacheValid(),
      lastUpdate: this.lastCacheTime > 0 ? new Date(this.lastCacheTime) : null
    };
  }

  /**
   * Check if player is in top N
   */
  public async isPlayerInTop(topN: number): Promise<boolean> {
    const currentPlayerId = playFabAuth.getPlayFabId();
    if (!currentPlayerId) return false;

    const topPlayers = await this.getTopPlayers(topN);
    return topPlayers.some(entry => entry.PlayFabId === currentPlayerId);
  }

  /**
   * Get players better than current player
   */
  public async getPlayersAbove(): Promise<number> {
    const playerRanking = await this.getPlayerRanking();
    return playerRanking ? playerRanking.Position - 1 : 0;
  }
}

// Export singleton instance
export const playFabLeaderboards = PlayFabLeaderboards.getInstance();