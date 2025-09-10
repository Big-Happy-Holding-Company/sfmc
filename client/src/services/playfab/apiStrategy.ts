/**
 * PlayFab API Strategy Pattern
 * date:  UNKNOWN
 * author:  UNKNOWN
 * last modified:  ???
 * Single Responsibility: Route PlayFab API calls to correct endpoint based on data type and auth context
 * DRY Compliance: Eliminates duplicate API selection logic across services
 * 
 * Strategy Pattern Implementation:
 * - AdminApiStrategy: For Title Data operations requiring secret key
 * - ClientApiStrategy: For user data operations requiring session tokens
 * - AutoStrategy: Automatically selects based on operation type and available auth
 */

import type { PlayFabConfig } from '@/types/playfab';

// API operation types that determine strategy selection
export type ApiOperationType = 
  | 'getTitleData'          // Admin API - requires secret key
  | 'setTitleData'          // Admin API - requires secret key
  | 'getUserData'           // Client API - requires session token
  | 'updateUserData'        // Client API - requires session token
  | 'updateStatistics'      // Client API - requires session token
  | 'getLeaderboard'        // Client API - requires session token
  | 'executeCloudScript'    // Client API - requires session token
  | 'loginWithCustomId';    // Client API - no auth required

// Request context for strategy selection
export interface ApiRequestContext {
  operation: ApiOperationType;
  hasSessionToken: boolean;
  hasSecretKey: boolean;
  requiresAuth: boolean;
}

// Unified API request interface
export interface ApiRequest<T = any> {
  endpoint: string;
  data?: T;
  headers: Record<string, string>;
  requiresAuth: boolean;
}

// Strategy interface that all API strategies must implement
export interface PlayFabApiStrategy {
  readonly name: string;
  canHandle(context: ApiRequestContext): boolean;
  createRequest<T>(
    operation: ApiOperationType, 
    requestData?: T, 
    titleId?: string
  ): ApiRequest<T>;
}

/**
 * Admin API Strategy - Handles Title Data and admin operations
 * Uses /Admin/ endpoints with X-SecretKey authentication
 */
export class AdminApiStrategy implements PlayFabApiStrategy {
  readonly name = 'AdminAPI';
  
  constructor(private secretKey: string) {}
  
  canHandle(context: ApiRequestContext): boolean {
    const adminOperations: ApiOperationType[] = ['getTitleData', 'setTitleData'];
    return adminOperations.includes(context.operation) && context.hasSecretKey;
  }
  
  createRequest<T>(
    operation: ApiOperationType, 
    requestData?: T, 
    titleId?: string
  ): ApiRequest<T> {
    const endpointMap: Record<ApiOperationType, string> = {
      getTitleData: '/Admin/GetTitleData',
      setTitleData: '/Admin/SetTitleData',
      // Unused by Admin API but included for type safety
      getUserData: '',
      updateUserData: '',
      updateStatistics: '',
      getLeaderboard: '',
      executeCloudScript: '',
      loginWithCustomId: ''
    };
    
    const endpoint = endpointMap[operation];
    if (!endpoint) {
      throw new Error(`Operation ${operation} not supported by Admin API strategy`);
    }
    
    return {
      endpoint,
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': this.secretKey
      },
      requiresAuth: false // Admin API uses secret key in header, not session token
    };
  }
}

/**
 * Client API Strategy - Handles user data and gameplay operations  
 * Uses /Client/ endpoints with X-Authorization session token authentication
 */
export class ClientApiStrategy implements PlayFabApiStrategy {
  readonly name = 'ClientAPI';
  
  constructor(private sessionToken?: string) {}
  
  canHandle(context: ApiRequestContext): boolean {
    const clientOperations: ApiOperationType[] = [
      'getUserData', 'updateUserData', 'updateStatistics', 
      'getLeaderboard', 'executeCloudScript', 'loginWithCustomId'
    ];
    return clientOperations.includes(context.operation) && 
           (!context.requiresAuth || context.hasSessionToken);
  }
  
  createRequest<T>(
    operation: ApiOperationType, 
    requestData?: T, 
    titleId?: string
  ): ApiRequest<T> {
    const endpointMap: Record<ApiOperationType, string> = {
      getUserData: '/Client/GetUserData',
      updateUserData: '/Client/UpdateUserData', 
      updateStatistics: '/Client/UpdatePlayerStatistics',
      getLeaderboard: '/Client/GetLeaderboard',
      executeCloudScript: '/Client/ExecuteCloudScript',
      loginWithCustomId: '/Client/LoginWithCustomID',
      // Unused by Client API but included for type safety
      getTitleData: '',
      setTitleData: ''
    };
    
    const endpoint = endpointMap[operation];
    if (!endpoint) {
      throw new Error(`Operation ${operation} not supported by Client API strategy`);
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add session token for authenticated requests
    const requiresAuth = !['loginWithCustomId'].includes(operation);
    if (requiresAuth && this.sessionToken) {
      headers['X-Authorization'] = this.sessionToken;
    }
    
    return {
      endpoint,
      data: { ...requestData, TitleId: titleId } as T,
      headers,
      requiresAuth
    };
  }
  
  /**
   * Update session token for authenticated requests
   */
  updateSessionToken(sessionToken: string): void {
    this.sessionToken = sessionToken;
  }
}

/**
 * PlayFab API Strategy Manager
 * 
 * Automatically selects the appropriate API strategy based on:
 * - Operation type (Title Data vs User Data)
 * - Available authentication (secret key vs session token)
 * - Request context
 */
export class PlayFabApiStrategyManager {
  private strategies: PlayFabApiStrategy[] = [];
  private titleId: string;
  
  constructor(config: PlayFabConfig) {
    this.titleId = config.titleId;
    
    // Initialize strategies based on available credentials
    if (config.secretKey) {
      this.strategies.push(new AdminApiStrategy(config.secretKey));
    }
    
    // Client API strategy will be updated with session token when available
    this.strategies.push(new ClientApiStrategy());
  }
  
  /**
   * Update session token for Client API operations
   */
  setSessionToken(sessionToken: string): void {
    const clientStrategy = this.strategies.find(s => s instanceof ClientApiStrategy) as ClientApiStrategy;
    if (clientStrategy) {
      clientStrategy.updateSessionToken(sessionToken);
    }
  }
  
  /**
   * Select appropriate strategy and create API request
   */
  createRequest<T>(
    operation: ApiOperationType,
    requestData?: T,
    sessionToken?: string
  ): ApiRequest<T> {
    const context: ApiRequestContext = {
      operation,
      hasSessionToken: !!sessionToken,
      hasSecretKey: this.strategies.some(s => s instanceof AdminApiStrategy),
      requiresAuth: !['loginWithCustomId'].includes(operation)
    };
    
    // Find first strategy that can handle this request
    const strategy = this.strategies.find(s => s.canHandle(context));
    
    if (!strategy) {
      throw new Error(
        `No strategy available for operation ${operation}. ` +
        `Context: hasSessionToken=${context.hasSessionToken}, hasSecretKey=${context.hasSecretKey}`
      );
    }
    
    console.log(`🎯 Selected ${strategy.name} strategy for ${operation}`);
    return strategy.createRequest(operation, requestData, this.titleId);
  }
  
  /**
   * Get full PlayFab API URL for a request
   */
  getApiUrl(request: ApiRequest): string {
    return `https://${this.titleId}.playfabapi.com${request.endpoint}`;
  }
  
  /**
   * Check if operation is supported by available strategies
   */
  canHandleOperation(operation: ApiOperationType, requiresAuth: boolean = true): boolean {
    const context: ApiRequestContext = {
      operation,
      hasSessionToken: this.strategies.some(s => s instanceof ClientApiStrategy),
      hasSecretKey: this.strategies.some(s => s instanceof AdminApiStrategy),
      requiresAuth
    };
    
    return this.strategies.some(s => s.canHandle(context));
  }
  
  /**
   * Get available strategies info for debugging
   */
  getStrategiesInfo(): Array<{ name: string; canHandle: string[] }> {
    return this.strategies.map(strategy => ({
      name: strategy.name,
      canHandle: [
        'getTitleData', 'setTitleData', 'getUserData', 'updateUserData',
        'updateStatistics', 'getLeaderboard', 'executeCloudScript', 'loginWithCustomId'
      ].filter(op => strategy.canHandle({
        operation: op as ApiOperationType,
        hasSessionToken: true,
        hasSecretKey: true,
        requiresAuth: true
      }))
    }));
  }
}