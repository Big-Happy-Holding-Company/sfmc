/**
 * PlayFab Core Service
 * Base infrastructure for all PlayFab operations
 * Handles connection, configuration, and error management
 */

import type { PlayFabConfig, PlayFabError, PlayFabServiceResult } from '@/types/playfab';

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
   * Initialize PlayFab with configuration
   */
  public async initialize(config: PlayFabConfig): Promise<void> {
    this.titleId = config.titleId;
    this.secretKey = config.secretKey || null;

    // Load PlayFab SDK first
    await this.loadPlayFabSDK();

    // Initialize PlayFab SDK
    if (typeof window !== 'undefined' && window.PlayFab && window.PlayFab.Client) {
      window.PlayFab.settings.titleId = this.titleId;
      this.isInitialized = true;
      console.log(`✅ PlayFab Core initialized with Title ID: ${this.titleId}`);
    } else {
      console.warn('PlayFab Client API not available, continuing in offline mode');
      this.isInitialized = false;
    }
  }

  /**
   * Load PlayFab SDK from CDN with timeout
   */
  private loadPlayFabSDK(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined') {
        console.error('PlayFab SDK can only be loaded in the browser');
        return resolve();
      }

      // Check if already loaded
      if (window.PlayFab && window.PlayFab.Client) {
        console.log('PlayFab SDK already loaded');
        return resolve();
      }

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.warn('PlayFab SDK loading timed out after 10 seconds');
        resolve();
      }, 10000);

      // Load the SDK
      const script = document.createElement('script');
      script.src = 'https://download.playfab.com/PlayFabClientApi.js';
      script.async = true;
      script.onload = () => {
        clearTimeout(timeout);
        // Add delay to ensure Client API is fully loaded
        setTimeout(() => {
          if (window.PlayFab && window.PlayFab.Client) {
            console.log('PlayFab SDK loaded successfully');
          } else {
            console.error('PlayFab Client API not available after loading');
          }
          resolve();
        }, 100);
      };
      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Error loading PlayFab SDK:', error);
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Check if PlayFab is properly initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.titleId !== null && typeof window !== 'undefined' && window.PlayFab && window.PlayFab.Client;
  }

  /**
   * Get the global PlayFab object
   */
  public getPlayFab(): any {
    if (!this.isReady()) {
      throw new Error('PlayFab not initialized. Call initialize() first.');
    }
    return window.PlayFab;
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
   */
  public promisifyPlayFabCall<TRequest, TResult>(
    apiCall: (request: TRequest, callback: (result: any, error: any) => void) => void,
    request: TRequest
  ): Promise<TResult> {
    if (!this.isReady()) {
      return Promise.reject(new Error('PlayFab not initialized'));
    }

    return new Promise<TResult>((resolve, reject) => {
      apiCall.call(this.getPlayFab().Client, request, (result: any, error: any) => {
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

    if (typeof PlayFab === 'undefined') {
      throw new Error('PlayFab SDK not loaded. Include PlayFab CDN script in your HTML.');
    }
  }
}

// Export singleton instance
export const playFabCore = PlayFabCore.getInstance();