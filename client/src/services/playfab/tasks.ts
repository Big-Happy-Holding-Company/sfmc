/**
 * PlayFab Tasks Service
 * Manages task data retrieval from PlayFab Title Data
 * Handles caching and task lookup operations
 */

import type { PlayFabTask } from '@/types/playfab';
import { playFabCore } from './core';
import { playFabAuth } from './auth';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';

export class PlayFabTasks {
  private static instance: PlayFabTasks;
  private taskCache: PlayFabTask[] = [];
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): PlayFabTasks {
    if (!PlayFabTasks.instance) {
      PlayFabTasks.instance = new PlayFabTasks();
    }
    return PlayFabTasks.instance;
  }

  /**
   * Get all tasks from PlayFab Title Data
   * Uses caching to minimize API calls
   */
  public async getAllTasks(): Promise<PlayFabTask[]> {
    // Check if we have valid cached data
    if (this.isCacheValid()) {
      playFabCore.logOperation('Tasks Cache Hit', `${this.taskCache.length} tasks`);
      return this.taskCache;
    }

    // Ensure user is authenticated
    await playFabAuth.ensureAuthenticated();

    const request = {
      TitleId: playFabCore.getTitleId(),
      Keys: [PLAYFAB_CONSTANTS.TITLE_DATA_KEYS.TASKS]
    };

    try {
      const result = await playFabCore.promisifyPlayFabCall(
        PlayFab.ClientApi.GetTitleData,
        request
      );

      const tasksData = result?.Data?.[PLAYFAB_CONSTANTS.TITLE_DATA_KEYS.TASKS];
      if (tasksData) {
        const tasks: PlayFabTask[] = JSON.parse(tasksData);
        
        // Validate task data structure
        this.validateTaskData(tasks);
        
        // Update cache
        this.taskCache = tasks;
        this.lastCacheTime = Date.now();
        
        playFabCore.logOperation('Tasks Loaded from PlayFab', `${tasks.length} tasks`);
        return tasks;
      } else {
        console.warn('No tasks found in PlayFab Title Data');
        return [];
      }
    } catch (error) {
      playFabCore.logOperation('Tasks Load Failed', error);
      throw error;
    }
  }

  /**
   * Get a specific task by ID
   */
  public async getTaskById(id: string): Promise<PlayFabTask | null> {
    const allTasks = await this.getAllTasks();
    const task = allTasks.find(t => t.id === id) || null;
    
    if (task) {
      playFabCore.logOperation('Task Found', id);
    } else {
      playFabCore.logOperation('Task Not Found', id);
    }
    
    return task;
  }

  /**
   * Get tasks by category
   */
  public async getTasksByCategory(category: string): Promise<PlayFabTask[]> {
    const allTasks = await this.getAllTasks();
    const categoryTasks = allTasks.filter(task => task.category === category);
    
    playFabCore.logOperation('Tasks by Category', `${categoryTasks.length} in ${category}`);
    return categoryTasks;
  }

  /**
   * Get tasks by difficulty level
   */
  public async getTasksByDifficulty(difficulty: string): Promise<PlayFabTask[]> {
    const allTasks = await this.getAllTasks();
    const difficultyTasks = allTasks.filter(task => task.difficulty === difficulty);
    
    playFabCore.logOperation('Tasks by Difficulty', `${difficultyTasks.length} ${difficulty} tasks`);
    return difficultyTasks;
  }

  /**
   * Get tasks by rank requirement
   */
  public async getTasksByRankLevel(maxRankLevel: number): Promise<PlayFabTask[]> {
    const allTasks = await this.getAllTasks();
    const availableTasks = allTasks.filter(task => task.requiredRankLevel <= maxRankLevel);
    
    playFabCore.logOperation('Tasks by Rank', `${availableTasks.length} available for rank ${maxRankLevel}`);
    return availableTasks;
  }

  /**
   * Get task categories (unique list)
   */
  public async getCategories(): Promise<string[]> {
    const allTasks = await this.getAllTasks();
    const categories = [...new Set(allTasks.map(task => task.category))].sort();
    
    playFabCore.logOperation('Task Categories', categories);
    return categories;
  }

  /**
   * Get task difficulties (unique list)
   */
  public async getDifficulties(): Promise<string[]> {
    const allTasks = await this.getAllTasks();
    const difficulties = [...new Set(allTasks.map(task => task.difficulty))].sort();
    
    playFabCore.logOperation('Task Difficulties', difficulties);
    return difficulties;
  }

  /**
   * Force refresh the task cache
   */
  public async refreshTaskCache(): Promise<PlayFabTask[]> {
    this.clearCache();
    return await this.getAllTasks();
  }

  /**
   * Clear the task cache
   */
  public clearCache(): void {
    this.taskCache = [];
    this.lastCacheTime = 0;
    playFabCore.logOperation('Task Cache Cleared');
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    const cacheAge = Date.now() - this.lastCacheTime;
    return this.taskCache.length > 0 && cacheAge < this.CACHE_DURATION;
  }

  /**
   * Validate task data structure to ensure it matches expected format
   */
  private validateTaskData(tasks: any[]): void {
    if (!Array.isArray(tasks)) {
      throw new Error('Tasks data is not an array');
    }

    const requiredFields = [
      'id', 'title', 'description', 'category', 'difficulty', 
      'gridSize', 'basePoints', 'requiredRankLevel', 'examples',
      'testInput', 'testOutput', 'emojiSet', 'hints'
    ];

    tasks.forEach((task, index) => {
      requiredFields.forEach(field => {
        if (!(field in task)) {
          throw new Error(`Task ${index} missing required field: ${field}`);
        }
      });

      // Validate specific field types
      if (typeof task.id !== 'string') {
        throw new Error(`Task ${index}: id must be a string`);
      }
      if (typeof task.gridSize !== 'number') {
        throw new Error(`Task ${index}: gridSize must be a number`);
      }
      if (typeof task.basePoints !== 'number') {
        throw new Error(`Task ${index}: basePoints must be a number`);
      }
      if (!Array.isArray(task.examples)) {
        throw new Error(`Task ${index}: examples must be an array`);
      }
      if (!Array.isArray(task.testInput)) {
        throw new Error(`Task ${index}: testInput must be an array`);
      }
      if (!Array.isArray(task.testOutput)) {
        throw new Error(`Task ${index}: testOutput must be an array`);
      }
      if (!Array.isArray(task.hints)) {
        throw new Error(`Task ${index}: hints must be an array`);
      }
    });

    playFabCore.logOperation('Task Data Validation', 'All tasks valid');
  }

  /**
   * Get cache statistics
   */
  public getCacheInfo(): { count: number; ageMs: number; valid: boolean } {
    return {
      count: this.taskCache.length,
      ageMs: Date.now() - this.lastCacheTime,
      valid: this.isCacheValid()
    };
  }
}

// Export singleton instance
export const playFabTasks = PlayFabTasks.getInstance();