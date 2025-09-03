/**
 * PlayFab Core Service - Web SDK Implementation
 * Handles PlayFab initialization and API call management using playfab-web-sdk
 * Replaces CDN script loading approach with proper npm package imports
 */

import 'playfab-web-sdk/src/PlayFab/PlayFabClientApi.js';
import type { PlayFabConfig, PlayFabError, PlayFabServiceResult } from '@/types/playfab';

// Global PlayFab types after importing the SDK
declare global {
  const PlayFab: any;
  const PlayFabClientSDK: any;
}

export class PlayFabCore {
  private static instance: PlayFabCore;
  private titleId: string | null = null;
  private secretKey: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): PlayFabCore {
    if (!PlayFabCore.instance) {
      PlayFabCore.instance = new PlayFabCore();
    }
    return PlayFabCore.instance;
  }

  /**
   * Initialize PlayFab with configuration using web-sdk
   */
  public async initialize(config: PlayFabConfig): Promise<void> {
    this.titleId = config.titleId;
    this.secretKey = config.secretKey || null;

    // Set PlayFab settings
    PlayFab.settings.titleId = this.titleId;
    
    this.isInitialized = true;
    console.log(`✅ PlayFab Core initialized with Title ID: ${this.titleId}`);
  }

  /**
   * Check if PlayFab is properly initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.titleId !== null;
  }

  /**
   * Get Title ID
   */
  public getTitleId(): string {
    if (!this.titleId) {
      throw new Error('PlayFab not initialized. Call initialize() first.');
    }
    return this.titleId;
  }

  /**
   * Get Secret Key (for server-side operations)
   */
  public getSecretKey(): string | null {
    return this.secretKey;
  }

  /**
   * Standardized error handling for all PlayFab operations
   */
  public handleError(error: any): PlayFabError {
    if (error?.error && error?.errorMessage) {
      // PlayFab API error format
      return {
        error: error.error,
        errorCode: error.errorCode || 0,
        errorMessage: error.errorMessage,
        errorDetails: error.errorDetails || null
      };
    } else if (error?.message) {
      // Standard JavaScript error
      return {
        error: 'UnknownError',
        errorCode: -1,
        errorMessage: error.message,
        errorDetails: error
      };
    } else {
      // Fallback for unknown error formats
      return {
        error: 'UnknownError',
        errorCode: -1,
        errorMessage: 'An unknown error occurred',
        errorDetails: error
      };
    }
  }

  /**
   * Create a standardized service result
   */
  public createResult<T>(success: boolean, data?: T, error?: any): PlayFabServiceResult<T> {
    if (success) {
      return {
        success: true,
        data: data
      };
    } else {
      const playFabError = this.handleError(error);
      return {
        success: false,
        error: playFabError.errorMessage,
        errorDetails: playFabError
      };
    }
  }

  /**
   * Wrap PlayFab API calls in promises with standardized error handling
   * Updated for playfab-web-sdk callback pattern
   */
  public promisifyPlayFabCall<TRequest, TResult>(
    apiCall: (request: TRequest, callback: (error: any, result: any) => void) => void,
    request: TRequest
  ): Promise<TResult> {
    if (!this.isReady()) {
      return Promise.reject(new Error('PlayFab not initialized'));
    }

    return new Promise<TResult>((resolve, reject) => {
      apiCall(request, (error: any, result: any) => {
        if (error) {
          const playFabError = this.handleError(error);
          console.error(`❌ PlayFab API Error:`, playFabError);
          reject(playFabError);
        } else {
          resolve(result.data as TResult);
        }
      });
    });
  }

  /**
   * Log PlayFab operations for debugging
   */
  public logOperation(operation: string, details?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎮 PlayFab ${operation}:`, details || '');
    }
  }

  /**
   * Validate environment configuration
   */
  public validateEnvironment(): void {
    const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
    if (!titleId) {
      throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
    }
  }
}

// Export singleton instance
export const playFabCore = PlayFabCore.getInstance();