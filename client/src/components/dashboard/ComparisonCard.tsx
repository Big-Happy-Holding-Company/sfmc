/**
 * HARC Platform - Comparison Card
 * ===============================
 * A card that displays a side-by-side comparison of human vs. AI performance
 * for a single ARC puzzle.
 */

import type { OfficerPuzzle } from '@/services/officerArcAPI';

interface HumanPerformanceRecord {
  puzzleId: string;
  finalScore: number;
  timeElapsed: number;
  stepCount: number;
}

interface ComparisonCardProps {
  humanRecord: HumanPerformanceRecord;
  aiRecord: OfficerPuzzle;
}

export function ComparisonCard({ humanRecord, aiRecord }: ComparisonCardProps) {
  const humanTime = (humanRecord.timeElapsed / 1000).toFixed(1);
  const aiAccuracy = (aiRecord.avgAccuracy * 100).toFixed(1);

  // Simple comparison logic: Human wins if AI accuracy is less than 100%
  const humanWon = aiRecord.avgAccuracy < 1;

  return (
    <div className={`bg-slate-700 p-4 rounded-lg border-2 ${humanWon ? 'border-green-500' : 'border-red-500'}`}>
      <h3 className="text-lg font-bold text-amber-300 mb-2">Puzzle: {humanRecord.puzzleId}</h3>
      <div className="grid grid-cols-2 gap-4 text-center">
        {/* Human Performance */}
        <div className="bg-slate-800 p-3 rounded">
          <h4 className="font-bold text-cyan-400 mb-2">Your Performance</h4>
          <div className="text-2xl font-bold">{humanRecord.finalScore.toLocaleString()} <span className="text-sm">CPS</span></div>
          <div className="text-xs text-slate-400 mt-1">
            {humanTime}s / {humanRecord.stepCount} steps
          </div>
        </div>

        {/* AI Benchmark */}
        <div className="bg-slate-800 p-3 rounded">
          <h4 className="font-bold text-purple-400 mb-2">AI Benchmark</h4>
          <div className="text-2xl font-bold">{aiAccuracy}% <span className="text-sm">Accuracy</span></div>
           <div className="text-xs text-slate-400 mt-1">
            {aiRecord.totalExplanations} analyses
          </div>
        </div>
      </div>
      <div className="text-center mt-3 font-bold text-lg">
        {humanWon ? (
          <span className="text-green-400">🏆 You outperformed the AI!</span>
        ) : (
          <span className="text-red-400">🤖 The AI has the edge here.</span>
        )}
      </div>
    </div>
  );
}
