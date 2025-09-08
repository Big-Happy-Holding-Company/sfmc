/**
 * Simple Responsive Puzzle Grid
 * 
 * CSS Grid that adapts to screen size:
 * - Mobile: 1 column
 * - Tablet: 2-3 columns  
 * - Desktop: 4+ columns
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OfficerPuzzle } from '@/services/officerArcAPI';

interface PuzzleGridProps {
  puzzles: OfficerPuzzle[];
  loading?: boolean;
  onSelectPuzzle: (puzzle: OfficerPuzzle) => void;
}

export function PuzzleGrid({ puzzles, loading, onSelectPuzzle }: PuzzleGridProps) {
  
  // Difficulty colors
  const getDifficultyBadge = (difficulty: string) => {
    const colorMap = {
      'impossible': 'bg-red-600 text-white',
      'extremely_hard': 'bg-orange-600 text-white', 
      'very_hard': 'bg-yellow-600 text-black',
      'challenging': 'bg-blue-600 text-white'
    };
    
    const displayName = {
      'impossible': 'Impossible',
      'extremely_hard': 'Extremely Hard',
      'very_hard': 'Very Hard', 
      'challenging': 'Challenging'
    };
    
    return {
      className: colorMap[difficulty as keyof typeof colorMap] || 'bg-gray-600',
      label: displayName[difficulty as keyof typeof displayName] || difficulty
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-slate-800 border-slate-600">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-600 rounded w-16"></div>
                    <div className="h-4 bg-slate-600 rounded w-20"></div>
                  </div>
                  <div className="h-8 bg-slate-600 rounded w-12"></div>
                </div>
                <div className="h-6 bg-slate-600 rounded mb-4 w-24"></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="h-16 bg-slate-600 rounded"></div>
                  <div className="h-16 bg-slate-600 rounded"></div>
                  <div className="h-16 bg-slate-600 rounded"></div>
                  <div className="h-16 bg-slate-600 rounded"></div>
                </div>
                <div className="h-8 bg-slate-600 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (puzzles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 text-lg mb-2">No puzzles found</div>
        <div className="text-slate-500 text-sm">Try adjusting your filters</div>
      </div>
    );
  }


  // Get analysis quality badge based on arc-explainer metadata
  const getAnalysisQualityBadge = (puzzle: OfficerPuzzle) => {
    const attempts = puzzle.totalExplanations;
    const hasData = attempts > 0;
    
    if (!hasData) return { label: 'No Analysis', className: 'bg-gray-600 text-white' };
    if (attempts >= 50) return { label: 'Extensively Analyzed', className: 'bg-green-600 text-white' };
    if (attempts >= 20) return { label: 'Well Analyzed', className: 'bg-blue-600 text-white' };
    if (attempts >= 5) return { label: 'Analyzed', className: 'bg-orange-600 text-white' };
    return { label: 'Limited Data', className: 'bg-red-600 text-white' };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {puzzles.map((puzzle) => {
        const difficultyBadge = getDifficultyBadge(puzzle.difficulty);
        const analysisQualityBadge = getAnalysisQualityBadge(puzzle);
        
        return (
          <Card 
            key={puzzle.id}
            className="bg-slate-800 border-slate-600 hover:border-amber-500 transition-colors cursor-pointer group"
            onClick={() => onSelectPuzzle(puzzle)}
          >
            <CardContent className="p-6">
              {/* Header with Analysis Quality and Attempts */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                  <Badge className={`text-xs ${analysisQualityBadge.className} font-semibold`}>
                    🤖 {analysisQualityBadge.label}
                  </Badge>
                  <Badge className={`text-xs ${difficultyBadge.className}`}>
                    💀 {difficultyBadge.label}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Analysis Count</div>
                  <div className="text-lg font-bold text-amber-400">#{puzzle.totalExplanations}</div>
                </div>
              </div>

              {/* Puzzle ID - Larger and more prominent */}
              <div className="mb-4">
                <div className="text-amber-200 font-mono text-lg font-bold">
                  {puzzle.id}
                </div>
              </div>

              {/* Rich Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* AI Success Rate */}
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Success Rate</div>
                  <div className={`text-lg font-bold ${
                    puzzle.avgAccuracy === 0 ? 'text-red-400' :
                    puzzle.avgAccuracy <= 0.25 ? 'text-orange-400' :
                    puzzle.avgAccuracy <= 0.50 ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    {puzzle.avgAccuracy === 0 ? 'Never' : `${(puzzle.avgAccuracy * 100).toFixed(0)}%`}
                  </div>
                </div>

                {/* AI Confidence when Wrong */}
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Confidence</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {puzzle.avgConfidence ? `${Math.round(puzzle.avgConfidence)}%` : 'N/A'}
                  </div>
                </div>

                {/* Failed Attempts */}
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Failed</div>
                  <div className="text-lg font-bold text-purple-400">
                    {puzzle.wrongCount?.toLocaleString() || '0'}
                  </div>
                </div>

                {/* Human Feedback */}
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Feedback</div>
                  <div className="text-lg font-bold text-pink-400">
                    {puzzle.totalFeedback ? `${puzzle.negativeFeedback || 0}/${puzzle.totalFeedback}` : '0/0'}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                size="sm" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-slate-900 group-hover:bg-amber-500 font-semibold"
              >
                🎯 Accept Challenge
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}