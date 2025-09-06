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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="bg-slate-800 border-slate-600">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-600 rounded mb-2"></div>
                <div className="h-6 bg-slate-600 rounded mb-2"></div>
                <div className="h-4 bg-slate-600 rounded w-2/3"></div>
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {puzzles.map((puzzle) => {
        const difficultyBadge = getDifficultyBadge(puzzle.difficulty);
        
        return (
          <Card 
            key={puzzle.id}
            className="bg-slate-800 border-slate-600 hover:border-amber-500 transition-colors cursor-pointer group"
            onClick={() => onSelectPuzzle(puzzle)}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <Badge className="bg-amber-600 text-slate-900 text-xs">
                  ARC PUZZLE
                </Badge>
                <div className="text-xs text-slate-400">
                  #{puzzle.totalExplanations}
                </div>
              </div>

              {/* Difficulty Badge */}
              <div className="mb-3">
                <Badge className={`text-xs ${difficultyBadge.className}`}>
                  {difficultyBadge.label}
                </Badge>
              </div>

              {/* Puzzle ID */}
              <div className="mb-3">
                <div className="text-amber-200 font-mono text-sm font-semibold">
                  {puzzle.id}
                </div>
                <div className="text-xs text-slate-400">
                  AI Accuracy: {(puzzle.avgAccuracy * 100).toFixed(0)}%
                </div>
              </div>

              {/* AI Performance Indicator */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">🤖 AI:</span>
                  <div className={`px-2 py-1 rounded text-xs ${
                    puzzle.avgAccuracy === 0 ? 'bg-red-900 text-red-200' :
                    puzzle.avgAccuracy <= 0.25 ? 'bg-orange-900 text-orange-200' :
                    puzzle.avgAccuracy <= 0.50 ? 'bg-yellow-900 text-yellow-200' :
                    'bg-blue-900 text-blue-200'
                  }`}>
                    {puzzle.avgAccuracy === 0 ? 'Never Solved' : `${(puzzle.avgAccuracy * 100).toFixed(0)}% Success`}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                size="sm" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-slate-900 group-hover:bg-amber-500"
              >
                Select Challenge
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}