export interface GameResult {
  success: boolean;
  correct: boolean;
  basePoints?: number;
  speedBonus?: number;
  totalPoints?: number;
  newRank?: string;
  rankUp?: boolean;
  attempts?: number;
}

export interface TimerState {
  timeRemaining: number;
  isActive: boolean;
  hasExpired: boolean;
}

export interface MissionExample {
  input: string[][];
  output: string[][];
}

export interface GridCell {
  emoji: string;
  row: number;
  col: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}
