/**
 * Simple Puzzle Solver - Basic working version 
 * ===========================================
 * Temporary component to restore functionality while building responsive version
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OfficerGrid, OfficerDisplayGrid } from '@/components/officer/OfficerGrid';
import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';

interface SimplePuzzleSolverProps {
  puzzle: OfficerTrackPuzzle;
  onBack: () => void;
}

export function SimplePuzzleSolver({ puzzle, onBack }: SimplePuzzleSolverProps) {
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

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50">
      {/* Header */}
      <header className="bg-slate-800 border-b-2 border-amber-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-amber-400">
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
              ← Back to Grid
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Training Examples */}
        {puzzle.train && puzzle.train.length > 0 && (
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 mb-8">
            <h2 className="text-amber-400 font-semibold mb-4 flex items-center">
              📚 TRAINING EXAMPLES
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {puzzle.train.map((example, index) => (
                <div key={index} className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-amber-300 text-sm font-semibold mb-3 text-center">
                    Example {index + 1}
                  </h3>
                  <div className="flex items-center justify-center space-x-4">
                    <div>
                      <OfficerDisplayGrid
                        grid={example.input}
                        title="INPUT"
                        cellSize={32}
                      />
                    </div>
                    <div className="text-cyan-400 text-xl">→</div>
                    <div>
                      <OfficerDisplayGrid
                        grid={example.output}
                        title="OUTPUT"
                        cellSize={32}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solving Interface */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
          <h2 className="text-amber-400 font-semibold mb-6 flex items-center">
            🧩 SOLVE THE PUZZLE
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Test Input */}
            <div className="text-center">
              <h3 className="text-amber-300 text-sm font-semibold mb-4">TEST INPUT</h3>
              <OfficerDisplayGrid
                grid={testInput}
                cellSize={40}
                className="mx-auto"
              />
            </div>

            {/* User Solution */}
            <div className="text-center">
              <h3 className="text-amber-300 text-sm font-semibold mb-4">YOUR SOLUTION</h3>
              <OfficerGrid
                initialGrid={userSolution}
                cellSize={40}
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

            {/* Expected Output (for debugging) */}
            {process.env.NODE_ENV === 'development' && expectedOutput.length > 0 && (
              <div className="text-center">
                <h3 className="text-green-300 text-sm font-semibold mb-4">EXPECTED (DEBUG)</h3>
                <OfficerDisplayGrid
                  grid={expectedOutput}
                  cellSize={40}
                  className="mx-auto opacity-70"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              onClick={() => {
                // TODO: Add solution validation
                alert('Solution validation not implemented yet - check console for your solution');
                console.log('User solution:', userSolution);
                console.log('Expected output:', expectedOutput);
              }}
            >
              🎯 Submit Solution
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}