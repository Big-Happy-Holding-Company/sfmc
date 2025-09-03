/**
 * PlayFab TypeScript Definitions
 * Comprehensive type definitions for PlayFab integration matching Unity implementation
 */

// Global PlayFab object from CDN
declare global {
  const PlayFab: any;
}

// =============================================================================
// TASK DATA TYPES
// =============================================================================

export interface PlayFabTask {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  gridSize: number;
  timeLimit: number | null;
  basePoints: number;
  requiredRankLevel: number;
  examples: Array<{
    input: string[][];
    output: string[][];
  }>;
  testInput: string[][];
  testOutput: string[][];
  emojiSet: string;
  hints: string[];
}

// =============================================================================
// USER DATA TYPES
// =============================================================================

export interface PlayFabPlayer {
  id: string; // PlayFab ID
  username: string; // Display name
  rank: string;
  rankLevel: number;
  totalPoints: number;
  completedMissions: number;
  currentTask?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerProfile {
  PlayFabId: string;
  DisplayName?: string;
  AvatarUrl?: string;
}

// =============================================================================
// LEADERBOARD TYPES
// =============================================================================

export interface LeaderboardEntry {
  DisplayName: string;
  StatValue: number;
  Position: number;
  PlayFabId: string;
  Profile?: PlayerProfile;
}

// =============================================================================
// CLOUDSCRIPT VALIDATION TYPES
// =============================================================================

export interface CloudScriptValidationRequest {
  taskId: string;
  solution: string[][];
  timeElapsed?: number;
  hintsUsed?: number;
  sessionId?: string;
  attemptId?: number;
}

export interface CloudScriptValidationResponse {
  success: boolean;
  correct: boolean;
  pointsEarned: number;
  timeBonus: number;
  hintPenalty: number;
  totalScore: number;
  newRank?: string;
  rankUp?: boolean;
  message: string;
  attempts?: number;
  newTotalPoints?: number;
}

export interface TaskValidationResult extends CloudScriptValidationResponse {
  basePoints?: number;
  speedBonus?: number;
  totalPoints?: number;
}

// =============================================================================
// EVENT LOGGING TYPES (Unity Parity)
// =============================================================================

export interface PuzzleEventData {
  eventName: "SFMC";
  sessionId: string;
  attemptId: number;
  game_id: string;
  stepIndex: number;
  position: { x: number; y: number };
  payloadSummary?: object;
  deltaMs: number;
  status: "won" | "fail" | "stop" | "start";
  category: string;
  event_type: "game_completion" | "game_start" | "player_action" | "hint_used";
  selection_value: number;
  game_time: string;
  display_name: string;
  game_title?: string;
}

export interface GameSession {
  sessionId: string;
  startTime: Date;
  currentTaskId?: string;
  attemptCount: number;
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export interface AuthenticationResult {
  PlayFabId: string;
  DisplayName?: string;
  NewlyCreated?: boolean;
}

export interface AnonymousNameResponse {
  newName: string;
}

// =============================================================================
// SERVICE RESULT TYPES
// =============================================================================

export interface PlayFabServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: any;
}

export interface PlayFabError {
  error: string;
  errorCode: number;
  errorMessage: string;
  errorDetails?: any;
}

// =============================================================================
// SERVICE CONFIGURATION
// =============================================================================

export interface PlayFabConfig {
  titleId: string;
  secretKey?: string;
}

export interface ServiceConfig {
  enableCloudScript: boolean;
  enableEventLogging: boolean;
  enableProfileCache: boolean;
  eventBatchSize: number;
  cacheTimeout: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type GameStatus = "won" | "fail" | "stop" | "start";
export type EventType = "game_completion" | "game_start" | "player_action" | "hint_used";
export type RankLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

// =============================================================================
// CONSTANTS
// =============================================================================

export const PLAYFAB_CONSTANTS = {
  STATISTIC_NAMES: {
    LEVEL_POINTS: 'LevelPoints',
  },
  TITLE_DATA_KEYS: {
    TASKS: 'tasks.json',
  },
  CLOUDSCRIPT_FUNCTIONS: {
    VALIDATE_SOLUTION: 'ValidateTaskSolution',
    GENERATE_ANONYMOUS_NAME: 'GenerateAnonymousName',
  },
  STORAGE_KEYS: {
    DEVICE_ID: 'playfab_device_id',
    SESSION_ID: 'playfab_session_id',
  },
} as const;