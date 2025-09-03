/**
 * PlayFab Service Facade
 * Unified API that aggregates all PlayFab services into a single interface
 * Provides backward compatibility with the original monolithic playfab.ts
 */

import type { 
  PlayFabConfig, 
  PlayFabTask, 
  PlayFabPlayer, 
  LeaderboardEntry,
  TaskValidationResult,
  CloudScriptValidationRequest,
  PuzzleEventData,
  GameSession,
  GameStatus,
  EventType,
  PlayerProfile,
  PlayFabServiceResult
} from '@/types/playfab';

// Import all service modules
import { playFabCore } from './core';
import { playFabAuth } from './auth';
import { playFabTasks } from './tasks';
import { playFabValidation } from './validation';
import { playFabEvents } from './events';
import { playFabUserData } from './userData';
import { playFabLeaderboards } from './leaderboards';
import { playFabProfiles } from './profiles';

export class PlayFabService {
  private static instance: PlayFabService;
  
  // Expose individual services for advanced usage
  public readonly core = playFabCore;
  public readonly auth = playFabAuth;
  public readonly tasks = playFabTasks;
  public readonly validation = playFabValidation;
  public readonly events = playFabEvents;
  public readonly userData = playFabUserData;
  public readonly leaderboards = playFabLeaderboards;
  public readonly profiles = playFabProfiles;

  private constructor() {}

  public static getInstance(): PlayFabService {
    if (!PlayFabService.instance) {
      PlayFabService.instance = new PlayFabService();
    }
    return PlayFabService.instance;
  }

  /**
   * Initialize PlayFab with configuration
   */
  public async initialize(): Promise<void> {
    const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
    if (!titleId) {
      throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
    }

    await this.core.initialize({ 
      titleId,
      secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY 
    });

    this.core.logOperation('PlayFab Service Initialized', { 
      titleId, 
      modulesLoaded: 8 
    });
  }

  // =============================================================================
  // UNIFIED API METHODS (Backward Compatibility)
  // =============================================================================

  /**
   * Login anonymously (unified API)
   */
  public async loginAnonymously(): Promise<void> {
    await this.auth.loginAnonymously();
  }

  /**
   * Get all tasks (unified API)
   */
  public async getAllTasks(): Promise<PlayFabTask[]> {
    return await this.tasks.getAllTasks();
  }

  /**
   * Get task by ID (unified API)
   */
  public async getTaskById(id: string): Promise<PlayFabTask | null> {
    return await this.tasks.getTaskById(id);
  }

  /**
   * Validate solution (SECURITY CRITICAL - now uses CloudScript)
   */
  public async validateSolution(
    taskId: string, 
    solution: string[][], 
    timeElapsed?: number, 
    hintsUsed?: number
  ): Promise<TaskValidationResult> {
    const request: CloudScriptValidationRequest = {
      taskId,
      solution,
      timeElapsed,
      hintsUsed,
      sessionId: this.events.getCurrentSession()?.sessionId,
      attemptId: this.events.getCurrentSession()?.attemptCount || 1
    };

    return await this.validation.validateSolution(request);
  }

  /**
   * Submit score to leaderboard (unified API)
   */
  public async submitScore(score: number): Promise<void> {
    return await this.leaderboards.submitScore(score);
  }

  /**
   * Get leaderboard (unified API)
   */
  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const leaderboard = await this.leaderboards.getLeaderboard();
    return await this.profiles.enhanceLeaderboardWithProfiles(leaderboard);
  }

  /**
   * Log simple event (unified API - backward compatibility)
   */
  public async logEvent(eventName: string, eventData: Record<string, any>): Promise<void> {
    return await this.events.logEvent(eventName, eventData);
  }

  /**
   * Get player data (unified API)
   */
  public async getPlayerData(): Promise<PlayFabPlayer> {
    return await this.userData.getPlayerData();
  }

  /**
   * Update player data (unified API)
   */
  public async updatePlayerData(updates: Partial<PlayFabPlayer>): Promise<void> {
    return await this.userData.updatePlayerData(updates);
  }

  /**
   * Get current player (cached, unified API)
   */
  public getCurrentPlayer(): PlayFabPlayer | null {
    return this.userData.getCurrentPlayer();
  }

  /**
   * Check if authenticated (unified API)
   */
  public isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  /**
   * Get PlayFab ID (unified API)
   */
  public getPlayFabId(): string | null {
    return this.auth.getPlayFabId();
  }

  // =============================================================================
  // ENHANCED GAME SESSION MANAGEMENT
  // =============================================================================

  /**
   * Start a game session with comprehensive logging
   */
  public async startGameSession(taskId: string): Promise<GameSession> {
    const session = this.events.startGameSession(taskId);
    
    // Set current task in user data
    await this.userData.setCurrentTask(taskId);
    
    return session;
  }

  /**
   * Complete a game with validation, scoring, and comprehensive logging
   */
  public async completeGame(
    taskId: string,
    solution: string[][],
    timeElapsed: number,
    hintsUsed: number = 0
  ): Promise<TaskValidationResult> {
    try {
      // Validate solution via CloudScript (secure)
      const validationResult = await this.validateSolution(
        taskId, 
        solution, 
        timeElapsed, 
        hintsUsed
      );

      // Update player progress if correct
      if (validationResult.correct) {
        await this.userData.addPoints(validationResult.pointsEarned, true);
        await this.leaderboards.submitScore(validationResult.totalScore);
      }

      // Increment attempt counter
      this.events.incrementAttempt();

      // End game session with comprehensive logging
      await this.events.endGameSession(
        validationResult.correct ? "won" : "fail",
        validationResult.pointsEarned
      );

      // Clear current task
      await this.userData.setCurrentTask(undefined);

      this.core.logOperation('Game Completed', {
        taskId,
        correct: validationResult.correct,
        points: validationResult.pointsEarned,
        timeElapsed,
        hintsUsed
      });

      return validationResult;
    } catch (error) {
      // Log failure and end session
      await this.events.endGameSession("fail", 0);
      this.core.logOperation('Game Completion Failed', error);
      throw error;
    }
  }

  /**
   * Abandon current game
   */
  public async abandonGame(): Promise<void> {
    await this.events.endGameSession("stop");
    await this.userData.setCurrentTask(undefined);
    this.core.logOperation('Game Abandoned');
  }

  // =============================================================================
  // COMPREHENSIVE GAME STATISTICS
  // =============================================================================

  /**
   * Get comprehensive player statistics
   */
  public async getPlayerStats(): Promise<{
    player: PlayFabPlayer;
    ranking: LeaderboardEntry | null;
    stats: any;
    leaderboardStats: any;
  }> {
    const [player, ranking, leaderboardStats] = await Promise.all([
      this.userData.getPlayerData(),
      this.leaderboards.getPlayerRanking(),
      this.leaderboards.getLeaderboardStats()
    ]);

    const stats = this.userData.getPlayerStats();

    return {
      player,
      ranking,
      stats,
      leaderboardStats
    };
  }

  /**
   * Get service health status
   */
  public async getServiceHealth(): Promise<{
    core: boolean;
    auth: boolean;
    cloudScript: boolean;
    services: {
      tasks: { cached: number; valid: boolean };
      leaderboards: { cached: number; valid: boolean };
      profiles: { cached: number };
    };
  }> {
    const [cloudScriptHealth] = await Promise.allSettled([
      this.validation.testCloudScriptConnection()
    ]);

    return {
      core: this.core.isReady(),
      auth: this.auth.isAuthenticated(),
      cloudScript: cloudScriptHealth.status === 'fulfilled' ? cloudScriptHealth.value : false,
      services: {
        tasks: { ...this.tasks.getCacheInfo(), cached: 0 },
        leaderboards: { ...this.leaderboards.getCacheInfo(), cached: 0 },
        profiles: { ...this.profiles.getCacheStats(), cached: 0 }
      }
    };
  }

  /**
   * Clear all caches (for testing/debugging)
   */
  public clearAllCaches(): void {
    this.tasks.clearCache();
    this.leaderboards.clearCache();
    this.profiles.clearAllProfileCaches();
    this.core.logOperation('All Caches Cleared');
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Ensure all services are ready
   */
  public async ensureReady(): Promise<void> {
    if (!this.core.isReady()) {
      this.initialize();
    }
    
    if (!this.auth.isAuthenticated()) {
      await this.auth.loginAnonymously();
    }
    
    // Pre-load essential data
    await Promise.allSettled([
      this.userData.getPlayerData(),
      this.tasks.getAllTasks()
    ]);

    this.core.logOperation('Service Ready', 'All systems initialized');
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export singleton instance (main interface)
export const playFabService = PlayFabService.getInstance();

// Export individual services for advanced usage
export {
  playFabCore,
  playFabAuth,
  playFabTasks,
  playFabValidation,
  playFabEvents,
  playFabUserData,
  playFabLeaderboards,
  playFabProfiles
};

// Export types
export type * from '@/types/playfab';

// Initialize service on module load
(async () => {
  try {
    await playFabService.initialize();
  } catch (error) {
    console.error('Failed to initialize PlayFab Service:', error);
  }
})();