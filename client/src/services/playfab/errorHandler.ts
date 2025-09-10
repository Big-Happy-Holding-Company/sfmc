/**
 * Unified PlayFab Error Handler
 * 
 * Single Responsibility: Centralized error processing and user-friendly message generation
 * DRY Compliance: Eliminates duplicate error handling patterns across services
 * 
 * Features:
 * - Standardized error categorization
 * - User-friendly error messages
 * - Developer debugging information
 * - Error recovery suggestions
 */

import type { PlayFabError } from '@/types/playfab';

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  NETWORK = 'network', 
  DATA_ACCESS = 'data_access',
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface ProcessedError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  developerMessage: string;
  suggestions: string[];
  originalError: PlayFabError;
  isRetryable: boolean;
}

/**
 * Unified Error Handler for all PlayFab operations
 */
export class PlayFabErrorHandler {
  private static instance: PlayFabErrorHandler;

  private constructor() {}

  public static getInstance(): PlayFabErrorHandler {
    if (!PlayFabErrorHandler.instance) {
      PlayFabErrorHandler.instance = new PlayFabErrorHandler();
    }
    return PlayFabErrorHandler.instance;
  }

  /**
   * Process any error into standardized format
   */
  processError(error: any): ProcessedError {
    const playFabError = this.normalizeError(error);
    const category = this.categorizeError(playFabError);
    const severity = this.determineSeverity(playFabError, category);
    
    return {
      category,
      severity,
      userMessage: this.generateUserMessage(playFabError, category),
      developerMessage: this.generateDeveloperMessage(playFabError),
      suggestions: this.generateSuggestions(playFabError, category),
      originalError: playFabError,
      isRetryable: this.isRetryableError(playFabError, category)
    };
  }

  /**
   * Convert any error format to PlayFabError
   */
  private normalizeError(error: any): PlayFabError {
    if (this.isPlayFabError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return {
        error: 'UnknownError',
        errorCode: -1,
        errorMessage: error.message,
        errorDetails: error
      };
    }

    return {
      error: 'UnknownError',
      errorCode: -1,
      errorMessage: 'An unknown error occurred',
      errorDetails: error
    };
  }

  /**
   * Categorize error based on code and message patterns
   */
  private categorizeError(error: PlayFabError): ErrorCategory {
    const errorCode = error.errorCode;
    const message = error.errorMessage.toLowerCase();

    // Authentication errors
    if (errorCode === 1001 || message.includes('not logged in') || message.includes('anonymous callers')) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (errorCode === 1005 || message.includes('invalid session ticket')) {
      return ErrorCategory.AUTHENTICATION;
    }

    // Network errors
    if (errorCode === -1 || message.includes('network') || message.includes('fetch')) {
      return ErrorCategory.NETWORK;
    }

    if (message.includes('timeout') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }

    // Data access errors
    if (errorCode === 1162 || message.includes('title data') || message.includes('not found')) {
      return ErrorCategory.DATA_ACCESS;
    }

    // Validation errors
    if (errorCode >= 1000 && errorCode < 2000 && message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }

    // Configuration errors
    if (message.includes('title id') || message.includes('secret key')) {
      return ErrorCategory.CONFIGURATION;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity for user experience decisions
   */
  private determineSeverity(error: PlayFabError, category: ErrorCategory): ErrorSeverity {
    switch (category) {
      case ErrorCategory.CONFIGURATION:
        return ErrorSeverity.CRITICAL;
      case ErrorCategory.AUTHENTICATION:
        return ErrorSeverity.HIGH;
      case ErrorCategory.DATA_ACCESS:
        return ErrorSeverity.MEDIUM;
      case ErrorCategory.NETWORK:
        return ErrorSeverity.LOW;
      case ErrorCategory.VALIDATION:
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Generate user-friendly error messages
   */
  private generateUserMessage(error: PlayFabError, category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication required. Please wait while we log you in.';
      case ErrorCategory.NETWORK:
        return 'Network connection issue. Please check your internet connection.';
      case ErrorCategory.DATA_ACCESS:
        return 'Unable to load puzzle data. Please try again.';
      case ErrorCategory.VALIDATION:
        return 'Invalid request. Please check your input and try again.';
      case ErrorCategory.CONFIGURATION:
        return 'System configuration error. Please contact support.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Generate detailed developer messages
   */
  private generateDeveloperMessage(error: PlayFabError): string {
    return `PlayFab Error ${error.errorCode}: ${error.errorMessage}`;
  }

  /**
   * Generate actionable suggestions for error resolution
   */
  private generateSuggestions(error: PlayFabError, category: ErrorCategory): string[] {
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
        return [
          'Ensure PlayFab initialization is complete',
          'Check if user login was successful',
          'Verify session token is valid'
        ];
      case ErrorCategory.NETWORK:
        return [
          'Check internet connection',
          'Retry the operation',
          'Check if PlayFab services are available'
        ];
      case ErrorCategory.DATA_ACCESS:
        return [
          'Verify data was uploaded correctly to PlayFab',
          'Check Title Data keys exist',
          'Ensure proper API endpoint usage'
        ];
      case ErrorCategory.CONFIGURATION:
        return [
          'Check VITE_PLAYFAB_TITLE_ID environment variable',
          'Verify PLAYFAB_SECRET_KEY is set correctly',
          'Ensure PlayFab project settings are correct'
        ];
      default:
        return ['Contact development team with error details'];
    }
  }

  /**
   * Determine if error should trigger retry logic
   */
  private isRetryableError(error: PlayFabError, category: ErrorCategory): boolean {
    // Never retry configuration or validation errors
    if (category === ErrorCategory.CONFIGURATION || category === ErrorCategory.VALIDATION) {
      return false;
    }

    // Always retry network errors
    if (category === ErrorCategory.NETWORK) {
      return true;
    }

    // Retry authentication errors (will trigger login)
    if (category === ErrorCategory.AUTHENTICATION) {
      return true;
    }

    // Retry some data access errors
    if (category === ErrorCategory.DATA_ACCESS && error.errorCode >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Check if object is a PlayFab error
   */
  private isPlayFabError(obj: any): obj is PlayFabError {
    return obj && 
           typeof obj.error === 'string' && 
           typeof obj.errorCode === 'number' && 
           typeof obj.errorMessage === 'string';
  }

  /**
   * Create user-presentable error for UI components
   */
  createUserError(error: any): { message: string; canRetry: boolean; severity: ErrorSeverity } {
    const processed = this.processError(error);
    return {
      message: processed.userMessage,
      canRetry: processed.isRetryable,
      severity: processed.severity
    };
  }

  /**
   * Create developer error for logging and debugging
   */
  createDeveloperError(error: any): { 
    message: string; 
    category: ErrorCategory; 
    suggestions: string[];
    details: any;
  } {
    const processed = this.processError(error);
    return {
      message: processed.developerMessage,
      category: processed.category,
      suggestions: processed.suggestions,
      details: processed.originalError.errorDetails
    };
  }
}

// Export singleton instance
export const playFabErrorHandler = PlayFabErrorHandler.getInstance();