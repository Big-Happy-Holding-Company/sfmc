// src/services/arcExplainerService.ts

const API_BASE_URL = 'http://127.0.0.1:3000/api'; // Assuming local dev server

export interface PuzzlePerformanceStats {
  puzzleId: string;
  dataset: string; // Assuming the API provides this
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

/**
 * Fetches performance statistics for a given puzzle ID.
 * The API endpoint for a single puzzle's stats isn't explicitly defined in the docs,
 * so this is a hypothetical implementation based on the available information.
 * We might need to fetch all stats and then filter by puzzleId on the client-side.
 */
export const getPuzzlePerformanceStats = async (puzzleId: string): Promise<PuzzlePerformanceStats | null> => {
  try {
    // The docs don't specify an endpoint for a single puzzle's performance.
    // We'll use `/api/puzzle/performance-stats` and filter, assuming it returns an array.
    // This is not efficient and should be improved with a dedicated API endpoint.
    const response = await fetch(`${API_BASE_URL}/puzzle/performance-stats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const allStats: any[] = await response.json();

    // The puzzle ID in the main app might be like 'ARC-EV-e7dd8335' or just 'e7dd8335'
    const cleanPuzzleId = puzzleId.split('-').pop() || puzzleId;

    const puzzleStats = allStats.find(stat => stat.puzzle_id === cleanPuzzleId);

    if (puzzleStats) {
      return {
        puzzleId: puzzleStats.puzzle_id,
        dataset: puzzleStats.dataset || 'N/A', // Placeholder for dataset
        totalAttempts: puzzleStats.solver_attempts || 0,
        correctAttempts: puzzleStats.correct_predictions || 0,
        accuracy: puzzleStats.solver_accuracy_percentage || 0,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch puzzle performance stats:', error);
    return null;
  }
};
