/**
 * PlayFab User Data Service
 * Manages player profiles, rank progression, and progress tracking
 * Maintains compatibility with Unity's player data structure
 */

import type { PlayFabPlayer, RankLevel } from '@/types/playfab';
import { playFabCore } from './core';
import { playFabAuth } from './auth';

export class PlayFabUserData {
  private static instance: PlayFabUserData;
  private currentPlayer: PlayFabPlayer | null = null;

  private constructor() {}

  public static getInstance(): PlayFabUserData {
    if (!PlayFabUserData.instance) {
      PlayFabUserData.instance = new PlayFabUserData();
    }
    return PlayFabUserData.instance;
  }

  /**
   * Get current player data from PlayFab User Data
   * Creates default player data for new users
   */
  public async getPlayerData(): Promise<PlayFabPlayer> {
    await playFabAuth.ensureAuthenticated();

    const playFabId = playFabAuth.getPlayFabId();
    if (!playFabId) {
      throw new Error('No PlayFab ID available');
    }

    const playFab = playFabCore.getPlayFab();
    
    try {
      const result = await playFabCore.promisifyPlayFabCall(
        playFab.Client.GetUserData,
        {}
      );

      const userData = result?.Data || {};
      
      // Create player object from PlayFab data or defaults for new players
      const player: PlayFabPlayer = {
        id: playFabId,
        username: userData.username?.Value || playFabAuth.getDisplayName() || 'Anonymous',
        rank: userData.rank?.Value || 'Specialist 1',
        rankLevel: parseInt(userData.rankLevel?.Value || '1'),
        totalPoints: parseInt(userData.totalPoints?.Value || '0'),
        completedMissions: parseInt(userData.completedMissions?.Value || '0'),
        currentTask: userData.currentTask?.Value || undefined,
        createdAt: new Date(userData.createdAt?.Value || Date.now()),
        updatedAt: new Date()
      };
      
      this.currentPlayer = player;
      playFabCore.logOperation('Player Data Loaded', {
        id: player.id,
        username: player.username,
        rank: player.rank,
        totalPoints: player.totalPoints,
        missions: player.completedMissions
      });

      // Initialize new player data if this is a first-time user
      if (!userData.createdAt) {
        await this.initializeNewPlayer(player);
      }

      return player;
    } catch (error) {
      playFabCore.logOperation('Player Data Load Failed', error);
      throw error;
    }
  }

  /**
   * Update player data in PlayFab User Data
   */
  public async updatePlayerData(updates: Partial<PlayFabPlayer>): Promise<void> {
    if (!this.currentPlayer) {
      throw new Error('Player data not loaded. Call getPlayerData() first.');
    }

    // Update local player data
    this.currentPlayer = { ...this.currentPlayer, ...updates, updatedAt: new Date() };

    const playFab = playFabCore.getPlayFab();
    const dataToUpdate: Record<string, string> = {};

    // Convert player data to PlayFab UserData format
    if (updates.username) dataToUpdate.username = updates.username;
    if (updates.rank) dataToUpdate.rank = updates.rank;
    if (updates.rankLevel !== undefined) dataToUpdate.rankLevel = updates.rankLevel.toString();
    if (updates.totalPoints !== undefined) dataToUpdate.totalPoints = updates.totalPoints.toString();
    if (updates.completedMissions !== undefined) dataToUpdate.completedMissions = updates.completedMissions.toString();
    if (updates.currentTask) dataToUpdate.currentTask = updates.currentTask;
    dataToUpdate.updatedAt = new Date().toISOString();

    try {
      await playFabCore.promisifyPlayFabCall(
        playFab.Client.UpdateUserData,
        { Data: dataToUpdate }
      );

      playFabCore.logOperation('Player Data Updated', Object.keys(dataToUpdate));
    } catch (error) {
      playFabCore.logOperation('Player Data Update Failed', error);
      throw error;
    }
  }

  /**
   * Add points and update rank progression
   */
  public async addPoints(points: number, missionCompleted: boolean = false): Promise<{
    newTotalPoints: number;
    newRank: string;
    rankUp: boolean;
    newCompletedMissions: number;
  }> {
    if (!this.currentPlayer) {
      throw new Error('Player data not loaded');
    }

    const oldRankLevel = this.currentPlayer.rankLevel;
    const newTotalPoints = this.currentPlayer.totalPoints + points;
    const newRankLevel = this.calculateRankLevel(newTotalPoints);
    const newRank = this.getRankName(newRankLevel);
    const rankUp = newRankLevel > oldRankLevel;
    const newCompletedMissions = missionCompleted 
      ? this.currentPlayer.completedMissions + 1 
      : this.currentPlayer.completedMissions;

    // Update player data
    await this.updatePlayerData({
      totalPoints: newTotalPoints,
      rankLevel: newRankLevel,
      rank: newRank,
      completedMissions: newCompletedMissions
    });

    playFabCore.logOperation('Points Added', {
      points,
      newTotal: newTotalPoints,
      rankUp,
      newRank
    });

    return {
      newTotalPoints,
      newRank,
      rankUp,
      newCompletedMissions
    };
  }

  /**
   * Set current task being worked on
   */
  public async setCurrentTask(taskId: string | undefined): Promise<void> {
    await this.updatePlayerData({ currentTask: taskId });
  }

  /**
   * Calculate rank level based on total points
   * Matches Unity's rank progression system
   */
  public calculateRankLevel(totalPoints: number): RankLevel {
    // Rank progression: every 1000 points = 1 rank level, max 11 levels
    const calculatedLevel = Math.floor(totalPoints / 1000) + 1;
    return Math.min(calculatedLevel, 11) as RankLevel;
  }

  /**
   * Get rank name based on rank level
   * Matches Unity's rank naming system
   */
  public getRankName(rankLevel: RankLevel): string {
    const ranks = [
      'Specialist 1',      // Level 1
      'Specialist 2',      // Level 2  
      'Specialist 3',      // Level 3
      'Specialist 4',      // Level 4
      'Corporal',          // Level 5
      'Sergeant',          // Level 6
      'Staff Sergeant',    // Level 7
      'Technical Sergeant', // Level 8
      'Master Sergeant',   // Level 9
      'Senior Master Sergeant', // Level 10
      'Chief Master Sergeant'   // Level 11+
    ];
    return ranks[rankLevel - 1] || 'Chief Master Sergeant';
  }

  /**
   * Get points needed for next rank
   */
  public getPointsToNextRank(currentPoints: number): number {
    const currentLevel = this.calculateRankLevel(currentPoints);
    if (currentLevel >= 11) return 0; // Max rank reached

    const nextLevelPoints = currentLevel * 1000;
    return Math.max(0, nextLevelPoints - currentPoints);
  }

  /**
   * Get current player (cached)
   */
  public getCurrentPlayer(): PlayFabPlayer | null {
    return this.currentPlayer;
  }

  /**
   * Initialize new player with default data
   */
  private async initializeNewPlayer(player: PlayFabPlayer): Promise<void> {
    const initialData = {
      createdAt: new Date().toISOString(),
      username: player.username,
      rank: 'Specialist 1',
      rankLevel: '1',
      totalPoints: '0',
      completedMissions: '0',
      updatedAt: new Date().toISOString()
    };

    const playFab = playFabCore.getPlayFab();
    
    try {
      await playFabCore.promisifyPlayFabCall(
        playFab.Client.UpdateUserData,
        { Data: initialData }
      );

      playFabCore.logOperation('New Player Initialized', player.username);
    } catch (error) {
      console.error('Failed to initialize new player:', error);
    }
  }

  /**
   * Reset player data (for testing purposes)
   */
  public async resetPlayerData(): Promise<void> {
    const resetData = {
      rank: 'Specialist 1',
      rankLevel: '1',
      totalPoints: '0',
      completedMissions: '0',
      currentTask: '',
      updatedAt: new Date().toISOString()
    };

    const playFab = playFabCore.getPlayFab();
    
    try {
      await playFabCore.promisifyPlayFabCall(
        playFab.Client.UpdateUserData,
        { Data: resetData }
      );

      // Update local cache
      if (this.currentPlayer) {
        this.currentPlayer = {
          ...this.currentPlayer,
          rank: 'Specialist 1',
          rankLevel: 1,
          totalPoints: 0,
          completedMissions: 0,
          currentTask: undefined,
          updatedAt: new Date()
        };
      }

      playFabCore.logOperation('Player Data Reset');
    } catch (error) {
      playFabCore.logOperation('Player Data Reset Failed', error);
      throw error;
    }
  }

  /**
   * Get player statistics summary
   */
  public getPlayerStats(): {
    totalPoints: number;
    completedMissions: number;
    currentRank: string;
    rankLevel: RankLevel;
    pointsToNextRank: number;
    progressPercentage: number;
  } | null {
    if (!this.currentPlayer) return null;

    const pointsToNext = this.getPointsToNextRank(this.currentPlayer.totalPoints);
    const currentLevelBase = (this.currentPlayer.rankLevel - 1) * 1000;
    const pointsInCurrentLevel = this.currentPlayer.totalPoints - currentLevelBase;
    const progressPercentage = this.currentPlayer.rankLevel >= 11 
      ? 100 
      : (pointsInCurrentLevel / 1000) * 100;

    return {
      totalPoints: this.currentPlayer.totalPoints,
      completedMissions: this.currentPlayer.completedMissions,
      currentRank: this.currentPlayer.rank,
      rankLevel: this.currentPlayer.rankLevel as RankLevel,
      pointsToNextRank: pointsToNext,
      progressPercentage: Math.round(progressPercentage)
    };
  }
}

// Export singleton instance
export const playFabUserData = PlayFabUserData.getInstance();