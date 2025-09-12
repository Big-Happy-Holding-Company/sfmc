/**
 * HARC Platform - Assessment Interface
 * ===================================
 * A clean, minimalist interface for presenting a curated sequence of ARC puzzles
 * to participants for the purpose of collecting human performance data.
 */

import { useState, useEffect } from 'react';
import type { OfficerTrackPuzzle, ARCPuzzle, OfficerRankRequirement } from '@/types/arcTypes';
import { ResponsivePuzzleSolver } from '@/components/officer/ResponsivePuzzleSolver';
import { makeAPICall, categorizeDifficulty } from '@/services/officerArcAPI'; // Import the base API call function

const mapAiDifficultyToRank = (aiDifficulty: 'practically_impossible' | 'most_llms_fail' | 'unreliable'): OfficerRankRequirement => {
    switch (aiDifficulty) {
        case 'practically_impossible':
            return 'GENERAL';
        case 'most_llms_fail':
            return 'MAJOR';
        case 'unreliable':
        default:
            return 'LIEUTENANT';
    }
};

// Fetches the curated list of puzzles for the initial assessment and adapts them to the required UI type.
const fetchAssessmentPuzzles = async (): Promise<OfficerTrackPuzzle[]> => {
  const assessmentPuzzleIds = [
    '87ab05b8',
    'be03b35f',
    '27a28665',
    'd35bdbdc',
  ];

  console.log('Fetching curated assessment puzzles by ID...');

  const puzzlePromises = assessmentPuzzleIds.map(async (id) => {
    try {
      const apiResponse = await makeAPICall(`/api/puzzle/task/${id}`);
      if (!apiResponse.success || !apiResponse.data) {
        console.warn(`Could not fetch data for puzzle ${id}`);
        return null;
      }

      const { puzzle, performanceData } = apiResponse.data;
      const arcpuzzle: ARCPuzzle = { train: puzzle.train, test: puzzle.test };

      // Adapt the full puzzle data to the OfficerTrackPuzzle type
      const adaptedPuzzle: OfficerTrackPuzzle = {
        ...arcpuzzle,
        id: puzzle.id,
        filename: `${puzzle.id}.json`,
        dataset: 'evaluation', // Placeholder
        difficulty: mapAiDifficultyToRank(categorizeDifficulty(performanceData?.avgAccuracy || 0, (performanceData?.totalExplanations || 0) > 0)),
        gridSize: { minWidth: 3, maxWidth: 30, minHeight: 3, maxHeight: 30 }, // Placeholder
        complexity: {
          trainingExamples: puzzle.train?.length || 0,
          uniqueColors: 9, // Placeholder
          transformationComplexity: 'moderate', // Placeholder
        },
        loadedAt: new Date(),
      };
      return adaptedPuzzle;
    } catch (error) {
      console.error(`Failed to fetch and adapt puzzle ${id}:`, error);
      return null;
    }
  });

  const puzzles = await Promise.all(puzzlePromises);
  return puzzles.filter((p): p is OfficerTrackPuzzle => p !== null);
};

export function AssessmentInterface() {
  const [puzzles, setPuzzles] = useState<OfficerTrackPuzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        setIsLoading(true);
        const assessmentPuzzles = await fetchAssessmentPuzzles();
        if (assessmentPuzzles.length === 0) {
          throw new Error('No assessment puzzles could be loaded.');
        }
        setPuzzles(assessmentPuzzles);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
        setIsLoading(false);
      }
    };

    loadPuzzles();
  }, []);

  const handleNextPuzzle = () => {
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(prev => prev + 1);
    }
  };

  const handlePreviousPuzzle = () => {
    if (currentPuzzleIndex > 0) {
      setCurrentPuzzleIndex(prev => prev - 1);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading Assessment...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-slate-900 text-red-400 flex items-center justify-center">Error: {error}</div>;
  }

  const currentPuzzle = puzzles[currentPuzzleIndex];

  if (!currentPuzzle) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Assessment complete or puzzle not found.</div>;
  }

  return (
    <div className="w-full">
      {/* The ResponsivePuzzleSolver will be integrated here */}
      <ResponsivePuzzleSolver puzzle={currentPuzzle} onBack={() => { /* Navigate back to dashboard */ }} />

      {/* Basic navigation for the assessment sequence */}
      <div className="flex justify-between p-4 bg-slate-800">
        <button onClick={handlePreviousPuzzle} disabled={currentPuzzleIndex === 0} className="px-4 py-2 bg-slate-600 rounded disabled:opacity-50">
          Previous
        </button>
        <span>{`Puzzle ${currentPuzzleIndex + 1} of ${puzzles.length}`}</span>
        <button onClick={handleNextPuzzle} disabled={currentPuzzleIndex === puzzles.length - 1} className="px-4 py-2 bg-slate-600 rounded disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  );
}
