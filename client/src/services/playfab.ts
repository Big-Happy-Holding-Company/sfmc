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
  timeLimit?: number;
  basePoints: number;
  requiredRankLevel: number;
  emojiSet: string;
  examples: Array<{
    input: number[][];
    output: number[][];
  }>;
  testInput: number[][];
  testOutput: number[][];
  hints: string[];
}

export interface LeaderboardEntry {
  DisplayName: string;
  StatValue: number;
  Position: number;
  PlayFabId: string;
}

class PlayFabService {
  private static instance: PlayFabService;
  private isLoggedIn = false;
  private playFabId: string | null = null;

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
        Keys: ['AllTasks']
      }, (result: any, error: any) => {
        if (error) {
          console.error('PlayFab GetTitleData error:', error);
          reject(error);
        } else {
          try {
            const tasksData = result.data?.Data?.AllTasks;
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
          const entries = result.data.Leaderboard.map(entry => ({
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