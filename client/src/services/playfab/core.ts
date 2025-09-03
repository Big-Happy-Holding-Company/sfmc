/**
 * PlayFab Core Service - Pure REST API Implementation
 * Direct HTTP calls to PlayFab REST endpoints using fetch()
 * No SDK dependencies - complete control over requests/responses
 */

// PlayFab configuration interface
declare interface PlayFabConfig {
  titleId: string;
  secretKey?: string;
}

// PlayFab error response format
declare interface PlayFabError {
  error: string;
  errorCode: number;
  errorMessage: string;
  errorDetails?: any;
}

// Standardized service result
declare interface PlayFabServiceResult<T = any> {
  data: T;
  status: 'success' | 'error';
  error?: PlayFabError;
}

// HTTP response from PlayFab APIs
interface PlayFabHttpResponse<T = any> {
  code: number;
  status: string;
  data?: T;
  error?: string;
  errorCode?: number;
  errorMessage?: string;
  errorDetails?: any;
}

export class PlayFabCore {
  private static instance: PlayFabCore;
  private titleId: string | null = null;
  private secretKey: string | null = null;
  private sessionToken: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): PlayFabCore {
    if (!PlayFabCore.instance) {
      PlayFabCore.instance = new PlayFabCore();
    }
    return PlayFabCore.instance;
  }

  /**
   * Initialize PlayFab with configuration - no CDN dependencies
   */
  public async initialize(config: PlayFabConfig): Promise<void> {
    this.titleId = config.titleId;
    this.secretKey = config.secretKey || null;
    
    this.isInitialized = true;
    console.log(`✅ PlayFab Core initialized with Title ID: ${this.titleId} (Pure HTTP implementation)`);
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
   * Set session token from login response
   */
  public setSessionToken(token: string): void {
    this.sessionToken = token;
    this.logOperation('Session Token Set', token ? 'Token received' : 'Token cleared');
  }

  /**
   * Get current session token
   */
  public getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Make HTTP request to PlayFab API endpoint
   */
  public async makeHttpRequest<TRequest = any, TResponse = any>(
    endpoint: string,
    requestData?: TRequest,
    requiresAuth: boolean = false
  ): Promise<TResponse> {
    if (!this.isReady()) {
      throw new Error('PlayFab not initialized');
    }

    const url = `https://${this.titleId}.playfabapi.com${endpoint}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add session token for authenticated requests
    if (requiresAuth && this.sessionToken) {
      headers['X-Authorization'] = this.sessionToken;
    }

    // Add secret key for admin/server requests
    if (this.secretKey) {
      headers['X-SecretKey'] = this.secretKey;
    }

    try {
      this.logOperation(`HTTP ${endpoint}`, { 
        requestData, 
        requiresAuth,
        hasSessionToken: !!this.sessionToken 
      });

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: requestData ? JSON.stringify(requestData) : undefined
      });

      // Parse response
      const responseData: PlayFabHttpResponse<TResponse> = await response.json();

      // Check for HTTP errors
      if (!response.ok) {
        const error: PlayFabError = {
          error: responseData.error || 'HttpError',
          errorCode: responseData.errorCode || response.status,
          errorMessage: responseData.errorMessage || `HTTP ${response.status}: ${response.statusText}`,
          errorDetails: responseData
        };
        
        console.error(`❌ PlayFab HTTP Error (${endpoint}):`, error);
        throw new Error(error.errorMessage);
      }

      // Check for PlayFab API errors
      if (responseData.code !== 200 || responseData.error) {
        const error: PlayFabError = {
          error: responseData.error || 'APIError',
          errorCode: responseData.errorCode || responseData.code || 0,
          errorMessage: responseData.errorMessage || 'PlayFab API Error',
          errorDetails: responseData
        };
        
        console.error(`❌ PlayFab API Error (${endpoint}):`, error);
        throw new Error(error.errorMessage);
      }

      console.log(`✅ PlayFab HTTP Success (${endpoint}):`, responseData.data);
      return responseData.data as TResponse;

    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError: PlayFabError = {
          error: 'NetworkError',
          errorCode: -1,
          errorMessage: `Network request failed: ${error.message}`,
          errorDetails: error
        };
        console.error(`❌ PlayFab Network Error (${endpoint}):`, networkError);
        throw new Error(networkError.errorMessage);
      }

      // Re-throw PlayFab errors
      throw error;
    }
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
        status: 'success',
        data: data as T
      };
    } else {
      const playFabError = this.handleError(error);
      return {
        status: 'error',
        data: undefined as unknown as T,
        error: playFabError
      };
    }
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

  /**
   * Clear session (logout)
   */
  public clearSession(): void {
    this.sessionToken = null;
    this.logOperation('Session Cleared');
  }
}

// Export singleton instance
export const playFabCore = PlayFabCore.getInstance();