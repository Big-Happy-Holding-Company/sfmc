/**
 * PlayFab Core Service - Refactored with New Architecture
 * 
 * Single Responsibility: High-level PlayFab operations using centralized services
 * DRY Compliance: Uses new request manager and error handler
 * 
 * Now delegates to:
 * - PlayFabRequestManager for all HTTP operations
 * - PlayFabErrorHandler for error processing
 * - PlayFabAuthManager for authentication
 */

import { playFabRequestManager } from './requestManager';
import { playFabErrorHandler } from './errorHandler';
import { playFabAuthManager } from './authManager';
import type { PlayFabConfig } from '@/types/playfab';
import type { ApiOperationType } from './apiStrategy';

export class PlayFabCore {
  private static instance: PlayFabCore;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): PlayFabCore {
    if (!PlayFabCore.instance) {
      PlayFabCore.instance = new PlayFabCore();
    }
    return PlayFabCore.instance;
  }

  /**
   * Initialize PlayFab with new architecture
   */
  public async initialize(config: PlayFabConfig): Promise<void> {
    await playFabRequestManager.initialize(config);
    this.isInitialized = true;
  }

  /**
   * Check if PlayFab is properly initialized
   */
  public isReady(): boolean {
    return this.isInitialized && playFabRequestManager.isInitialized();
  }

  /**
   * Get Title ID from request manager
   */
  public getTitleId(): string {
    return playFabRequestManager.getStrategyManager().getTitleId();
  }

  /**
   * Set session token (delegates to auth manager)
   */
  public setSessionToken(token: string): void {
    playFabAuthManager.updateSessionToken(token);
    playFabRequestManager.getStrategyManager().setSessionToken(token);
  }

  /**
   * Get current session token (delegates to auth manager)
   */
  public getSessionToken(): string | null {
    return playFabAuthManager.getSessionToken();
  }

  /**
   * Make HTTP request to PlayFab API endpoint
   * Now delegates to centralized request manager
   */
  public async makeHttpRequest<TRequest = any, TResponse = any>(
    endpoint: string,
    requestData?: TRequest,
    requiresAuth: boolean = false
  ): Promise<TResponse> {
    if (!this.isReady()) {
      throw new Error('PlayFab not initialized');
    }

    // Convert endpoint to operation type
    const operation = this.mapEndpointToOperation(endpoint);
    
    try {
      return await playFabRequestManager.makeRequest<TRequest, TResponse>(
        operation,
        requestData
      );
    } catch (error) {
      // Process error through centralized handler
      const processedError = playFabErrorHandler.processError(error);
      throw new Error(processedError.userMessage);
    }
  }

  /**
   * Map legacy endpoints to new operation types
   */
  private mapEndpointToOperation(endpoint: string): ApiOperationType {
    const endpointMap: Record<string, ApiOperationType> = {
      '/Admin/GetTitleData': 'getTitleData',
      '/Admin/SetTitleData': 'setTitleData', 
      '/Client/GetUserData': 'getUserData',
      '/Client/UpdateUserData': 'updateUserData',
      '/Client/UpdatePlayerStatistics': 'updateStatistics',
      '/Client/GetLeaderboard': 'getLeaderboard',
      '/Client/ExecuteCloudScript': 'executeCloudScript',
      '/Client/LoginWithCustomID': 'loginWithCustomId'
    };

    const operation = endpointMap[endpoint];
    if (!operation) {
      throw new Error(`Unsupported endpoint: ${endpoint}`);
    }

    return operation;
  }

  /**
   * Handle error (delegates to centralized error handler)
   */
  public handleError(error: any) {
    return playFabErrorHandler.processError(error).originalError;
  }

  /**
   * Create standardized service result
   */
  public createResult<T>(success: boolean, data?: T, error?: any) {
    if (success) {
      return { status: 'success' as const, data: data as T };
    } else {
      const processedError = playFabErrorHandler.processError(error);
      return { 
        status: 'error' as const, 
        data: undefined as unknown as T, 
        error: processedError.originalError 
      };
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
   * Clear session (delegates to auth manager)
   */
  public clearSession(): void {
    playFabAuthManager.logout();
  }

  /**
   * Log operation (minimal logging for backward compatibility)
   */
  public logOperation(operation: string, details?: any): void {
    // Minimal logging in development only
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎮 PlayFab ${operation}`);
    }
  }
}

// Export singleton instance
export const playFabCore = PlayFabCore.getInstance();