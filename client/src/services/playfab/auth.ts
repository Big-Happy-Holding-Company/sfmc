/**
 * PlayFab Authentication Service - Pure HTTP Implementation
 * Handles anonymous login, display name generation, and session management
 * Direct REST API calls - no SDK dependencies
 */

import type { AuthenticationResult, AnonymousNameResponse } from '@/types/playfab';
import { playFabCore } from './core';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';

// PlayFab login response format
interface LoginWithCustomIDResponse {
  PlayFabId: string;
  SessionTicket: string;
  NewlyCreated: boolean;
  InfoResultPayload?: {
    PlayerProfile?: {
      DisplayName?: string;
      PlayerId: string;
    };
  };
}

// CloudScript execution response format
interface ExecuteCloudScriptResponse {
  FunctionName: string;
  FunctionResult?: any;
  Error?: {
    Error: string;
    Message: string;
  };
}

// Update display name response format
interface UpdateUserTitleDisplayNameResponse {
  DisplayName: string;
}

export class PlayFabAuth {
  private static instance: PlayFabAuth;
  private isLoggedIn: boolean = false;
  private playFabId: string | null = null;
  private displayName: string | null = null;
  private loginPromise: Promise<AuthenticationResult> | null = null;

  private constructor() {}

  public static getInstance(): PlayFabAuth {
    if (!PlayFabAuth.instance) {
      PlayFabAuth.instance = new PlayFabAuth();
    }
    return PlayFabAuth.instance;
  }

  /**
   * Anonymous authentication using device ID (HTTP implementation)
   */
  public async loginAnonymously(): Promise<AuthenticationResult> {
    // Prevent concurrent login attempts
    if (this.loginPromise) {
      playFabCore.logOperation('Anonymous Login', 'Already in progress, waiting...');
      return await this.loginPromise;
    }

    playFabCore.logOperation('Anonymous Login', 'Starting...');
    
    const customId = this.getOrCreateDeviceId();

    const request = {
      CustomId: customId,
      CreateAccount: true
      // Remove InfoRequestParameters as it's causing 400 error
      // We'll get profile data separately if needed
    };

    // Create and store the login promise
    this.loginPromise = (async () => {
      try {
        const result = await playFabCore.makeHttpRequest<typeof request, LoginWithCustomIDResponse>(
          '/Client/LoginWithCustomID',
          request,
          false // No auth required for login
        );

        // Store session data
        this.isLoggedIn = true;
        this.playFabId = result.PlayFabId;
        
        // Store session token in core for authenticated requests
        playFabCore.setSessionToken(result.SessionTicket);
        
        playFabCore.logOperation('Anonymous Login Success', {
          playFabId: result.PlayFabId,
          newlyCreated: result.NewlyCreated
        });

        // Handle display name like Unity does
        await this.handleDisplayName(result);

        return {
          PlayFabId: result.PlayFabId,
          DisplayName: this.displayName || undefined,
          NewlyCreated: result.NewlyCreated
        };
      } catch (error) {
        playFabCore.logOperation('Anonymous Login Failed', error);
        throw error;
      } finally {
        // Clear the promise when done (success or failure)
        this.loginPromise = null;
      }
    })();

    return await this.loginPromise;
  }

  /**
   * Generate or retrieve device ID for anonymous login
   * Same approach as Unity implementation
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = 'web_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID, deviceId);
      playFabCore.logOperation('Device ID Created', deviceId);
    }
    return deviceId;
  }

  /**
   * Handle display name generation (matches Unity's approach)
   */
  private async handleDisplayName(loginData: LoginWithCustomIDResponse): Promise<void> {
    const existingDisplayName = loginData.InfoResultPayload?.PlayerProfile?.DisplayName;
    
    if (!existingDisplayName) {
      // Generate anonymous name like Unity does via CloudScript
      try {
        const generatedName = await this.generateAnonymousName();
        await this.setDisplayName(generatedName);
        this.displayName = generatedName;
        playFabCore.logOperation('Anonymous Name Generated', generatedName);
      } catch (error) {
        console.warn('Failed to generate anonymous name via CloudScript:', error);
        // Fallback to simple anonymous name
        const fallbackName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
        await this.setDisplayName(fallbackName);
        this.displayName = fallbackName;
        playFabCore.logOperation('Fallback Name Used', fallbackName);
      }
    } else {
      this.displayName = existingDisplayName;
      playFabCore.logOperation('Existing Display Name', existingDisplayName);
    }
  }

  /**
   * Call CloudScript to generate anonymous name (HTTP implementation)
   */
  public async generateAnonymousName(): Promise<string> {
    const request = {
      FunctionName: PLAYFAB_CONSTANTS.CLOUDSCRIPT_FUNCTIONS.GENERATE_ANONYMOUS_NAME,
      GeneratePlayStreamEvent: false
    };

    try {
      const result = await playFabCore.makeHttpRequest<typeof request, ExecuteCloudScriptResponse>(
        '/Client/ExecuteCloudScript',
        request,
        true // Requires authentication
      );

      // Check for CloudScript execution errors
      if (result.Error) {
        throw new Error(`CloudScript error: ${result.Error.Error} - ${result.Error.Message}`);
      }

      const response = result.FunctionResult as AnonymousNameResponse;
      if (response?.newName) {
        return response.newName;
      } else {
        throw new Error('No name returned from CloudScript');
      }
    } catch (error) {
      playFabCore.logOperation('CloudScript Name Generation Failed', error);
      throw error;
    }
  }

  /**
   * Set user display name (HTTP implementation)
   */
  public async setDisplayName(displayName: string): Promise<void> {
    const request = {
      DisplayName: displayName
    };

    try {
      const result = await playFabCore.makeHttpRequest<typeof request, UpdateUserTitleDisplayNameResponse>(
        '/Client/UpdateUserTitleDisplayName',
        request,
        true // Requires authentication
      );

      this.displayName = result.DisplayName;
      playFabCore.logOperation('Display Name Updated', result.DisplayName);
    } catch (error) {
      playFabCore.logOperation('Display Name Update Failed', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.isLoggedIn && this.playFabId !== null;
  }

  /**
   * Get current PlayFab ID
   */
  public getPlayFabId(): string | null {
    return this.playFabId;
  }

  /**
   * Get current display name
   */
  public getDisplayName(): string | null {
    return this.displayName;
  }

  /**
   * Logout and clear session
   */
  public logout(): void {
    this.isLoggedIn = false;
    this.playFabId = null;
    this.displayName = null;
    playFabCore.clearSession();
    playFabCore.logOperation('User Logged Out');
  }

  /**
   * Ensure user is authenticated, login if necessary
   */
  public async ensureAuthenticated(): Promise<void> {
    // Initialize PlayFab core if not already done
    if (!playFabCore.isReady()) {
      const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
      if (!titleId) {
        throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not set');
      }
      await playFabCore.initialize({ titleId });
    }

    if (!this.isAuthenticated()) {
      await this.loginAnonymously();
    }
  }
}

// Export singleton instance
export const playFabAuth = PlayFabAuth.getInstance();