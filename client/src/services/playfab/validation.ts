/**
 * PlayFab Validation Service
 * SECURITY CRITICAL: Server-side solution validation via CloudScript
 * Replaces client-side validation to prevent cheating
 */

import type { 
  CloudScriptValidationRequest, 
  CloudScriptValidationResponse,
  TaskValidationResult 
} from '@/types/playfab';
import { playFabCore } from './core';
import { playFabAuth } from './auth';
import { playFabTasks } from './tasks';
import { PLAYFAB_CONSTANTS } from '@/types/playfab';

export class PlayFabValidation {
  private static instance: PlayFabValidation;

  private constructor() {}

  public static getInstance(): PlayFabValidation {
    if (!PlayFabValidation.instance) {
      PlayFabValidation.instance = new PlayFabValidation();
    }
    return PlayFabValidation.instance;
  }

  /**
   * Validate task solution via CloudScript (SECURITY CRITICAL)
   * Replaces client-side validation to prevent cheating
   * 
   * This method calls the ValidateTaskSolution CloudScript function which:
   * 1. Retrieves task data from Title Data (server-side, unhackable)
   * 2. Validates solution server-side (unhackable)
   * 3. Calculates points with time bonus/penalty (unhackable)
   * 4. Updates user data and statistics atomically
   * 5. Returns validation result with all scoring details
   */
  public async validateSolution(request: CloudScriptValidationRequest): Promise<TaskValidationResult> {
    // Ensure user is authenticated
    await playFabAuth.ensureAuthenticated();

    const playFab = playFabCore.getPlayFab();
    
    // Prepare CloudScript request
    const cloudScriptRequest = {
      FunctionName: PLAYFAB_CONSTANTS.CLOUDSCRIPT_FUNCTIONS.VALIDATE_SOLUTION,
      FunctionParameter: request,
      GeneratePlayStreamEvent: true // Enable for analytics
    };

    playFabCore.logOperation('Solution Validation', `Task: ${request.taskId}`);

    try {
      const result = await playFabCore.promisifyPlayFabCall(
        playFab.Client.ExecuteCloudScript,
        cloudScriptRequest
      );

      // Check for CloudScript execution errors
      if (result.Error) {
        const errorMsg = `CloudScript error: ${result.Error.Error} - ${result.Error.Message}`;
        playFabCore.logOperation('CloudScript Error', result.Error);
        throw new Error(errorMsg);
      }

      // Parse CloudScript response
      const validationResponse = result.FunctionResult as CloudScriptValidationResponse;
      
      if (!validationResponse) {
        throw new Error('No result returned from CloudScript validation');
      }

      // Create extended result for compatibility
      const taskValidationResult: TaskValidationResult = {
        ...validationResponse,
        basePoints: validationResponse.pointsEarned - (validationResponse.timeBonus || 0) + (validationResponse.hintPenalty || 0),
        speedBonus: validationResponse.timeBonus,
        totalPoints: validationResponse.totalScore,
        attempts: request.attemptId || 1
      };

      if (validationResponse.correct) {
        playFabCore.logOperation('Solution Correct', {
          points: validationResponse.pointsEarned,
          timeBonus: validationResponse.timeBonus,
          hintPenalty: validationResponse.hintPenalty,
          totalScore: validationResponse.totalScore
        });
      } else {
        playFabCore.logOperation('Solution Incorrect', request.taskId);
      }

      return taskValidationResult;

    } catch (error) {
      playFabCore.logOperation('Validation Failed', error);
      throw error;
    }
  }

  /**
   * Validate solution with automatic retry on CloudScript errors
   * Provides resilience against temporary CloudScript issues
   */
  public async validateSolutionWithRetry(
    request: CloudScriptValidationRequest,
    maxRetries: number = 2
  ): Promise<TaskValidationResult> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await this.validateSolution(request);
      } catch (error: any) {
        lastError = error;
        
        // Only retry on CloudScript errors, not on validation failures
        if (attempt <= maxRetries && this.isRetriableError(error)) {
          playFabCore.logOperation('Validation Retry', `Attempt ${attempt + 1}/${maxRetries + 1}`);
          await this.delay(1000 * attempt); // Exponential backoff
          continue;
        }
        break;
      }
    }

    throw lastError;
  }

  /**
   * Client-side fallback validation (ONLY used if CloudScript fails)
   * WARNING: This is hackable and should only be used as emergency fallback
   */
  public async fallbackValidation(request: CloudScriptValidationRequest): Promise<TaskValidationResult> {
    console.warn('🚨 Using client-side fallback validation - This is hackable!');
    
    // Get task data
    const task = await playFabTasks.getTaskById(request.taskId);
    if (!task) {
      throw new Error(`Task ${request.taskId} not found`);
    }

    // Client-side validation (hackable)
    const isCorrect = this.arraysEqual(request.solution, task.testOutput);
    
    let pointsEarned = 0;
    let timeBonus = 0;
    let hintPenalty = 0;

    if (isCorrect) {
      pointsEarned = task.basePoints;
      
      // Calculate time bonus
      if (request.timeElapsed && request.timeElapsed < 60) {
        timeBonus = Math.max(0, Math.floor((60 - request.timeElapsed) / 10) * 10);
        pointsEarned += timeBonus;
      }
      
      // Apply hint penalty
      if (request.hintsUsed && request.hintsUsed > 0) {
        hintPenalty = request.hintsUsed * 5;
        pointsEarned = Math.max(0, pointsEarned - hintPenalty);
      }
    }

    const result: TaskValidationResult = {
      success: isCorrect,
      correct: isCorrect,
      pointsEarned,
      timeBonus,
      hintPenalty,
      totalScore: 0, // Cannot update server-side data
      message: isCorrect 
        ? 'Mission accomplished! (Offline mode - sync when online)' 
        : 'Mission failed. Try again.',
      basePoints: task.basePoints,
      speedBonus: timeBonus,
      totalPoints: 0,
      attempts: request.attemptId || 1,
      hintsUsed: request.hintsUsed || 0
    };

    playFabCore.logOperation('Fallback Validation', { correct: isCorrect, points: pointsEarned });
    return result;
  }

  /**
   * Check if error is retriable (CloudScript timeout, network issues, etc.)
   */
  private isRetriableError(error: any): boolean {
    const retriableCodes = [
      'CloudScriptTimeout',
      'CloudScriptHTTPRequestError',
      'ServiceUnavailable',
      'RequestTimeout'
    ];
    
    return retriableCodes.includes(error.error) || 
           error.errorMessage?.includes('timeout') ||
           error.errorMessage?.includes('network');
  }

  /**
   * Helper function to compare 2D arrays
   */
  private arraysEqual(a: string[][], b: string[][]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].length !== b[i].length) return false;
      for (let j = 0; j < a[i].length; j++) {
        if (a[i][j] !== b[i][j]) return false;
      }
    }
    return true;
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test CloudScript connection without validating a solution
   */
  public async testCloudScriptConnection(): Promise<boolean> {
    try {
      // Try to generate an anonymous name as a CloudScript connectivity test
      await playFabAuth.generateAnonymousName();
      return true;
    } catch (error) {
      playFabCore.logOperation('CloudScript Connection Test Failed', error);
      return false;
    }
  }
}

// Export singleton instance
export const playFabValidation = PlayFabValidation.getInstance();