/**
 * Unified PlayFab Authentication Manager
 * 
 * Single Responsibility: Manage all PlayFab authentication states and tokens
 * DRY Compliance: Eliminates duplicate authentication logic across services
 * 
 * Handles:
 * - Anonymous login with device ID generation
 * - Session token management
 * - Display name generation via CloudScript
 * - Authentication state validation
 */

import { PLAYFAB_CONSTANTS } from '@/types/playfab';
import type { AuthenticationResult, AnonymousNameResponse } from '@/types/playfab';
import { playFabRequestManager } from './requestManager';

interface LoginResponse {
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

interface CloudScriptResponse {
  FunctionName: string;
  FunctionResult?: any;
  Error?: {
    Error: string;
    Message: string;
  };
}

interface DisplayNameResponse {
  DisplayName: string;
}

/**
 * Authentication state container
 */
interface AuthState {
  isAuthenticated: boolean;
  playFabId: string | null;
  displayName: string | null;
  sessionToken: string | null;
  deviceId: string | null;
}

/**
 * Unified Authentication Manager
 * Centralizes all authentication logic that was scattered across multiple services
 */
export class PlayFabAuthManager {
  private static instance: PlayFabAuthManager;
  private authState: AuthState;
  private loginPromise: Promise<AuthenticationResult> | null = null;

  private constructor() {
    this.authState = {
      isAuthenticated: false,
      playFabId: null,
      displayName: null,
      sessionToken: null,
      deviceId: this.loadDeviceId()
    };
  }

  public static getInstance(): PlayFabAuthManager {
    if (!PlayFabAuthManager.instance) {
      PlayFabAuthManager.instance = new PlayFabAuthManager();
    }
    return PlayFabAuthManager.instance;
  }

  /**
   * Get current authentication state
   */
  getAuthState(): Readonly<AuthState> {
    return { ...this.authState };
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && 
           this.authState.playFabId !== null && 
           this.authState.sessionToken !== null;
  }

  /**
   * Get current PlayFab ID
   */
  getPlayFabId(): string | null {
    return this.authState.playFabId;
  }

  /**
   * Get current display name
   */
  getDisplayName(): string | null {
    return this.authState.displayName;
  }

  /**
   * Get current session token for API requests
   */
  getSessionToken(): string | null {
    return this.authState.sessionToken;
  }

  /**
   * Anonymous login with automatic device ID management
   * Prevents concurrent login attempts and handles display name generation
   */
  async loginAnonymously(): Promise<AuthenticationResult> {
    // Prevent concurrent login attempts
    if (this.loginPromise) {
      return await this.loginPromise;
    }

    if (this.isAuthenticated()) {
      return {
        PlayFabId: this.authState.playFabId!,
        DisplayName: this.authState.displayName || undefined,
        NewlyCreated: false
      };
    }

    const request = {
      CustomId: this.getOrCreateDeviceId(),
      CreateAccount: true
    };

    this.loginPromise = (async () => {
      try {
        const result = await playFabRequestManager.makeRequest<typeof request, LoginResponse>(
          'loginWithCustomId',
          request
        );

        this.authState = {
          isAuthenticated: true,
          playFabId: result.PlayFabId,
          displayName: result.InfoResultPayload?.PlayerProfile?.DisplayName || null,
          sessionToken: result.SessionTicket,
          deviceId: this.authState.deviceId
        };

        // Handle display name generation for new users
        if (!this.authState.displayName) {
          await this.generateDisplayName();
        }

        return {
          PlayFabId: result.PlayFabId,
          DisplayName: this.authState.displayName || undefined,
          NewlyCreated: result.NewlyCreated
        };
      } finally {
        this.loginPromise = null;
      }
    })();

    return await this.loginPromise;
  }

  /**
   * Generate anonymous display name via CloudScript
   */
  async generateAnonymousName(): Promise<string> {
    const request = {
      FunctionName: PLAYFAB_CONSTANTS.CLOUDSCRIPT_FUNCTIONS.GENERATE_ANONYMOUS_NAME,
      GeneratePlayStreamEvent: false
    };

    const result = await playFabRequestManager.makeRequest<typeof request, CloudScriptResponse>(
      'executeCloudScript',
      request
    );

    if (result.Error) {
      throw new Error(`CloudScript error: ${result.Error.Error} - ${result.Error.Message}`);
    }

    const response = result.FunctionResult as AnonymousNameResponse;
    if (!response?.newName) {
      throw new Error('No name returned from CloudScript');
    }

    return response.newName;
  }

  /**
   * Update user display name
   */
  async setDisplayName(displayName: string): Promise<void> {
    const request = { DisplayName: displayName };

    const result = await playFabRequestManager.makeRequest<typeof request, DisplayNameResponse>(
      'updateUserTitleDisplayName',
      request
    );

    this.authState.displayName = result.DisplayName;
  }

  /**
   * Ensure user is authenticated, login if necessary
   */
  async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated()) {
      await this.loginAnonymously();
    }
  }

  /**
   * Clear authentication state (logout)
   */
  logout(): void {
    this.authState = {
      isAuthenticated: false,
      playFabId: null,
      displayName: null,
      sessionToken: null,
      deviceId: this.authState.deviceId // Preserve device ID
    };
  }

  /**
   * Update session token (used by strategy manager)
   */
  updateSessionToken(sessionToken: string): void {
    this.authState.sessionToken = sessionToken;
    this.authState.isAuthenticated = true;
  }

  /**
   * Device ID management for anonymous login
   */
  private loadDeviceId(): string | null {
    return localStorage.getItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID);
  }

  private getOrCreateDeviceId(): string {
    if (!this.authState.deviceId) {
      this.authState.deviceId = 'web_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(PLAYFAB_CONSTANTS.STORAGE_KEYS.DEVICE_ID, this.authState.deviceId);
    }
    return this.authState.deviceId;
  }

  /**
   * Handle display name generation for new users
   */
  private async generateDisplayName(): Promise<void> {
    try {
      const generatedName = await this.generateAnonymousName();
      await this.setDisplayName(generatedName);
    } catch (error) {
      // Fallback to simple anonymous name if CloudScript fails
      const fallbackName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
      await this.setDisplayName(fallbackName);
    }
  }
}

// Export singleton instance
export const playFabAuthManager = PlayFabAuthManager.getInstance();