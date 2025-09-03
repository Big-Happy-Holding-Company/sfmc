/**
 * PlayFab Core Service
 * Base infrastructure for all PlayFab operations
 * Handles connection, configuration, and error management
 */

import type { PlayFabConfig, PlayFabError, PlayFabServiceResult } from '@/types/playfab';

// Global PlayFab types - SDK now uses PlayFabClientSDK
declare global {
  interface Window {
    PlayFab: any;
    PlayFabClientSDK: any;
  }
}

// Type assertions for window objects
const getPlayFab = () => (window as any).PlayFab;
const getPlayFabClientSDK = () => (window as any).PlayFabClientSDK;

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
    if (typeof window !== 'undefined' && getPlayFab() && getPlayFabClientSDK()) {
      getPlayFab().settings.titleId = this.titleId;
      this.isInitialized = true;
      console.log(`✅ PlayFab Core initialized with Title ID: ${this.titleId}`);
    } else {
      console.warn('PlayFab SDK not available, running in offline mode');
      this.isInitialized = false;
      // Don't throw error - allow app to continue without PlayFab
    }
  }

  /**
   * Load PlayFab SDK from CDN
   */
  private loadPlayFabSDK(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined') {
        console.error('PlayFab SDK can only be loaded in the browser');
        return resolve();
      }

      // Check if already loaded
      if (getPlayFab() && getPlayFabClientSDK()) {
        console.log('PlayFab SDK already loaded');
        return resolve();
      }

      // Simple, reliable SDK loading
      const script = document.createElement('script');
      script.src = 'https://download.playfab.com/PlayFabClientApi.js';
      script.onload = () => {
        console.log('PlayFab SDK script loaded, inspecting window.PlayFab...');
        
        // Immediate inspection
        console.log('window.PlayFab exists:', !!getPlayFab());
        if (getPlayFab()) {
          console.log('window.PlayFab keys:', Object.keys(getPlayFab()));
          console.log('window.PlayFab.Client exists:', !!getPlayFab().Client);
          console.log('window.PlayFab structure:', getPlayFab());
        }
        
        // Poll for PlayFab.Client availability
        let attempts = 0;
        const pollForClient = () => {
          attempts++;
          console.log(`Attempt ${attempts}: Checking for PlayFab.Client...`);
          
          if (getPlayFab()) {
            console.log(`Available keys: ${Object.keys(getPlayFab()).join(', ')}`);
          }
          
          if (getPlayFab() && getPlayFabClientSDK()) {
            console.log('✅ PlayFab SDK with ClientSDK loaded successfully');
            resolve();
          } else if (attempts < 50) { // Try for 5 seconds
            setTimeout(pollForClient, 100);
          } else {
            console.error('❌ PlayFabClientSDK never became available after 50 attempts');
            console.log('Final window.PlayFab state:', getPlayFab());
            console.log('Final window.PlayFabClientSDK state:', getPlayFabClientSDK());
            resolve();
          }
        };
        setTimeout(pollForClient, 100); // Start polling after small delay
      };
      script.onerror = () => {
        console.error('Failed to load PlayFab SDK');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Check if PlayFab is properly initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.titleId !== null && typeof window !== 'undefined' && getPlayFab() && getPlayFabClientSDK();
  }

  /**
   * Get the PlayFab ClientSDK object  
   */
  public getPlayFab(): any {
    if (!this.isReady()) {
      throw new Error('PlayFab not initialized. Call initialize() first.');
    }
    return getPlayFabClientSDK();
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