/**
 * PlayFab Authentication Service
 * Handles anonymous login, display name generation, and session management
 * Matches Unity's PlayFabAnonDeviceLogin.cs functionality
 */

import type { AuthenticationResult, AnonymousNameResponse } from '@/types/playfab';
import { playFabCore } from './core';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';

export class PlayFabAuth {
  private static instance: PlayFabAuth;
  private isLoggedIn: boolean = false;
  private playFabId: string | null = null;
  private displayName: string | null = null;

  private constructor() {}

  public static getInstance(): PlayFabAuth {
    if (!PlayFabAuth.instance) {
      PlayFabAuth.instance = new PlayFabAuth();
    }
    return PlayFabAuth.instance;
  }

  /**
   * Anonymous authentication using device ID (matches Unity's approach)
   * PlayFabAnonDeviceLogin.cs:168-172
   */
  public async loginAnonymously(): Promise<AuthenticationResult> {
    playFabCore.logOperation('Anonymous Login', 'Starting...');
    
    const customId = this.getOrCreateDeviceId();

    const request = {
      TitleId: playFabCore.getTitleId(),
      CustomId: customId,
      CreateAccount: true,
      InfoRequestParameters: {
        GetPlayerProfile: true
      }
    };

    try {
      const PlayFab = playFabCore.getPlayFab();
      const result = await playFabCore.promisifyPlayFabCall(
        PlayFab.ClientApi.LoginWithCustomID,
        request
      ) as any;

      this.isLoggedIn = true;
      this.playFabId = result.PlayFabId;
      
      playFabCore.logOperation('Anonymous Login Success', result.PlayFabId);

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
    }
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
   * PlayFabAnonDeviceLogin.cs:166-172
   */
  private async handleDisplayName(loginData: any): Promise<void> {
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
   * Call CloudScript to generate anonymous name (matches Unity exactly)
   * PlayFabAnonDeviceLogin.cs:168-172
   */
  public async generateAnonymousName(): Promise<string> {
    const request = {
      TitleId: playFabCore.getTitleId(),
      FunctionName: PLAYFAB_CONSTANTS.CLOUDSCRIPT_FUNCTIONS.GENERATE_ANONYMOUS_NAME,
      GeneratePlayStreamEvent: false
    };

    try {
      const PlayFab = playFabCore.getPlayFab();
      const result = await playFabCore.promisifyPlayFabCall(
        PlayFab.ClientApi.ExecuteCloudScript,
        request
      ) as any;

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
   * Set user display name
   */
  public async setDisplayName(displayName: string): Promise<void> {
    const request = {
      TitleId: playFabCore.getTitleId(),
      DisplayName: displayName
    };

    try {
      const PlayFab = playFabCore.getPlayFab();
      const result = await playFabCore.promisifyPlayFabCall(
        PlayFab.ClientApi.UpdateUserTitleDisplayName,
        request
      ) as any;

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
    playFabCore.logOperation('User Logged Out');
  }

  /**
   * Ensure user is authenticated, login if necessary
   */
  public async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated()) {
      await this.loginAnonymously();
    }
  }
}

// Export singleton instance
export const playFabAuth = PlayFabAuth.getInstance();