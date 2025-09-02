/*
 * PlayFab Service for React Frontend
 * 
 * Provides the same PlayFab functionality that Unity uses:
 * - Anonymous authentication
 * - Task data retrieval  
 * - User progress tracking
 * - Leaderboards
 * - Event logging
 */

// Global PlayFab object from CDN
declare const PlayFab: any;

// PlayFab configuration
const PLAYFAB_TITLE_ID = import.meta.env.VITE_PLAYFAB_TITLE_ID;

if (!PLAYFAB_TITLE_ID) {
  console.error('PlayFab Title ID not found. Please set VITE_PLAYFAB_TITLE_ID in your environment.');
}

// Initialize PlayFab
PlayFab.Client.settings.titleId = PLAYFAB_TITLE_ID;

export interface PlayFabTask {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  gridSize: number;
  timeLimit: number | null;
  basePoints: number;
  requiredRankLevel: number;
  examples: Array<{
    input: string[][];
    output: string[][];
  }>;
  testInput: string[][];
  testOutput: string[][];
  emojiSet: string;
  hints: string[];
}

export interface PlayFabPlayer {
  id: string; // PlayFab ID
  username: string; // Display name
  rank: string;
  rankLevel: number;
  totalPoints: number;
  completedMissions: number;
  currentTask?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  DisplayName: string;
  StatValue: number;
  Position: number;
  PlayFabId: string;
}

export interface TaskValidationResult {
  success: boolean; // Add for compatibility with GameResult
  correct: boolean;
  pointsEarned: number;
  timeBonus: number;
  hintPenalty: number;
  totalScore: number;
  message: string;
  basePoints?: number;
  speedBonus?: number;
  totalPoints?: number;
  newRank?: string;
  rankUp?: boolean;
  attempts?: number;
  hintsUsed?: number;
}

class PlayFabService {
  private static instance: PlayFabService;
  private isLoggedIn = false;
  private playFabId: string | null = null;
  private currentPlayer: PlayFabPlayer | null = null;

  private constructor() {}

  public static getInstance(): PlayFabService {
    if (!PlayFabService.instance) {
      PlayFabService.instance = new PlayFabService();
    }
    return PlayFabService.instance;
  }

  /**
   * Anonymous authentication (matches Unity's device login)
   */
  async loginAnonymously(): Promise<void> {
    return new Promise((resolve, reject) => {
      const customId = this.getOrCreateDeviceId();
      
      PlayFab.Client.LoginWithCustomID({
        CustomId: customId,
        CreateAccount: true,
        InfoRequestParameters: {
          GetPlayerProfile: true
        }
      }, (result: any, error: any) => {
        if (error) {
          console.error('PlayFab login error:', error);
          reject(error);
        } else {
          console.log('✅ PlayFab login successful:', result.data.PlayFabId);
          this.isLoggedIn = true;
          this.playFabId = result.data.PlayFabId;
          
          // Handle display name like Unity does
          this.handleDisplayName(result.data);
          resolve();
        }
      });
    });
  }

  /**
   * Get all tasks from PlayFab Title Data
   */
  async getAllTasks(): Promise<PlayFabTask[]> {
    if (!this.isLoggedIn) {
      await this.loginAnonymously();
    }

    return new Promise((resolve, reject) => {
      PlayFab.Client.GetTitleData({
        Keys: ['tasks.json']
      }, (result: any, error: any) => {
        if (error) {
          console.error('PlayFab GetTitleData error:', error);
          reject(error);
        } else {
          try {
            const tasksData = result.data?.Data?.['tasks.json'];
            if (tasksData) {
              const tasks: PlayFabTask[] = JSON.parse(tasksData);
              console.log(`✅ Loaded ${tasks.length} tasks from PlayFab`);
              resolve(tasks);
            } else {
              console.warn('No tasks found in PlayFab Title Data');
              resolve([]);
            }
          } catch (parseError) {
            console.error('Error parsing tasks data:', parseError);
            reject(parseError);
          }
        }
      });
    });
  }

  /**
   * Submit score to leaderboard (matches Unity's UpdatePlayerStatistics)
   */
  async submitScore(score: number): Promise<void> {
    if (!this.isLoggedIn) {
      await this.loginAnonymously();
    }

    return new Promise((resolve, reject) => {
      PlayFab.Client.UpdatePlayerStatistics({
        Statistics: [{
          StatisticName: 'LevelPoints', // Same as Unity
          Value: score
        }]
      }, (result: any, error: any) => {
        if (error) {
          console.error('PlayFab score submission error:', error);
          reject(error);
        } else {
          console.log('✅ Score submitted successfully to LevelPoints leaderboard');
          resolve();
        }
      });
    });
  }

  /**
   * Get leaderboard (matches Unity's GetLeaderboard)
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.isLoggedIn) {
      await this.loginAnonymously();
    }

    return new Promise((resolve, reject) => {
      PlayFab.Client.GetLeaderboard({
        StatisticName: 'LevelPoints',
        StartPosition: 0,
        MaxResultsCount: 10
      }, (result: any, error: any) => {
        if (error) {
          console.error('PlayFab leaderboard error:', error);
          reject(error);
        } else {
          const entries = result.data.Leaderboard.map((entry: any) => ({
            DisplayName: entry.DisplayName || 'Unknown',
            StatValue: entry.StatValue,
            Position: entry.Position,
            PlayFabId: entry.PlayFabId
          }));
          resolve(entries);
        }
      });
    });
  }

  /**
   * Log game event (matches Unity's WritePlayerEvent)
   */
  async logEvent(eventName: string, eventData: Record<string, any>): Promise<void> {
    if (!this.isLoggedIn) {
      await this.loginAnonymously();
    }

    return new Promise((resolve, reject) => {
      PlayFab.Client.WriteEvent({
        EventName: eventName,
        Body: eventData
      }, (result: any, error: any) => {
        if (error) {
          console.error('PlayFab event logging error:', error);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Generate or retrieve device ID for anonymous login
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('playfab_device_id');
    if (!deviceId) {
      deviceId = 'web_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('playfab_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Handle display name generation (matches Unity's approach)
   */
  private async handleDisplayName(loginData: any): Promise<void> {
    const displayName = loginData.InfoResultPayload?.PlayerProfile?.DisplayName;
    
    if (!displayName) {
      // Generate anonymous name like Unity does
      try {
        await this.generateAnonymousName();
      } catch (error) {
        console.warn('Failed to generate anonymous name:', error);
        // Fallback to simple anonymous name
        await this.setDisplayName(`Anonymous_${Math.floor(Math.random() * 100)}`);
      }
    }
  }

  /**
   * Call CloudScript to generate anonymous name (matches Unity)
   */
  private async generateAnonymousName(): Promise<void> {
    return new Promise((resolve, reject) => {
      PlayFab.Client.ExecuteCloudScript({
        FunctionName: 'GenerateAnonymousName',
        GeneratePlayStreamEvent: false
      }, (result: any, error: any) => {
        if (error || result.data.Error) {
          reject(error || result.data.Error);
        } else {
          const response = result.data.FunctionResult as { newName: string };
          if (response?.newName) {
            this.setDisplayName(response.newName).then(resolve).catch(reject);
          } else {
            reject(new Error('No name returned from CloudScript'));
          }
        }
      });
    });
  }

  /**
   * Set user display name
   */
  private async setDisplayName(displayName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      PlayFab.Client.UpdateUserTitleDisplayName({
        DisplayName: displayName
      }, (result: any, error: any) => {
        if (error) {
          reject(error);
        } else {
          console.log('✅ Display name updated:', result.data.DisplayName);
          resolve();
        }
      });
    });
  }

  /**
   * Get current player data from PlayFab User Data
   */
  async getPlayerData(): Promise<PlayFabPlayer | null> {
    if (!this.isLoggedIn || !this.playFabId) {
      await this.loginAnonymously();
    }

    return new Promise((resolve, reject) => {
      PlayFab.Client.GetUserData({}, (result: any, error: any) => {
        if (error) {
          console.error('PlayFab GetUserData error:', error);
          reject(error);
        } else {
          try {
            const userData = result.data?.Data || {};
            
            // Create player object from PlayFab data or defaults for new players
            const player: PlayFabPlayer = {
              id: this.playFabId!,
              username: userData.username?.Value || 'Anonymous',
              rank: userData.rank?.Value || 'Specialist 1',
              rankLevel: parseInt(userData.rankLevel?.Value || '1'),
              totalPoints: parseInt(userData.totalPoints?.Value || '0'),
              completedMissions: parseInt(userData.completedMissions?.Value || '0'),
              currentTask: userData.currentTask?.Value || undefined,
              createdAt: new Date(userData.createdAt?.Value || Date.now()),
              updatedAt: new Date()
            };
            
            this.currentPlayer = player;
            console.log('✅ Player data loaded:', player);
            resolve(player);
          } catch (parseError) {
            console.error('Error parsing player data:', parseError);
            reject(parseError);
          }
        }
      });
    });
  }

  /**
   * Update player data in PlayFab User Data
   */
  async updatePlayerData(updates: Partial<PlayFabPlayer>): Promise<void> {
    if (!this.isLoggedIn || !this.currentPlayer) {
      throw new Error('Player not logged in or data not loaded');
    }

    // Update local player data
    this.currentPlayer = { ...this.currentPlayer, ...updates, updatedAt: new Date() };

    return new Promise((resolve, reject) => {
      const dataToUpdate: Record<string, string> = {};
      
      if (updates.username) dataToUpdate.username = updates.username;
      if (updates.rank) dataToUpdate.rank = updates.rank;
      if (updates.rankLevel !== undefined) dataToUpdate.rankLevel = updates.rankLevel.toString();
      if (updates.totalPoints !== undefined) dataToUpdate.totalPoints = updates.totalPoints.toString();
      if (updates.completedMissions !== undefined) dataToUpdate.completedMissions = updates.completedMissions.toString();
      if (updates.currentTask) dataToUpdate.currentTask = updates.currentTask;
      dataToUpdate.updatedAt = new Date().toISOString();

      PlayFab.Client.UpdateUserData({
        Data: dataToUpdate
      }, (result: any, error: any) => {
        if (error) {
          console.error('PlayFab UpdateUserData error:', error);
          reject(error);
        } else {
          console.log('✅ Player data updated');
          resolve();
        }
      });
    });
  }

  /**
   * Validate task solution and update player progress
   */
  async validateSolution(taskId: string, solution: string[][], timeElapsed?: number, hintsUsed?: number): Promise<TaskValidationResult> {
    if (!this.currentPlayer) {
      throw new Error('Player data not loaded');
    }

    // Get the task to validate against
    const allTasks = await this.getAllTasks();
    const task = allTasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Simple solution validation (compare with expected output)
    const expectedOutput = task.testOutput;
    const isCorrect = this.arraysEqual(solution, expectedOutput);

    let pointsEarned = 0;
    let timeBonus = 0;
    let hintPenalty = 0;
    let message = '';

    if (isCorrect) {
      pointsEarned = task.basePoints;
      message = `Excellent work, ${this.currentPlayer.username}! Mission accomplished.`;
      
      // Calculate time bonus (if completed quickly)
      if (timeElapsed && timeElapsed < 60) {
        timeBonus = Math.max(0, Math.floor((60 - timeElapsed) / 10) * 10);
        pointsEarned += timeBonus;
      }
      
      // Apply hint penalty
      if (hintsUsed && hintsUsed > 0) {
        hintPenalty = hintsUsed * 5;
        pointsEarned = Math.max(0, pointsEarned - hintPenalty);
      }

      // Update player progress
      const newTotalPoints = this.currentPlayer.totalPoints + pointsEarned;
      const newCompletedMissions = this.currentPlayer.completedMissions + 1;
      
      // Update rank if necessary
      const newRankLevel = this.calculateRankLevel(newTotalPoints);
      const newRank = this.getRankName(newRankLevel);

      await this.updatePlayerData({
        totalPoints: newTotalPoints,
        completedMissions: newCompletedMissions,
        rankLevel: newRankLevel,
        rank: newRank
      });

      // Submit to leaderboard
      await this.submitScore(newTotalPoints);
      
    } else {
      message = `Mission failed, ${this.currentPlayer.username}. Review the examples and try again.`;
    }

    const result: TaskValidationResult = {
      success: isCorrect, // Same as correct for compatibility
      correct: isCorrect,
      pointsEarned,
      timeBonus,
      hintPenalty,
      totalScore: this.currentPlayer.totalPoints,
      message,
      basePoints: task.basePoints,
      speedBonus: timeBonus,
      totalPoints: this.currentPlayer.totalPoints,
      hintsUsed: hintsUsed || 0
    };

    return result;
  }

  /**
   * Helper function to compare 2D arrays
   */
  private arraysEqual(a: string[][], b: string[][]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].length !== b[i].length) return false;
      for (let j = 0; j < a[i].length; j++) {
        if (a[i][j] !== b[i][j]) return false;
      }
    }
    return true;
  }

  /**
   * Calculate rank level based on total points
   */
  private calculateRankLevel(totalPoints: number): number {
    // Simple rank progression: every 100 points = 1 rank level
    return Math.floor(totalPoints / 100) + 1;
  }

  /**
   * Get rank name based on rank level
   */
  private getRankName(rankLevel: number): string {
    const ranks = [
      'Specialist 1', 'Specialist 2', 'Specialist 3', 'Specialist 4',
      'Corporal', 'Sergeant', 'Staff Sergeant', 'Technical Sergeant',
      'Master Sergeant', 'Senior Master Sergeant', 'Chief Master Sergeant'
    ];
    return ranks[Math.min(rankLevel - 1, ranks.length - 1)] || 'Chief Master Sergeant';
  }

  /**
   * Get current player (cached)
   */
  getCurrentPlayer(): PlayFabPlayer | null {
    return this.currentPlayer;
  }

  /**
   * Get current player info
   */
  getPlayFabId(): string | null {
    return this.playFabId;
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
}

// Export singleton instance
export const playFabService = PlayFabService.getInstance();