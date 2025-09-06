/**
 * Responsive Puzzle Solver
 * =========================
 * Complete responsive puzzle solving interface with proper scaling
 * Replaces SimplePuzzleSolver with full responsive design implementation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveOfficerGrid, ResponsiveOfficerDisplayGrid } from '@/components/officer/ResponsiveOfficerGrid';
import { TrainingExamplesSection } from '@/components/officer/TrainingExamplesSection';
import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';

interface ResponsivePuzzleSolverProps {
  puzzle: OfficerTrackPuzzle;
  onBack: () => void;
}

export function ResponsivePuzzleSolver({ puzzle, onBack }: ResponsivePuzzleSolverProps) {
  const [userSolution, setUserSolution] = useState<ARCGrid>([]);

  // Initialize empty solution grid
  const initializeSolution = () => {
    if (puzzle.test && puzzle.test.length > 0 && puzzle.test[0].input) {
      const inputGrid = puzzle.test[0].input;
      const emptyGrid = inputGrid.map(row => row.map(() => 0));
      setUserSolution(emptyGrid);
    }
  };

  // Copy test input to solution
  const copyInput = () => {
    if (puzzle.test && puzzle.test.length > 0 && puzzle.test[0].input) {
      setUserSolution(puzzle.test[0].input.map(row => [...row]));
    }
  };

  // Reset solution
  const resetSolution = () => {
    if (puzzle.test && puzzle.test.length > 0 && puzzle.test[0].input) {
      const inputGrid = puzzle.test[0].input;
      const emptyGrid = inputGrid.map(row => row.map(() => 0));
      setUserSolution(emptyGrid);
    }
  };

  // Initialize on first render
  if (userSolution.length === 0 && puzzle.test && puzzle.test.length > 0) {
    initializeSolution();
  }

  const testInput = puzzle.test?.[0]?.input || [];
  const expectedOutput = puzzle.test?.[0]?.output || [];
  const trainingExamples = puzzle.train || [];

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50">
      {/* Header */}
      <header className="bg-slate-800 border-b-2 border-amber-400 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl md:text-2xl font-bold text-amber-400">
                🎖️ PUZZLE SOLVER
              </h1>
              <Badge className="bg-amber-600 text-slate-900 font-bold">
                {puzzle.id}
              </Badge>
            </div>
            
            <Button 
              variant="outline" 
              className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
              onClick={onBack}
            >
              <span className="hidden sm:inline">←</span> Back
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Training Examples Section */}
        {trainingExamples.length > 0 && (
          <TrainingExamplesSection
            examples={trainingExamples}
            emojiSet="tech_set1"
            title="📚 TRAINING EXAMPLES - Study the Pattern"
          />
        )}

        {/* Solving Interface */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-amber-400 font-semibold flex items-center">
              🧩 SOLVE THE PUZZLE
            </h2>
            <div className="text-slate-400 text-sm">
              Apply the pattern to solve
            </div>
          </div>

          {/* Desktop/Tablet Layout: Optimized for better space utilization */}
          <div className="hidden lg:block">
            <div className="flex items-start justify-center gap-8 max-w-6xl mx-auto">
              {/* Test Input */}
              <div className="flex-1 max-w-md text-center">
                <h3 className="text-amber-300 text-sm font-semibold mb-4">TEST INPUT</h3>
                <ResponsiveOfficerDisplayGrid
                  grid={testInput}
                  containerType="solver"
                  className="mx-auto"
                />
              </div>

              {/* Transformation Indicator */}
              <div className="flex items-center justify-center py-8">
                <div className="text-cyan-400 text-3xl font-bold px-4">
                  →
                </div>
              </div>

              {/* User Solution */}
              <div className="flex-1 max-w-md text-center">
                <h3 className="text-amber-300 text-sm font-semibold mb-4">YOUR SOLUTION</h3>
                <ResponsiveOfficerGrid
                  initialGrid={userSolution}
                  containerType="solver"
                  className="mx-auto"
                  onChange={setUserSolution}
                />
                
                <div className="flex justify-center space-x-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                    onClick={copyInput}
                  >
                    Copy Input
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    onClick={resetSolution}
                  >
                    Reset
                  </Button>
                </div>
              </div>

            </div>
          </div>

          {/* Mobile/Tablet Layout: Stacked */}
          <div className="lg:hidden space-y-8">
            {/* Test Input */}
            <div className="text-center">
              <h3 className="text-amber-300 text-sm font-semibold mb-4">TEST INPUT</h3>
              <ResponsiveOfficerDisplayGrid
                grid={testInput}
                containerType="solver"
                className="mx-auto"
              />
            </div>

            {/* Arrow */}
            <div className="text-center">
              <div className="text-cyan-400 text-2xl font-bold">
                ↓ APPLY PATTERN ↓
              </div>
            </div>

            {/* User Solution */}
            <div className="text-center">
              <h3 className="text-amber-300 text-sm font-semibold mb-4">YOUR SOLUTION</h3>
              <ResponsiveOfficerGrid
                initialGrid={userSolution}
                containerType="solver"
                className="mx-auto"
                onChange={setUserSolution}
              />
              
              <div className="flex justify-center space-x-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                  onClick={copyInput}
                >
                  Copy Input
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  onClick={resetSolution}
                >
                  Reset
                </Button>
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8 pt-6 border-t border-slate-600">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              onClick={() => {
                // TODO: Add solution validation
                alert('Solution validation not implemented yet - check console for your solution');
                console.log('User solution:', userSolution);
                console.log('Expected output:', expectedOutput);
                
                // Compare solutions for debugging
                if (expectedOutput.length > 0) {
                  const matches = JSON.stringify(userSolution) === JSON.stringify(expectedOutput);
                  console.log('Solution matches expected:', matches);
                }
              }}
            >
              🎯 Submit Solution
            </Button>
          </div>
        </div>

        {/* Pattern Analysis Tip */}
        <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
          <div className="text-blue-300 text-sm">
            <strong>💡 Solving Strategy:</strong> 
            {trainingExamples.length > 0 
              ? ` Study the ${trainingExamples.length} training examples above to identify the transformation pattern, then apply it to the test input.`
              : ' Analyze the test input and determine the expected transformation pattern.'
            }
          </div>
        </div>
      </main>
    </div>
  );
}