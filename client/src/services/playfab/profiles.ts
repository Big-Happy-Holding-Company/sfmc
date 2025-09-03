/**
 * PlayFab Profiles Service
 * Manages player profiles and avatar system
 * Matches Unity's MainManager.cs GetPlayerProfile functionality (lines 309-330)
 */

import type { PlayerProfile, LeaderboardEntry } from '@/types/playfab';
import { playFabCore } from './core';
import { playFabAuth } from './auth';

export class PlayFabProfiles {
  private static instance: PlayFabProfiles;
  private profileCache = new Map<string, PlayerProfile>();
  private avatarUrlCache = new Map<string, string>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private cacheTimestamps = new Map<string, number>();

  private constructor() {}

  public static getInstance(): PlayFabProfiles {
    if (!PlayFabProfiles.instance) {
      PlayFabProfiles.instance = new PlayFabProfiles();
    }
    return PlayFabProfiles.instance;
  }

  /**
   * Get player profile (matches Unity's GetPlayerProfile exactly)
   * MainManager.cs:309-330 implementation
   */
  public async getPlayerProfile(playerId: string): Promise<PlayerProfile> {
    // Check cache first
    if (this.isProfileCached(playerId)) {
      const cachedProfile = this.profileCache.get(playerId)!;
      playFabCore.logOperation('Profile Cache Hit', playerId);
      return cachedProfile;
    }

    await playFabAuth.ensureAuthenticated();

    const playFab = playFabCore.getPlayFab();
    const request = {
      PlayFabId: playerId,
      ProfileConstraints: {
        ShowAvatarUrl: true,
        ShowDisplayName: true,
        ShowLastLogin: true,
        ShowCreated: true
      }
    };

    try {
      const result = await playFabCore.promisifyPlayFabCall(
        playFab.GetPlayerProfile,
        request
      );

      const profile: PlayerProfile = {
        PlayFabId: result.PlayerProfile.PlayFabId,
        DisplayName: result.PlayerProfile.DisplayName || 'Unknown',
        AvatarUrl: result.PlayerProfile.AvatarUrl || undefined
      };

      // Cache the profile
      this.cacheProfile(playerId, profile);

      playFabCore.logOperation('Profile Retrieved', {
        playerId,
        displayName: profile.DisplayName,
        hasAvatar: !!profile.AvatarUrl
      });

      return profile;
    } catch (error) {
      playFabCore.logOperation('Profile Retrieval Failed', { playerId, error });
      
      // Return fallback profile
      const fallbackProfile: PlayerProfile = {
        PlayFabId: playerId,
        DisplayName: 'Unknown Player'
      };
      
      return fallbackProfile;
    }
  }

  /**
   * Get multiple player profiles efficiently
   */
  public async getMultiplePlayerProfiles(playerIds: string[]): Promise<Map<string, PlayerProfile>> {
    const profiles = new Map<string, PlayerProfile>();
    const uncachedIds: string[] = [];

    // Check cache for each player
    playerIds.forEach(playerId => {
      if (this.isProfileCached(playerId)) {
        profiles.set(playerId, this.profileCache.get(playerId)!);
      } else {
        uncachedIds.push(playerId);
      }
    });

    // Fetch uncached profiles in parallel
    if (uncachedIds.length > 0) {
      const profilePromises = uncachedIds.map(playerId => 
        this.getPlayerProfile(playerId)
          .then(profile => ({ playerId, profile }))
          .catch(error => {
            playFabCore.logOperation('Profile Fetch Failed', { playerId, error });
            return {
              playerId,
              profile: { PlayFabId: playerId, DisplayName: 'Unknown Player' }
            };
          })
      );

      const results = await Promise.all(profilePromises);
      results.forEach(({ playerId, profile }) => {
        profiles.set(playerId, profile);
      });
    }

    playFabCore.logOperation('Multiple Profiles Retrieved', {
      requested: playerIds.length,
      cached: playerIds.length - uncachedIds.length,
      fetched: uncachedIds.length
    });

    return profiles;
  }

  /**
   * Enhance leaderboard entries with profile data (avatars, etc.)
   * This matches Unity's approach in MainManager.cs where it gets profiles for each leaderboard entry
   */
  public async enhanceLeaderboardWithProfiles(
    leaderboardEntries: LeaderboardEntry[]
  ): Promise<LeaderboardEntry[]> {
    const playerIds = leaderboardEntries.map(entry => entry.PlayFabId);
    const profiles = await this.getMultiplePlayerProfiles(playerIds);

    const enhancedEntries = leaderboardEntries.map(entry => {
      const profile = profiles.get(entry.PlayFabId);
      return {
        ...entry,
        Profile: profile
      };
    });

    playFabCore.logOperation('Leaderboard Enhanced with Profiles', 
      `${enhancedEntries.length} entries enhanced`
    );

    return enhancedEntries;
  }

  /**
   * Load avatar URL for a specific player
   * Used by Unity to load avatar images in leaderboard
   */
  public async loadAvatarUrl(playerId: string): Promise<string | null> {
    // Check cache first
    if (this.avatarUrlCache.has(playerId)) {
      return this.avatarUrlCache.get(playerId) || null;
    }

    try {
      const profile = await this.getPlayerProfile(playerId);
      const avatarUrl = profile.AvatarUrl || null;
      
      // Cache the avatar URL
      if (avatarUrl) {
        this.avatarUrlCache.set(playerId, avatarUrl);
      }

      return avatarUrl;
    } catch (error) {
      playFabCore.logOperation('Avatar URL Load Failed', { playerId, error });
      return null;
    }
  }

  /**
   * Set player avatar URL
   */
  public async setPlayerAvatar(avatarUrl: string): Promise<void> {
    await playFabAuth.ensureAuthenticated();

    const playFab = playFabCore.getPlayFab();
    const request = {
      ImageUrl: avatarUrl
    };

    try {
      await playFabCore.promisifyPlayFabCall(
        playFab.UpdateAvatarUrl,
        request
      );

      // Clear cached profile for current player
      const currentPlayerId = playFabAuth.getPlayFabId();
      if (currentPlayerId) {
        this.clearProfileCache(currentPlayerId);
        this.avatarUrlCache.set(currentPlayerId, avatarUrl);
      }

      playFabCore.logOperation('Avatar URL Updated', avatarUrl);
    } catch (error) {
      playFabCore.logOperation('Avatar URL Update Failed', error);
      throw error;
    }
  }

  /**
   * Get current player's profile
   */
  public async getCurrentPlayerProfile(): Promise<PlayerProfile | null> {
    const currentPlayerId = playFabAuth.getPlayFabId();
    if (!currentPlayerId) {
      return null;
    }

    try {
      return await this.getPlayerProfile(currentPlayerId);
    } catch (error) {
      playFabCore.logOperation('Current Player Profile Failed', error);
      return null;
    }
  }

  /**
   * Check if profile is cached and still valid
   */
  private isProfileCached(playerId: string): boolean {
    if (!this.profileCache.has(playerId)) return false;
    
    const cacheTime = this.cacheTimestamps.get(playerId) || 0;
    const age = Date.now() - cacheTime;
    
    return age < this.CACHE_DURATION;
  }

  /**
   * Cache a profile
   */
  private cacheProfile(playerId: string, profile: PlayerProfile): void {
    this.profileCache.set(playerId, profile);
    this.cacheTimestamps.set(playerId, Date.now());
  }

  /**
   * Clear cached profile for a specific player
   */
  public clearProfileCache(playerId: string): void {
    this.profileCache.delete(playerId);
    this.cacheTimestamps.delete(playerId);
    this.avatarUrlCache.delete(playerId);
    playFabCore.logOperation('Profile Cache Cleared', playerId);
  }

  /**
   * Clear all cached profiles
   */
  public clearAllProfileCaches(): void {
    this.profileCache.clear();
    this.cacheTimestamps.clear();
    this.avatarUrlCache.clear();
    playFabCore.logOperation('All Profile Caches Cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    profileCount: number;
    avatarCount: number;
    oldestCacheAge: number;
    newestCacheAge: number;
  } {
    const now = Date.now();
    const cacheAges = Array.from(this.cacheTimestamps.values()).map(time => now - time);
    
    return {
      profileCount: this.profileCache.size,
      avatarCount: this.avatarUrlCache.size,
      oldestCacheAge: cacheAges.length > 0 ? Math.max(...cacheAges) : 0,
      newestCacheAge: cacheAges.length > 0 ? Math.min(...cacheAges) : 0
    };
  }

  /**
   * Preload profiles for better UX
   */
  public async preloadProfiles(playerIds: string[]): Promise<void> {
    const uncachedIds = playerIds.filter(id => !this.isProfileCached(id));
    
    if (uncachedIds.length > 0) {
      playFabCore.logOperation('Preloading Profiles', `${uncachedIds.length} profiles`);
      await this.getMultiplePlayerProfiles(uncachedIds);
    }
  }

  /**
   * Validate avatar URL format
   */
  public static isValidAvatarUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const validProtocols = ['http:', 'https:'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      const isValidProtocol = validProtocols.includes(parsedUrl.protocol);
      const isValidExtension = validExtensions.some(ext => 
        parsedUrl.pathname.toLowerCase().endsWith(ext)
      );
      
      return isValidProtocol && isValidExtension;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const playFabProfiles = PlayFabProfiles.getInstance();