/**
 * Leaderboard Cache Manager
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Single responsibility: manage leaderboard caching across all types.
 * Completely separated from API calls and business logic.
 * 
 * HOW IT WORKS:
 * - Generic cache that works with any leaderboard type
 * - TTL-based cache invalidation
 * - Memory-efficient with configurable limits
 * 
 * HOW THE PROJECT USES IT:
 * - LeaderboardService uses this for all caching needs
 * - No leaderboard-specific code - works with any statistic name
 */

import type { LeaderboardEntry } from '@/types/playfab';

export interface CacheEntry {
  data: LeaderboardEntry[];
  timestamp: number;
  statisticName: string;
}

export interface CacheInfo {
  count: number;
  ageMs: number;
  valid: boolean;
  lastUpdate: Date | null;
}

export class LeaderboardCache {
  private static instance: LeaderboardCache;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_CACHE_SIZE = 50; // Prevent memory bloat

  private constructor() {}

  public static getInstance(): LeaderboardCache {
    if (!LeaderboardCache.instance) {
      LeaderboardCache.instance = new LeaderboardCache();
    }
    return LeaderboardCache.instance;
  }

  /**
   * Get cached data if valid
   */
  public get(statisticName: string, maxResults?: number): LeaderboardEntry[] | null {
    const entry = this.cache.get(statisticName);
    
    if (!entry || !this.isValid(entry)) {
      return null;
    }

    console.log(`[LeaderboardCache] Cache Hit for ${statisticName}: ${entry.data.length} entries`);
    return maxResults ? entry.data.slice(0, maxResults) : entry.data;
  }

  /**
   * Store data in cache
   */
  public set(statisticName: string, data: LeaderboardEntry[]): void {
    // Prevent cache bloat
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(statisticName, {
      data: [...data], // Deep copy to prevent mutations
      timestamp: Date.now(),
      statisticName
    });

    console.log(`[LeaderboardCache] Cache Set for ${statisticName}: ${data.length} entries`);
  }

  /**
   * Clear specific or all cache entries
   */
  public clear(statisticName?: string): void {
    if (statisticName) {
      this.cache.delete(statisticName);
      console.log(`[LeaderboardCache] Cache Cleared for ${statisticName}`);
    } else {
      this.cache.clear();
      console.log('[LeaderboardCache] All caches cleared');
    }
  }

  /**
   * Get cache information for debugging
   */
  public getInfo(statisticName: string): CacheInfo {
    const entry = this.cache.get(statisticName);
    
    if (!entry) {
      return {
        count: 0,
        ageMs: 0,
        valid: false,
        lastUpdate: null
      };
    }

    return {
      count: entry.data.length,
      ageMs: Date.now() - entry.timestamp,
      valid: this.isValid(entry),
      lastUpdate: new Date(entry.timestamp)
    };
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    const ageMs = Date.now() - entry.timestamp;
    return ageMs < this.CACHE_DURATION;
  }

  /**
   * Remove oldest cache entry to prevent bloat
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`[LeaderboardCache] Cache Evicted: ${oldestKey}`);
    }
  }

  /**
   * Get all cached statistics for debugging
   */
  public getAllCacheInfo(): Record<string, CacheInfo> {
    const info: Record<string, CacheInfo> = {};
    
    for (const [statisticName] of this.cache.entries()) {
      info[statisticName] = this.getInfo(statisticName);
    }
    
    return info;
  }
}

export const leaderboardCache = LeaderboardCache.getInstance();
