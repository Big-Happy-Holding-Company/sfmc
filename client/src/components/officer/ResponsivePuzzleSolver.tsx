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
import { EmojiPaletteDivider } from '@/components/officer/EmojiPaletteDivider';
import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';
import type { DisplayMode, PuzzleDisplayState } from '@/types/puzzleDisplayTypes';
import type { EmojiSet } from '@/constants/spaceEmojis';

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
  
  // Enhanced display state
  const [displayState, setDisplayState] = useState<PuzzleDisplayState>({
    displayMode: 'emoji',
    emojiSet: 'tech_set1',
    selectedValue: 1,
    showControls: true
  });

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

  // Determine if grids are large (need special layout)
  const isLargeGrid = (grid: ARCGrid) => {
    const height = grid.length;
    const width = grid[0]?.length || 0;
    return height > 10 || width > 10;
  };

  const hasLargeGrids = testInput.length > 10 || (testInput[0]?.length || 0) > 10 || 
                        trainingExamples.some(ex => isLargeGrid(ex.input) || isLargeGrid(ex.output));

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

  // Calculate dynamic cell sizes for full screen usage
  const calculateCellSize = (gridWidth: number, gridHeight: number) => {
    // Use roughly 45% of viewport width for each grid (leaving space for arrow and padding)
    const availableWidth = Math.floor(window.innerWidth * 0.45);
    const availableHeight = Math.floor(window.innerHeight * 0.6); // 60% of viewport height
    
    const cellSizeByWidth = Math.floor(availableWidth / gridWidth);
    const cellSizeByHeight = Math.floor(availableHeight / gridHeight);
    
    // Use the smaller dimension but ensure minimum size
    const cellSize = Math.max(12, Math.min(cellSizeByWidth, cellSizeByHeight));
    return Math.min(cellSize, 80); // Cap at 80px for readability
  };

  const inputCellSize = calculateCellSize(testInput[0]?.length || 1, testInput.length);
  const outputCellSize = calculateCellSize(currentDimensions.width, currentDimensions.height);

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

  // Enhanced display control handlers
  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayState(prev => ({ ...prev, displayMode: mode }));
  };

  const handleEmojiSetChange = (emojiSet: EmojiSet) => {
    setDisplayState(prev => ({ ...prev, emojiSet }));
  };

  const handleValueSelect = (value: number) => {
    setDisplayState(prev => ({ ...prev, selectedValue: value }));
  };

  // Enhanced cell interaction for value painting
  const handleCellInteraction = (row: number, col: number, value: number) => {
    const newGrid = [...currentSolution];
    newGrid[row][col] = displayState.selectedValue;
    updateCurrentSolution(newGrid);
  };

  // Get values used in current puzzle for palette highlighting
  const getUsedValues = (): number[] => {
    const allGrids = [
      ...trainingExamples.flatMap(ex => [ex.input, ex.output]),
      testInput,
      expectedOutput
    ].filter(grid => grid.length > 0);

    const usedValues = new Set<number>();
    allGrids.forEach(grid => {
      grid.forEach(row => {
        row.forEach(cell => usedValues.add(cell));
      });
    });

    return Array.from(usedValues).sort((a, b) => a - b);
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

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        

        {/* Training Examples Section */}
        {trainingExamples.length > 0 && (
          <TrainingExamplesSection
            examples={trainingExamples}
            emojiSet={displayState.emojiSet}
            displayMode={displayState.displayMode}
            title="📚 TRAINING EXAMPLES - Apply what you learn from them to solve the puzzle"
            hasLargeGrids={hasLargeGrids}
          />
        )}


        {/* Test Case Navigation - SILVER THEME */}
        {totalTests > 1 && (
          <div className="bg-gradient-to-r from-slate-200 via-gray-100 to-slate-200 border-2 border-slate-400 rounded-lg p-4 shadow-lg">
            <div className="mb-3">
              <h3 className="text-slate-800 text-lg font-bold flex items-center gap-2 mb-1">
                🎯 MULTI-TEST PUZZLE - ALL {totalTests} TESTS REQUIRED
              </h3>
              <p className="text-slate-700 text-sm">
                ⚠️ You must solve ALL {totalTests} test cases to complete this puzzle. Switch between tests using the buttons below.
              </p>
            </div>
            <TestCaseNavigation
              totalTests={totalTests}
              currentTestIndex={currentTestIndex}
              completedTests={completedTests}
              onTestSelect={handleTestSelect}
            />
          </div>
        )}

        {/* Solving Interface - Full Screen Width */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-amber-400 font-semibold text-3xl">
              🧩 SOLVE TEST CASE {currentTestIndex + 1}
            </h2>
            <div className="text-slate-400 text-xl">
              {completedTests[currentTestIndex] ? '✅ Solved!' : 'Apply the pattern to solve'}
            </div>
          </div>

          {/* Always use side-by-side layout to maximize screen usage */}
          <div className="flex gap-4 w-full">
            {/* Test Input - Left half */}
            <div className="flex-1 bg-slate-800 border border-slate-600 rounded p-2">
              <h3 className="text-amber-300 text-xl font-semibold mb-2 text-center">TEST INPUT</h3>
              <ResponsiveOfficerDisplayGrid
                grid={testInput}
                containerType="solver"
                emojiSet={displayState.emojiSet}
                displayMode={displayState.displayMode}
                className="w-full h-full"
                fixedCellSize={inputCellSize}
              />
            </div>

            {/* Combined Controls Panel - Grid Size + Display + Emoji Palette */}
            <div className="flex flex-col items-center justify-center px-2 space-y-3">
              
              {/* Grid Size Controls - Compact */}
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 w-full">
                <h4 className="text-amber-300 text-xs font-semibold mb-2 text-center">OUTPUT SIZE</h4>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <select
                    value={currentDimensions.width}
                    onChange={(e) => handleSizeChange(parseInt(e.target.value), currentDimensions.height)}
                    className="bg-slate-700 border border-slate-500 rounded px-2 py-1 text-amber-100 text-xs"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
                      <option key={size} value={size}>W: {size}</option>
                    ))}
                  </select>
                  <span className="text-slate-400">×</span>
                  <select
                    value={currentDimensions.height}
                    onChange={(e) => handleSizeChange(currentDimensions.width, parseInt(e.target.value))}
                    className="bg-slate-700 border border-slate-500 rounded px-2 py-1 text-amber-100 text-xs"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
                      <option key={size} value={size}>H: {size}</option>
                    ))}
                  </select>
                </div>
                
                {/* Quick Size Suggestions */}
                {getSuggestedSizes().length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {getSuggestedSizes().slice(0, 3).map((size, index) => (
                      <button
                        key={index}
                        onClick={() => handleSizeChange(size.width, size.height)}
                        className="bg-amber-700 hover:bg-amber-600 text-white text-xs px-2 py-1 rounded"
                      >
                        {size.width}×{size.height}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Display Mode & Emoji Set Controls - Compact */}
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 w-full">
                <h4 className="text-amber-300 text-xs font-semibold mb-2 text-center">DISPLAY</h4>
                
                {/* Display Mode Toggle */}
                <div className="flex justify-center gap-1 mb-2">
                  <button
                    onClick={() => handleDisplayModeChange('arc-colors')}
                    className={`px-2 py-1 text-xs rounded ${displayState.displayMode === 'arc-colors' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    123
                  </button>
                  <button
                    onClick={() => handleDisplayModeChange('emoji')}
                    className={`px-2 py-1 text-xs rounded ${displayState.displayMode === 'emoji' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    🎨
                  </button>
                  <button
                    onClick={() => handleDisplayModeChange('hybrid')}
                    className={`px-2 py-1 text-xs rounded ${displayState.displayMode === 'hybrid' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    MIX
                  </button>
                </div>
                
                {/* Emoji Set Dropdown - Only show when emoji or hybrid mode */}
                {(displayState.displayMode === 'emoji' || displayState.displayMode === 'hybrid') && (
                  <select
                    value={displayState.emojiSet}
                    onChange={(e) => handleEmojiSetChange(e.target.value as any)}
                    className="w-full bg-slate-700 border border-slate-500 rounded px-2 py-1 text-amber-100 text-xs"
                  >
                    <option value="tech_set1">Tech Set 1</option>
                    <option value="tech_set2">Tech Set 2</option>
                    <option value="celestial_set1">Celestial Set 1</option>
                    <option value="celestial_set2">Celestial Set 2</option>
                    <option value="status_alerts">Status Alerts</option>
                    <option value="weather_climate">Weather Climate</option>
                    <option value="ai_emojis">AI Systems</option>
                    <option value="status_emojis">Human Crew</option>
                  </select>
                )}
              </div>

              {/* Emoji Palette - Main Selection */}
              <EmojiPaletteDivider
                emojiSet={displayState.emojiSet}
                selectedValue={displayState.selectedValue}
                onValueSelect={handleValueSelect}
                usedValues={getUsedValues()}
                displayMode={displayState.displayMode}
                className="bg-slate-800 border border-slate-600 rounded-lg p-3 w-full"
              />
            </div>

            {/* User Solution - Right half */}
            <div className="flex-1 bg-slate-800 border border-slate-600 rounded p-2">
              <h3 className="text-amber-300 text-xl font-semibold mb-2 text-center">YOUR SOLUTION</h3>
              <ResponsiveOfficerGrid
                initialGrid={currentSolution}
                containerType="solver"
                emojiSet={displayState.emojiSet}
                displayMode={displayState.displayMode}
                selectedValue={displayState.selectedValue}
                onCellInteraction={handleCellInteraction}
                enableDragToPaint={true}
                className="w-full h-full"
                onChange={updateCurrentSolution}
                fixedCellSize={outputCellSize}
              />
              
              <div className="flex justify-center space-x-2 mt-4">
                <Button size="lg" variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white text-lg px-4 py-2" onClick={copyInput}>
                  Copy Input
                </Button>
                <Button size="lg" variant="outline" className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-lg px-4 py-2" onClick={resetSolution}>
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