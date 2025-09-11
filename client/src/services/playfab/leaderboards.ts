/**
 * Leaderboard Service - Clean Orchestration Layer
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Orchestrates leaderboard operations using modular components.
 * Configuration-driven - adding leaderboards requires zero code changes.
 * 
 * HOW IT WORKS:
 * - Uses LeaderboardAPI for HTTP calls
 * - Uses LeaderboardCache for caching
 * - Uses LeaderboardTypes for configuration
 * - Provides clean, simple interface to UI components
 * 
 * HOW THE PROJECT USES IT:
 * - UI components call simple methods like getLeaderboard(LeaderboardType.GLOBAL)
 * - All complexity hidden behind clean interface
 */

import type { LeaderboardEntry } from '@/types/playfab';
import { playFabAuthManager } from './authManager';
import { leaderboardAPI } from './leaderboard-api';
import { leaderboardCache } from './leaderboard-cache';
import { 
  LeaderboardType, 
  getLeaderboardConfig, 
  getEnabledLeaderboards 
} from './leaderboard-types';

export class LeaderboardService {
  private static instance: LeaderboardService;

  private constructor() {}

  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  /**
   * Get leaderboard by type - works for any configured leaderboard
   */
  public async getLeaderboard(
    type: LeaderboardType, 
    maxResults: number = 10
  ): Promise<LeaderboardEntry[]> {
    const config = getLeaderboardConfig(type);
    
    // Try cache first
    const cached = leaderboardCache.get(config.statisticName, maxResults);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const entries = await leaderboardAPI.getLeaderboard(config.statisticName, 0, maxResults);
    
    // Cache results
    leaderboardCache.set(config.statisticName, entries);
    
    console.log(`[LeaderboardService] Leaderboard Retrieved: ${entries.length} entries for ${config.displayName}`);
    return entries;
  }

  /**
   * Submit score to specific leaderboard type
   */
  public async submitScore(type: LeaderboardType, score: number): Promise<void> {
    const config = getLeaderboardConfig(type);
    await leaderboardAPI.submitScore(config.statisticName, score);
    
    // Clear cache since scores changed
    leaderboardCache.clear(config.statisticName);
  }

  /**
   * Get player's ranking in specific leaderboard
   */
  public async getPlayerRanking(type: LeaderboardType): Promise<LeaderboardEntry | null> {
    const currentPlayerId = playFabAuthManager.getPlayFabId();
    if (!currentPlayerId) {
      throw new Error('No current player ID available');
    }

    const config = getLeaderboardConfig(type);
    const results = await leaderboardAPI.getLeaderboardAroundPlayer(
      config.statisticName, 
      currentPlayerId, 
      1
    );
    
    const playerEntry = results.find(entry => entry.PlayFabId === currentPlayerId);
    
    if (playerEntry) {
      console.log(`[LeaderboardService] Player Ranking Retrieved for ${config.displayName}: Rank ${playerEntry.Position}, Score ${playerEntry.StatValue}`);
    }
    
    return playerEntry || null;
  }

  /**
   * Get leaderboard statistics for any type
   */
  public async getLeaderboardStats(type: LeaderboardType): Promise<{
    totalPlayers: number;
    highestScore: number;
    averageScore: number;
    playerRank?: number;
    playerScore?: number;
  }> {
    const [leaderboard, playerRanking] = await Promise.all([
      this.getLeaderboard(type, 100), // Get larger sample
      this.getPlayerRanking(type)
    ]);

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

    return {
      totalPlayers: leaderboard.length,
      highestScore,
      averageScore,
      playerRank: playerRanking?.Position,
      playerScore: playerRanking?.StatValue
    };
  }

  /**
   * Refresh specific leaderboard
   */
  public async refreshLeaderboard(type: LeaderboardType, maxResults: number = 10): Promise<LeaderboardEntry[]> {
    const config = getLeaderboardConfig(type);
    leaderboardCache.clear(config.statisticName);
    return this.getLeaderboard(type, maxResults);
  }

  /**
   * Get all enabled leaderboard configurations for UI
   */
  public getAvailableLeaderboards() {
    return getEnabledLeaderboards();
  }

  /**
   * Check if player is in top N for specific leaderboard
   */
  public async isPlayerInTop(type: LeaderboardType, topN: number): Promise<boolean> {
    const currentPlayerId = playFabAuthManager.getPlayFabId();
    if (!currentPlayerId) return false;

    const topPlayers = await this.getLeaderboard(type, topN);
    return topPlayers.some(entry => entry.PlayFabId === currentPlayerId);
  }

  /**
   * Get cache information for debugging
   */
  public getCacheInfo(type: LeaderboardType) {
    const config = getLeaderboardConfig(type);
    return leaderboardCache.getInfo(config.statisticName);
  }

  /**
   * Clear all caches
   */
  public clearAllCaches(): void {
    leaderboardCache.clear();
  }
}

// Export singleton instance
export const leaderboards = LeaderboardService.getInstance();

// Backward compatibility exports
export const playFabLeaderboards = leaderboards;
