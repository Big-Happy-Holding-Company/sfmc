/**
 * @deprecated Use @/services/core/arcExplainerClient instead
 *
 * Arc-Explainer API Service
 * Integrates with the arc-explainer production API for AI performance metadata
 *
 * DEPRECATION NOTICE: This service is deprecated in favor of the new
 * unified service architecture. Use arcExplainerClient from @/services/core/arcExplainerClient
 * which provides the same functionality with better performance and caching.
 */

const API_BASE_URL = import.meta.env.VITE_ARC_EXPLAINER_URL || 'https://arc-explainer-production.up.railway.app';

export interface PuzzlePerformanceStats {
  puzzleId: string;
  dataset: string;
  avgAccuracy: number;
  wrongCount: number;
  totalAttempts: number;
  compositeScore: number;
  explanationCount: number;
  feedbackCount: number;
  dangerousOverconfidence: boolean;
}

/**
 * Converts PlayFab puzzle ID format to arc-explainer format
 * ARC-TR-007bbfb7 -> 007bbfb7
 * ARC-E2-11852cab -> 11852cab
 * 
 *DOES IT ALSO DO IT THE OTHER WAY????
 */
function convertToArcExplainerFormat(puzzleId: string): string {
  if (puzzleId.includes('-')) {
    return puzzleId.split('-').pop() || puzzleId;
  }
  return puzzleId;
}

/**
 * Determines dataset from PlayFab puzzle ID prefix
 */
function getDatasetFromPuzzleId(puzzleId: string): string {
  if (puzzleId.startsWith('ARC-TR-')) return 'Training';
  if (puzzleId.startsWith('ARC-T2-')) return 'Training 2';
  if (puzzleId.startsWith('ARC-EV-')) return 'Evaluation';
  if (puzzleId.startsWith('ARC-E2-')) return 'Evaluation 2';
  return 'Unknown';
}

/**
 * Fetches performance statistics for a specific puzzle from arc-explainer API
 */
export const getPuzzlePerformanceStats = async (puzzleId: string): Promise<PuzzlePerformanceStats | null> => {
  try {
    const cleanPuzzleId = convertToArcExplainerFormat(puzzleId);
    const dataset = getDatasetFromPuzzleId(puzzleId);

    // Try individual puzzle performance endpoint first
    try {
      const response = await fetch(`${API_BASE_URL}/api/puzzle/performance-stats/${cleanPuzzleId}`);
      if (response.ok) {
        const data = await response.json();
        return {
          puzzleId: cleanPuzzleId,
          dataset,
          avgAccuracy: data.avgAccuracy || 0,
          wrongCount: data.wrongCount || 0,
          totalAttempts: data.totalAttempts || 0,
          compositeScore: data.compositeScore || 0,
          explanationCount: data.explanationCount || 0,
          feedbackCount: data.feedbackCount || 0,
          dangerousOverconfidence: (data.avgAccuracy < 25 && data.avgConfidenceWhenWrong > 75) || false
        };
      }
    } catch (e) {
      // Fall through to batch approach
    }

    // Fallback: search in worst-performing batch
    const batchResponse = await fetch(`${API_BASE_URL}/api/puzzle/worst-performing?limit=50`);
    if (!batchResponse.ok) {
      throw new Error(`HTTP error! status: ${batchResponse.status}`);
    }

    const batchData = await batchResponse.json();
    const puzzleData = batchData.find((p: any) => p.puzzle_id === cleanPuzzleId);

    if (puzzleData) {
      return {
        puzzleId: cleanPuzzleId,
        dataset,
        avgAccuracy: puzzleData.avgAccuracy || 0,
        wrongCount: puzzleData.wrongCount || 0,
        totalAttempts: puzzleData.totalAttempts || 0,
        compositeScore: puzzleData.compositeScore || 0,
        explanationCount: puzzleData.explanationCount || 0,
        feedbackCount: puzzleData.feedbackCount || 0,
        dangerousOverconfidence: (puzzleData.avgAccuracy < 25 && puzzleData.avgConfidenceWhenWrong > 75) || false
      };
    }

    // Return default values if not found
    return {
      puzzleId: cleanPuzzleId,
      dataset,
      avgAccuracy: 0,
      wrongCount: 0,
      totalAttempts: 0,
      compositeScore: 0,
      explanationCount: 0,
      feedbackCount: 0,
      dangerousOverconfidence: false
    };

  } catch (error) {
    console.error('Failed to fetch puzzle performance stats:', error);
    return null;
  }
};
