/**
 * Responsive Puzzle Solver
 * =========================
 * Complete responsive puzzle solving interface with proper scaling
 * Replaces SimplePuzzleSolver with full responsive design implementation
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveOfficerGrid, ResponsiveOfficerDisplayGrid } from '@/components/officer/ResponsiveOfficerGrid';
import { TrainingExamplesSection } from '@/components/officer/TrainingExamplesSection';
import { GridSizeSelector } from '@/components/officer/GridSizeSelector';
import { TestCaseNavigation } from '@/components/officer/TestCaseNavigation';
import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';

interface ResponsivePuzzleSolverProps {
  puzzle: OfficerTrackPuzzle;
  onBack: () => void;
}

export function ResponsivePuzzleSolver({ puzzle, onBack }: ResponsivePuzzleSolverProps) {
  // Multi-test case state
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [solutions, setSolutions] = useState<ARCGrid[]>([]);
  const [outputDimensions, setOutputDimensions] = useState<Array<{width: number; height: number}>>([]);
  const [completedTests, setCompletedTests] = useState<boolean[]>([]);

  const totalTests = puzzle.test?.length || 0;
  const currentTest = puzzle.test?.[currentTestIndex];
  const testInput = currentTest?.input || [];
  const expectedOutput = currentTest?.output || [];
  const trainingExamples = puzzle.train || [];

  // Initialize state for all test cases
  useEffect(() => {
    if (puzzle.test && puzzle.test.length > 0) {
      const newSolutions: ARCGrid[] = [];
      const newDimensions: Array<{width: number; height: number}> = [];
      const newCompleted: boolean[] = [];

      puzzle.test.forEach((test, index) => {
        // Default to input dimensions, but allow user override
        const inputHeight = test.input?.length || 3;
        const inputWidth = test.input?.[0]?.length || 3;
        
        // Create empty solution grid matching input size initially
        const emptyGrid = Array(inputHeight).fill(null).map(() => Array(inputWidth).fill(0));
        
        newSolutions.push(emptyGrid);
        newDimensions.push({ width: inputWidth, height: inputHeight });
        newCompleted.push(false);
      });

      setSolutions(newSolutions);
      setOutputDimensions(newDimensions);
      setCompletedTests(newCompleted);
    }
  }, [puzzle.test]);

  // Get suggested sizes from training examples
  const getSuggestedSizes = () => {
    const suggestions: Array<{ width: number; height: number; label: string }> = [];
    const seenSizes = new Set<string>();

    trainingExamples.forEach((example, index) => {
      const outputHeight = example.output?.length || 0;
      const outputWidth = example.output?.[0]?.length || 0;
      const sizeKey = `${outputWidth}x${outputHeight}`;
      
      if (!seenSizes.has(sizeKey) && outputWidth > 0 && outputHeight > 0) {
        seenSizes.add(sizeKey);
        suggestions.push({
          width: outputWidth,
          height: outputHeight,
          label: `(Ex ${index + 1})`
        });
      }
    });

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  // Handle output size change for current test
  const handleSizeChange = (newWidth: number, newHeight: number) => {
    const newDimensions = [...outputDimensions];
    newDimensions[currentTestIndex] = { width: newWidth, height: newHeight };
    setOutputDimensions(newDimensions);

    // Create new empty grid with new dimensions
    const newGrid = Array(newHeight).fill(null).map(() => Array(newWidth).fill(0));
    const newSolutions = [...solutions];
    newSolutions[currentTestIndex] = newGrid;
    setSolutions(newSolutions);

    // Mark as incomplete since we reset the solution
    const newCompleted = [...completedTests];
    newCompleted[currentTestIndex] = false;
    setCompletedTests(newCompleted);
  };

  // Handle test case selection
  const handleTestSelect = (testIndex: number) => {
    setCurrentTestIndex(testIndex);
  };

  // Get current solution for active test
  const currentSolution = solutions[currentTestIndex] || [];
  const currentDimensions = outputDimensions[currentTestIndex] || { width: 3, height: 3 };
  const hasExistingData = currentSolution.some(row => row.some(cell => cell !== 0));

  // Update current solution
  const updateCurrentSolution = (newGrid: ARCGrid) => {
    const newSolutions = [...solutions];
    newSolutions[currentTestIndex] = newGrid;
    setSolutions(newSolutions);

    // Check if solution matches expected output
    if (expectedOutput.length > 0) {
      const matches = JSON.stringify(newGrid) === JSON.stringify(expectedOutput);
      const newCompleted = [...completedTests];
      newCompleted[currentTestIndex] = matches;
      setCompletedTests(newCompleted);
    }
  };

  // Copy input to solution
  const copyInput = () => {
    if (testInput.length > 0) {
      updateCurrentSolution(testInput.map(row => [...row]));
    }
  };

  // Reset solution to empty
  const resetSolution = () => {
    const { width, height } = currentDimensions;
    const emptyGrid = Array(height).fill(null).map(() => Array(width).fill(0));
    updateCurrentSolution(emptyGrid);
  };

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Training Examples Section */}
        {trainingExamples.length > 0 && (
          <TrainingExamplesSection
            examples={trainingExamples}
            emojiSet="tech_set1"
            title="📚 TRAINING EXAMPLES - Apply what you learn from them to solve the puzzle"
          />
        )}

        {/* Test Case Navigation */}
        {totalTests > 1 && (
          <TestCaseNavigation
            totalTests={totalTests}
            currentTestIndex={currentTestIndex}
            completedTests={completedTests}
            onTestSelect={handleTestSelect}
          />
        )}

        {/* Grid Size Controls */}
        <GridSizeSelector
          width={currentDimensions.width}
          height={currentDimensions.height}
          onSizeChange={handleSizeChange}
          hasExistingData={hasExistingData}
          suggestedSizes={getSuggestedSizes()}
        />

        {/* Solving Interface */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-amber-400 font-semibold flex items-center">
              🧩 SOLVE TEST CASE {currentTestIndex + 1}
            </h2>
            <div className="text-slate-400 text-sm">
              {completedTests[currentTestIndex] ? '✅ Solved!' : 'Apply the pattern to solve'}
            </div>
          </div>

          {/* Desktop Layout: Optimized for better space utilization */}
          <div className="hidden lg:block">
            <div className="flex items-start justify-center gap-12 max-w-7xl mx-auto px-4">
              {/* Test Input */}
              <div className="flex-1 max-w-sm text-center">
                <h3 className="text-amber-300 text-sm font-semibold mb-6">TEST INPUT</h3>
                <ResponsiveOfficerDisplayGrid
                  grid={testInput}
                  containerType="solver"
                  className="mx-auto"
                />
              </div>

              {/* Transformation Indicator */}
              <div className="flex items-center justify-center py-12 min-w-0">
                <div className="text-cyan-400 text-4xl font-bold px-6">
                  →
                </div>
              </div>

              {/* User Solution */}
              <div className="flex-1 max-w-sm text-center">
                <h3 className="text-amber-300 text-sm font-semibold mb-6">YOUR SOLUTION</h3>
                <ResponsiveOfficerGrid
                  initialGrid={currentSolution}
                  containerType="solver"
                  className="mx-auto"
                  onChange={updateCurrentSolution}
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

          {/* Tablet Layout: Semi-compact side-by-side */}
          <div className="hidden md:block lg:hidden">
            <div className="flex flex-col items-center space-y-8 max-w-5xl mx-auto px-4">
              <div className="flex items-center justify-center gap-8 w-full">
                {/* Test Input */}
                <div className="flex-1 text-center max-w-xs">
                  <h3 className="text-amber-300 text-sm font-semibold mb-5">TEST INPUT</h3>
                  <ResponsiveOfficerDisplayGrid
                    grid={testInput}
                    containerType="solver"
                    className="mx-auto"
                  />
                </div>

                {/* Transformation Indicator */}
                <div className="text-cyan-400 text-3xl font-bold px-4 min-w-0">
                  →
                </div>

                {/* User Solution */}
                <div className="flex-1 text-center max-w-xs">
                  <h3 className="text-amber-300 text-sm font-semibold mb-5">YOUR SOLUTION</h3>
                  <ResponsiveOfficerGrid
                    initialGrid={currentSolution}
                    containerType="solver"
                    className="mx-auto"
                    onChange={updateCurrentSolution}
                  />
                </div>
              </div>
              
              {/* Controls below on tablet */}
              <div className="flex justify-center space-x-2">
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

          {/* Mobile Layout: Stack vertically with proper spacing */}
          <div className="md:hidden space-y-8 px-2">
            {/* Test Input */}
            <div className="text-center">
              <h3 className="text-amber-300 text-sm font-semibold mb-6">TEST INPUT</h3>
              <ResponsiveOfficerDisplayGrid
                grid={testInput}
                containerType="solver"
                className="mx-auto"
              />
            </div>

            {/* Arrow */}
            <div className="text-center py-4">
              <div className="text-cyan-400 text-2xl font-bold">
                ↓ APPLY PATTERN ↓
              </div>
            </div>

            {/* User Solution */}
            <div className="text-center">
              <h3 className="text-amber-300 text-sm font-semibold mb-6">YOUR SOLUTION</h3>
              <ResponsiveOfficerGrid
                initialGrid={currentSolution}
                containerType="solver"
                className="mx-auto"
                onChange={updateCurrentSolution}
              />
              
              <div className="flex justify-center space-x-2 mt-6">
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
                console.log('User solution:', currentSolution);
                console.log('Expected output:', expectedOutput);
                
                // Compare solutions for debugging
                if (expectedOutput.length > 0) {
                  const matches = JSON.stringify(currentSolution) === JSON.stringify(expectedOutput);
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