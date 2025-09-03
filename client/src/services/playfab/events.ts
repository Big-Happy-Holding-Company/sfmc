/**
 * PlayFab Events Service
 * Enhanced event logging with Unity parity (16-parameter structure)
 * Matches PuzzleEventLogger.cs functionality exactly
 */

import 'playfab-web-sdk/src/PlayFab/PlayFabClientApi.js';

import type { PuzzleEventData, GameSession, GameStatus, EventType } from '@/types/playfab';
import { playFabCore } from './core';
import { playFabAuth } from './auth';

export class PlayFabEvents {
  private static instance: PlayFabEvents;
  private currentSession: GameSession | null = null;
  private sessionStartTime: Date | null = null;

  private constructor() {}

  public static getInstance(): PlayFabEvents {
    if (!PlayFabEvents.instance) {
      PlayFabEvents.instance = new PlayFabEvents();
    }
    return PlayFabEvents.instance;
  }

  /**
   * Log puzzle event with full Unity parity (16 parameters)
   * Matches PuzzleEventLogger.cs:LogPuzzleEvent exactly
   */
  public async logPuzzleEvent(
    eventName: "SFMC",
    sessionId: string,
    attemptId: number,
    game_id: string,
    stepIndex: number,
    positionX: number,
    positionY: number,
    payloadSummary: object | null,
    deltaMs: number,
    game_title: string,
    status: GameStatus,
    category: string,
    event_type: EventType,
    selection_value: number,
    game_time: string
  ): Promise<void> {
    // Ensure user is authenticated
    await playFabAuth.ensureAuthenticated();

    const displayName = playFabAuth.getDisplayName() || 'Unknown';

    // Build event body matching Unity structure exactly
    const eventBody = {
      sessionId,
      attemptId,
      game_id,
      category,
      event_type,
      stepIndex,
      status,
      deltaMs,
      selection_value,
      game_time,
      display_name: displayName,
      position: { x: positionX, y: positionY }
    };

    // Add optional fields
    if (payloadSummary) {
      eventBody['payloadSummary'] = payloadSummary;
    }

    const playFab = playFabCore.getPlayFab();
    const request = {
      EventName: eventName,
      Body: eventBody
    };

    try {
      await playFabCore.promisifyPlayFabCall(
        PlayFab.ClientApi.WritePlayerEvent,
        request
      );

      playFabCore.logOperation('Event Logged', {
        event: eventName,
        type: event_type,
        status,
        gameId: game_id
      });
    } catch (error) {
      playFabCore.logOperation('Event Logging Failed', error);
      throw error;
    }
  }

  /**
   * Simplified event logging method matching the existing React implementation
   */
  public async logEvent(eventName: string, eventData: Record<string, any>): Promise<void> {
    await playFabAuth.ensureAuthenticated();

    const playFab = playFabCore.getPlayFab();
    const request = {
      EventName: eventName,
      Body: eventData
    };

    try {
      await playFabCore.promisifyPlayFabCall(
        PlayFab.ClientApi.WritePlayerEvent,
        request
      );

      playFabCore.logOperation('Simple Event Logged', eventName);
    } catch (error) {
      playFabCore.logOperation('Simple Event Failed', error);
      throw error;
    }
  }

  /**
   * Start a new game session
   */
  public startGameSession(taskId: string): GameSession {
    const sessionId = this.generateSessionId();
    const session: GameSession = {
      sessionId,
      startTime: new Date(),
      currentTaskId: taskId,
      attemptCount: 1
    };

    this.currentSession = session;
    this.sessionStartTime = new Date();

    // Store session ID for persistence
    localStorage.setItem('playfab_session_id', sessionId);

    playFabCore.logOperation('Game Session Started', { sessionId, taskId });

    // Log game start event
    this.logGameStartEvent(taskId, sessionId);

    return session;
  }

  /**
   * End the current game session
   */
  public async endGameSession(status: GameStatus, finalScore?: number): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active game session to end');
      return;
    }

    const session = this.currentSession;
    const sessionDuration = Date.now() - session.startTime.getTime();

    // Log game completion event
    await this.logGameCompletionEvent(
      session.sessionId,
      session.currentTaskId || 'unknown',
      status,
      sessionDuration,
      finalScore
    );

    // Clear session
    this.currentSession = null;
    this.sessionStartTime = null;
    localStorage.removeItem('playfab_session_id');

    playFabCore.logOperation('Game Session Ended', {
      sessionId: session.sessionId,
      status,
      duration: sessionDuration
    });
  }

  /**
   * Log player action event
   */
  public async logPlayerAction(
    action: string,
    position: { x: number; y: number },
    selectionValue: number = 0
  ): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active game session for player action');
      return;
    }

    const deltaMs = this.sessionStartTime ? Date.now() - this.sessionStartTime.getTime() : 0;

    await this.logPuzzleEvent(
      "SFMC",
      this.currentSession.sessionId,
      this.currentSession.attemptCount,
      this.currentSession.currentTaskId || 'unknown',
      0, // stepIndex for actions
      position.x,
      position.y,
      { action },
      deltaMs,
      "Mission Control 2045",
      "start", // actions are ongoing
      "player_interaction",
      "player_action",
      selectionValue,
      new Date().toISOString()
    );
  }

  /**
   * Log hint usage event
   */
  public async logHintUsed(hintIndex: number, taskId: string): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active game session for hint usage');
      return;
    }

    const deltaMs = this.sessionStartTime ? Date.now() - this.sessionStartTime.getTime() : 0;

    await this.logPuzzleEvent(
      "SFMC",
      this.currentSession.sessionId,
      this.currentSession.attemptCount,
      taskId,
      hintIndex,
      0, 0, // position not relevant for hints
      { hintIndex },
      deltaMs,
      "Mission Control 2045",
      "start",
      "hint_system",
      "hint_used",
      hintIndex,
      new Date().toISOString()
    );
  }

  /**
   * Log game start event
   */
  private async logGameStartEvent(taskId: string, sessionId: string): Promise<void> {
    try {
      await this.logPuzzleEvent(
        "SFMC",
        sessionId,
        1,
        taskId,
        0,
        0, 0,
        { event: 'game_start' },
        0,
        "Mission Control 2045",
        "start",
        "game_flow",
        "game_start",
        0,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Failed to log game start event:', error);
    }
  }

  /**
   * Log game completion event
   */
  private async logGameCompletionEvent(
    sessionId: string,
    taskId: string,
    status: GameStatus,
    duration: number,
    score?: number
  ): Promise<void> {
    try {
      await this.logPuzzleEvent(
        "SFMC",
        sessionId,
        this.currentSession?.attemptCount || 1,
        taskId,
        99, // End step
        0, 0,
        { 
          duration,
          score: score || 0,
          final_status: status
        },
        duration,
        "Mission Control 2045",
        status,
        "game_flow",
        "game_completion",
        score || 0,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Failed to log game completion event:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${randomStr}`;
  }

  /**
   * Get current session
   */
  public getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  /**
   * Increment attempt count for current session
   */
  public incrementAttempt(): void {
    if (this.currentSession) {
      this.currentSession.attemptCount++;
      playFabCore.logOperation('Attempt Incremented', this.currentSession.attemptCount);
    }
  }

  /**
   * Restore session from localStorage (if browser was refreshed)
   */
  public restoreSession(taskId?: string): GameSession | null {
    const storedSessionId = localStorage.getItem('playfab_session_id');
    if (storedSessionId && taskId) {
      this.currentSession = {
        sessionId: storedSessionId,
        startTime: new Date(), // New start time since we can't persist the original
        currentTaskId: taskId,
        attemptCount: 1
      };
      this.sessionStartTime = new Date();
      playFabCore.logOperation('Session Restored', storedSessionId);
      return this.currentSession;
    }
    return null;
  }
}

// Export singleton instance
export const playFabEvents = PlayFabEvents.getInstance();