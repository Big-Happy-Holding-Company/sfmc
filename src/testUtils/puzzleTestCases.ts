/**
 * Puzzle Test Cases
 * 
 * Centralized repository of test puzzles with metadata for debugging and testing.
 * 
 * Usage:
 * import { PUZZLE_TEST_CASES, getPuzzleById } from '@/testUtils/puzzleTestCases';
 * 
 * // Get all test cases
 * const allTestCases = PUZZLE_TEST_CASES;
 * 
 * // Get a specific puzzle by ID
 * const puzzle = getPuzzleById('87ab05b8');
 */

export interface PuzzleTestCase {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  gridSize: { width: number; height: number };
  testCount: number;
  dataPath: string;
  tags: string[];
}

const PUZZLE_TEST_CASES: PuzzleTestCase[] = [
  {
    id: '87ab05b8',
    name: '4x4 Basic Test',
    description: 'Simple 4x4 puzzle for basic functionality testing',
    difficulty: 'easy',
    gridSize: { width: 4, height: 4 },
    testCount: 1,
    dataPath: 'data/training/87ab05b8.json',
    tags: ['basic', 'small-grid', 'quick-test']
  },
  {
    id: 'be03b35f',
    name: 'Standard Test Puzzle',
    description: 'Reliable test case for general testing',
    difficulty: 'easy',
    gridSize: { width: 6, height: 6 },
    testCount: 1,
    dataPath: 'data/training/be03b35f.json',
    tags: ['standard', 'balanced']
  },
  {
    id: '9aaea919',
    name: 'Maximum Size Test',
    description: 'Tests grid size limits and performance',
    difficulty: 'hard',
    gridSize: { width: 30, height: 30 },
    testCount: 1,
    dataPath: 'data/training/9aaea919.json',
    tags: ['performance', 'large-grid', 'stress-test']
  },
  {
    id: '27a28665',
    name: 'Multi-Test Challenge',
    description: 'Requires 3 tests to complete',
    difficulty: 'medium',
    gridSize: { width: 8, height: 8 },
    testCount: 3,
    dataPath: 'data/training/27a28665.json',
    tags: ['multi-test', 'challenge']
  }
];

/**
 * Find a puzzle test case by its ID
 */
export function getPuzzleById(id: string): PuzzleTestCase | undefined {
  return PUZZLE_TEST_CASES.find(puzzle => puzzle.id === id);
}

/**
 * Get all test cases that match the given filter criteria
 */
export function findTestCases(filter: Partial<PuzzleTestCase>): PuzzleTestCase[] {
  return PUZZLE_TEST_CASES.filter(puzzle => {
    return Object.entries(filter).every(([key, value]) => {
      return puzzle[key as keyof PuzzleTestCase] === value;
    });
  });
}

/**
 * Get test cases by difficulty level
 */
export function getPuzzlesByDifficulty(difficulty: PuzzleTestCase['difficulty']): PuzzleTestCase[] {
  return PUZZLE_TEST_CASES.filter(puzzle => puzzle.difficulty === difficulty);
}

/**
 * Get test cases that match any of the specified tags
 */
export function getPuzzlesByTags(tags: string[]): PuzzleTestCase[] {
  return PUZZLE_TEST_CASES.filter(puzzle => 
    tags.some(tag => puzzle.tags.includes(tag))
  );
}

// Example usage in test files:
// const easyPuzzles = getPuzzlesByDifficulty('easy');
// const performanceTests = getPuzzlesByTags(['performance', 'stress-test']);
// const specificPuzzle = getPuzzleById('87ab05b8');

export default {
  PUZZLE_TEST_CASES,
  getPuzzleById,
  findTestCases,
  getPuzzlesByDifficulty,
  getPuzzlesByTags
};
