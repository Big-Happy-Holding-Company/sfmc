/**
 * Puzzle Comparison Card Component
 * ================================
 * Displays a side-by-side comparison for a single puzzle.
 */

import type { AIPuzzlePerformance } from '@/services/arcExplainerAPI';

interface PuzzleComparisonCardProps {
  puzzleId: string;
  humanResult: any; // Replace with a more specific type
  aiResult: AIPuzzlePerformance | null;
}

export function PuzzleComparisonCard({ puzzleId, humanResult, aiResult }: PuzzleComparisonCardProps) {
  const humanCorrect = humanResult?.correct || false;
  const aiAccuracy = aiResult?.avgAccuracy || 0;

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="font-bold text-lg text-amber-300 mb-2">Puzzle: {puzzleId}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-2 rounded ${humanCorrect ? 'bg-green-900' : 'bg-red-900'}`}>
          <p className="font-bold text-white">Your Result</p>
          <p className="text-2xl">{humanCorrect ? '✅ Correct' : '❌ Incorrect'}</p>
        </div>
        <div className={`p-2 rounded ${aiAccuracy > 0.5 ? 'bg-green-900' : 'bg-red-900'}`}>
          <p className="font-bold text-white">AI Average</p>
          <p className="text-2xl">{(aiAccuracy * 100).toFixed(0)}% Accuracy</p>
        </div>
      </div>
    </div>
  );
}
