/**
 * Responsive Puzzle Solver
 * =========================
 * Complete responsive puzzle solving interface with proper scaling
 * Replaces SimplePuzzleSolver with full responsive design implementation
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
import { getPuzzlePerformanceStats, PuzzlePerformanceStats } from '@/services/arcExplainerService';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { ResponsiveOfficerGrid, ResponsiveOfficerDisplayGrid } from '@/components/officer/ResponsiveOfficerGrid';
import { TrainingExamplesSection } from '@/components/officer/TrainingExamplesSection';
import { TestCaseNavigation } from '@/components/officer/TestCaseNavigation';
import { PuzzleSolverControls } from '@/components/officer/PuzzleSolverControls';
import { PuzzleTools } from '@/components/officer/PuzzleTools';
import type { OfficerTrackPuzzle, ARCGrid } from '@/types/arcTypes';
import type { DisplayMode, PuzzleDisplayState } from '@/types/puzzleDisplayTypes';
import type { EmojiSet } from '@/constants/spaceEmojis';
import { puzzlePerformanceService } from '@/services/puzzlePerformanceService';
import { playFabValidation } from '@/services/playfab/validation';
import { playFabEvents } from '@/services/playfab/events';
import { useContainerWidth } from '@/hooks/useContainerWidth';

interface ResponsivePuzzleSolverProps {
  puzzle: OfficerTrackPuzzle;
  onBack: () => void;
  tutorialMode?: boolean;
  isAssessmentMode?: boolean;
  onSolve?: () => void;
  onValidationResult?: (result: any) => void;
}

export function ResponsivePuzzleSolver({ puzzle, onBack, tutorialMode = false, isAssessmentMode = false, onSolve, onValidationResult }: ResponsivePuzzleSolverProps) {
  const [, setLocation] = useLocation();
  // Multi-test case state
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [solutions, setSolutions] = useState<ARCGrid[]>([]);
  const [outputDimensions, setOutputDimensions] = useState<Array<{width: number; height: number}>>([]);
  const [completedTests, setCompletedTests] = useState<boolean[]>([]);
  
  // Enhanced display state
  const [displayState, setDisplayState] = useState<PuzzleDisplayState>({
    displayMode: 'hybrid',
    emojiSet: 'savory_foods',
    selectedValue: 1,
    showControls: true,
  });

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Session tracking state
  const [sessionId] = useState(() => crypto.randomUUID());
  const [sessionStartTime] = useState(() => Date.now());
  const [stepIndex, setStepIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1);

  // Auto-advance state for assessment mode
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [autoAdvanceMessage, setAutoAdvanceMessage] = useState<string | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Performance stats state
  const [performanceStats, setPerformanceStats] = useState<PuzzlePerformanceStats | null>(null);

  // Refs for grid containers to enable dynamic width calculation
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const outputContainerRef = useRef<HTMLDivElement>(null);

  const inputContainerWidth = useContainerWidth(inputContainerRef);
  const outputContainerWidth = useContainerWidth(outputContainerRef);

  if (!puzzle) {
    return <div className="min-h-screen bg-slate-900 text-amber-50 flex items-center justify-center">No puzzle data.</div>;
  }

  const totalTests = puzzle.test?.length || 0;
  const currentTest = puzzle.test?.[currentTestIndex];
  const testInput = currentTest?.input || [];
  const expectedOutput = currentTest?.output || [];
  const trainingExamples = puzzle.train || [];


  // Reset component state when the puzzle prop changes
  useEffect(() => {
    console.log(`[Effect] New puzzle received: ${puzzle.id}. Resetting component state.`);
    setCurrentTestIndex(0);
    setValidationResult(null);
    setValidationError(null);
    setAttemptNumber(1);
    setSolutions([]);
    setOutputDimensions([]);
    setCompletedTests([]);
    setStepIndex(0);
    setIsValidating(false);
    setIsAutoAdvancing(false);
    setAutoAdvanceMessage(null);
    setShowSuccessModal(false);

    if (puzzle.test && puzzle.test.length > 0) {
      const newSolutions: ARCGrid[] = [];
      const newDimensions: Array<{width: number; height: number}> = [];
      const newCompleted: boolean[] = [];

      puzzle.test.forEach((test) => {
        const inputHeight = test.input?.length || 3;
        const inputWidth = test.input?.[0]?.length || 3;
        const emptyGrid = Array(inputHeight).fill(null).map(() => Array(inputWidth).fill(0));
        
        newSolutions.push(emptyGrid);
        newDimensions.push({ width: inputWidth, height: inputHeight });
        newCompleted.push(false);
      });

      setSolutions(newSolutions);
      setOutputDimensions(newDimensions);
      setCompletedTests(newCompleted);
    }

    // Fetch performance stats for the new puzzle
    const fetchStats = async () => {
      const stats = await getPuzzlePerformanceStats(puzzle.id);
      setPerformanceStats(stats);
    };

    fetchStats();
  }, [puzzle.id]);

  // Initialize session and log puzzle start event
  useEffect(() => {
    const logSessionStart = async () => {
      try {
        await playFabEvents.logPuzzleEvent(
          "SFMC",                    // eventName
          sessionId,                 // sessionId
          attemptNumber,             // attemptNumber
          puzzle.id,                 // game_id (puzzle ID)
          stepIndex,                 // stepIndex (starts at 0)
          0,                         // positionX
          0,                         // positionY
          {                          // payloadSummary
            totalTests: totalTests,
            trainingExamples: trainingExamples.length,
            puzzleId: puzzle.id
          },
          0,                         // deltaMs (0 for start)
          "Officer Track Puzzle",    // game_title
          "start",                   // status
          "officer-track",           // category
          "game_start",             // event_type
          0,                         // selection_value
          new Date().toISOString()   // game_time
        );
      } catch (error) {
        // Event logging failures should not break gameplay - fail silently
      }
    };

    logSessionStart();

    // Cleanup function to log session end when component unmounts
    return () => {
      const logSessionEnd = async () => {
        try {
          const sessionDuration = Date.now() - sessionStartTime;
          await playFabEvents.logPuzzleEvent(
            "SFMC",                    // eventName
            sessionId,                 // sessionId
            attemptNumber,             // attemptNumber
            puzzle.id,                 // game_id (puzzle ID)
            stepIndex + 1,             // stepIndex (increment for final step)
            0,                         // positionX
            0,                         // positionY
            {                          // payloadSummary
              sessionDurationMs: sessionDuration,
              finalStepIndex: stepIndex,
              puzzleId: puzzle.id
            },
            sessionDuration,           // deltaMs (total session time)
            "Officer Track Puzzle",    // game_title
            "stop",                    // status
            "officer-track",           // category
            "game_completion",         // event_type
            0,                         // selection_value
            new Date().toISOString()   // game_time
          );
        } catch (error) {
          // Event logging failures should not break gameplay - fail silently
        }
      };

      logSessionEnd();
    };
  }, [sessionId, attemptNumber, puzzle.id, stepIndex, totalTests, trainingExamples.length, sessionStartTime]);


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

  // Helper function to log player actions and increment step index
  const logPlayerAction = async (
    eventType: string,
    positionX: number,
    positionY: number,
    payloadSummary: object | null,
    status: "won" | "fail" | "stop" | "start" = "start"
  ) => {
    try {
      const currentTime = Date.now();
      const deltaMs = currentTime - sessionStartTime;
      
      await playFabEvents.logPuzzleEvent(
        "SFMC",                    // eventName
        sessionId,                 // sessionId
        attemptNumber,             // attemptNumber
        puzzle.id,                 // game_id (puzzle ID)
        stepIndex,                 // stepIndex (current step)
        positionX,                 // positionX
        positionY,                 // positionY
        payloadSummary,            // payloadSummary
        deltaMs,                   // deltaMs (time since session start)
        "Officer Track Puzzle",    // game_title
        status,                    // status
        "officer-track",           // category
        "player_action",           // event_type
        displayState.selectedValue,// selection_value
        new Date().toISOString()   // game_time
      );
      
      // Increment step index for next action
      setStepIndex(prev => prev + 1);
    } catch (error) {
      // Event logging failures should not break gameplay - fail silently
    }
  };

  // Handle output size change for current test
  const handleSizeChange = (newWidth: number, newHeight: number) => {
    const oldDimensions = outputDimensions[currentTestIndex];
    
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

    // Log grid size change event
    logPlayerAction(
      "grid_resize",
      0,
      currentTestIndex,
      {
        fromSize: oldDimensions,
        toSize: { width: newWidth, height: newHeight },
        testCase: currentTestIndex
      }
    );
  };

  // Handle test case selection
  const handleTestSelect = (testIndex: number) => {
    const oldTestIndex = currentTestIndex;
    setCurrentTestIndex(testIndex);

    // Log test case navigation event
    logPlayerAction(
      "test_navigation",
      0,
      testIndex,
      {
        fromTest: oldTestIndex,
        toTest: testIndex,
        totalTests: totalTests
      }
    );
  };

  // Get current solution for active test
  const currentSolution = solutions[currentTestIndex] || [];
  const currentDimensions = outputDimensions[currentTestIndex] || { width: 3, height: 3 };
  const hasExistingData = currentSolution.some(row => row.some(cell => cell !== 0));

  // Calculate dynamic cell sizes for much better space utilization
  const calculateCellSize = (gridWidth: number, gridHeight: number, containerWidth: number) => {
    if (!containerWidth || !gridWidth || !gridHeight) {
      return 24; // A reasonable default cell size
    }

    // Account for padding within the container (e.g., p-4 -> 1rem on each side)
    const availableWidth = containerWidth - 32; 
    const availableHeight = Math.floor(window.innerHeight * 0.45); // Limit height to 45% of viewport

    const cellSizeByWidth = Math.floor(availableWidth / gridWidth);
    const cellSizeByHeight = Math.floor(availableHeight / gridHeight);

    // Use the smaller of the two calculated sizes to ensure the grid fits
    const cellSize = Math.min(cellSizeByWidth, cellSizeByHeight);

    // Set practical limits for cell size
    return Math.max(16, Math.min(cellSize, 50)); // Min 16px, Max 50px
  };

  const inputCellSize = calculateCellSize(testInput[0]?.length || 1, testInput.length, inputContainerWidth);
  const outputCellSize = calculateCellSize(currentDimensions.width, currentDimensions.height, outputContainerWidth);

  // Validate puzzle with PlayFab when all tests are complete
  const validatePuzzleWithPlayFab = async () => {
    if (isValidating) return; // Prevent double submission
    
    setIsValidating(true);
    setValidationError(null);
    
    // DEBUG: Log puzzle ID being sent to PlayFab
    console.log('🔍 DEBUG - Puzzle validation details:');
    console.log('  Puzzle ID:', puzzle.id);
    console.log('  Solutions array:', solutions);
    console.log('  Total test cases:', totalTests);
    console.log('  Expected outputs:', puzzle.test?.map(t => t.output));
    
    // Log validation start event
    logPlayerAction(
      "validation_start",
      0,
      0,
      {
        validationType: "playfab_cloudscript",
        totalTests: totalTests,
        puzzleId: puzzle.id,
        debugInfo: {
          puzzleIdSent: puzzle.id,
          solutionsCount: solutions.length,
          expectedTestCases: totalTests
        }
      },
      "start"
    );
    
    try {
      const validationStartTime = Date.now();
      const result = await playFabValidation.validateARCPuzzle({
        puzzleId: puzzle.id,
        solutions: solutions,
        timeElapsed: Date.now() - sessionStartTime,
        attemptNumber: attemptNumber,
        sessionId: sessionId
      });
      
      // Increment attempt number for the next try
      setAttemptNumber(prev => prev + 1);
      
      const validationDuration = Date.now() - validationStartTime;
      setValidationResult(result);
      
      console.log('✅ DEBUG - PlayFab validation result:', result);

      // Show success modal for correct answers
      if (result?.correct) {
        setShowSuccessModal(true);
      }

      // In assessment mode, use validation result callback for advancement logic
      if (isAssessmentMode) {
        if (onValidationResult) {
          console.log('📝 Assessment mode: Calling onValidationResult with:', result);
          onValidationResult(result);
        } else {
          console.error('⚠️ Assessment mode but no onValidationResult callback provided!');
        }
      }
      
      // In regular mode, use original onSolve logic
      if (!isAssessmentMode && result?.correct && onSolve) {
        console.log('✅ Regular mode: Puzzle solved, calling onSolve callback.');
        onSolve();
      }
      
      // Log validation complete event (success)
      logPlayerAction(
        "validation_complete",
        0,
        0,
        {
          serverResult: result,
          validationDurationMs: validationDuration,
          correct: result?.correct,
          puzzleId: puzzle.id
        },
        result?.correct ? "won" : "fail"
      );
      
    } catch (error: any) {
      console.error('❌ DEBUG - PlayFab validation error:', error);
      setValidationError(error.message || 'Validation failed');
      
      // Log validation complete event (error)
      logPlayerAction(
        "validation_complete",
        0,
        0,
        {
          error: error.message || 'Validation failed',
          validationType: "playfab_cloudscript",
          puzzleId: puzzle.id
        },
        "fail"
      );
      
    } finally {
      setIsValidating(false);
    }
  };

  // Update current solution
  const updateCurrentSolution = (newGrid: ARCGrid) => {
    const newSolutions = [...solutions];
    newSolutions[currentTestIndex] = newGrid;
    setSolutions(newSolutions);

    // In assessment mode, don't do frontend validation to avoid confusion
    // Users submit directly to PlayFab for official validation
    if (!isAssessmentMode && expectedOutput.length > 0) {
      const matches = JSON.stringify(newGrid) === JSON.stringify(expectedOutput);
      const newCompleted = [...completedTests];
      const wasAlreadyCompleted = newCompleted[currentTestIndex];
      newCompleted[currentTestIndex] = matches;
      setCompletedTests(newCompleted);
      
      // Log individual test case completion (only on state change) - regular mode only
      if (matches && !wasAlreadyCompleted) {
        logPlayerAction(
          "test_case_complete",
          0,
          currentTestIndex,
          {
            testCase: currentTestIndex,
            totalTests: totalTests,
            correctSolution: true,
            validationType: "frontend_only"
          },
          "won"
        );

        // Auto-advance between test cases within same puzzle (regular mode only)
        if (currentTestIndex < totalTests - 1) {
          console.log(`✅ Test ${currentTestIndex + 1} completed. Auto-advancing to test ${currentTestIndex + 2}...`);
          
          // Show auto-advance notification
          setIsAutoAdvancing(true);
          setAutoAdvanceMessage(`Test ${currentTestIndex + 1} of ${totalTests} complete! Moving to Test ${currentTestIndex + 2}...`);
          
          // Auto-advance to next test after a brief delay for user feedback
          setTimeout(() => {
            setCurrentTestIndex(prevIndex => prevIndex + 1);
            setIsAutoAdvancing(false);
            setAutoAdvanceMessage(null);
          }, 1500);
        }
      }
    }
    
    // In assessment mode, always allow test case navigation without frontend validation
    if (isAssessmentMode) {
      // Initialize completed state to false to avoid confusion
      const newCompleted = [...completedTests];
      newCompleted[currentTestIndex] = false;
      setCompletedTests(newCompleted);
    }
  };

  // Enhanced display control handlers
  const handleDisplayModeChange = (mode: DisplayMode) => {
    const oldMode = displayState.displayMode;
    setDisplayState(prev => ({ ...prev, displayMode: mode }));

    // Log display mode change event
    logPlayerAction(
      "display_mode_change",
      0,
      0,
      {
        fromMode: oldMode,
        toMode: mode,
        emojiSet: displayState.emojiSet
      }
    );
  };

  const handleEmojiSetChange = (emojiSet: EmojiSet) => {
    const oldEmojiSet = displayState.emojiSet;
    setDisplayState(prev => ({ ...prev, emojiSet }));

    // Log emoji set change event
    logPlayerAction(
      "emoji_set_change",
      0,
      0,
      {
        fromSet: oldEmojiSet,
        toSet: emojiSet,
        displayMode: displayState.displayMode
      }
    );
  };

  const handleValueSelect = (value: number) => {
    const oldValue = displayState.selectedValue;
    setDisplayState(prev => ({ ...prev, selectedValue: value }));

    // Log palette value selection event
    logPlayerAction(
      "palette_selection",
      0,
      0,
      {
        fromValue: oldValue,
        toValue: value,
        displayMode: displayState.displayMode
      }
    );
  };

  // Enhanced cell interaction for value painting
  const handleCellInteraction = (row: number, col: number, value: number) => {
    const oldValue = currentSolution[row]?.[col] || 0;
    const newGrid = [...currentSolution];
    newGrid[row][col] = displayState.selectedValue;
    
    // Log cell modification event
    logPlayerAction(
      "cell_change",
      row,
      col,
      {
        oldValue: oldValue,
        newValue: displayState.selectedValue,
        testCase: currentTestIndex,
        tool: "paint"
      }
    );
    
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

  // Get context-aware validation message based on puzzle structure
  const getValidationMessage = (): string => {
    if (!validationResult) return '';
    
    if (validationResult.correct) return ' Puzzle solved successfully!';
    
    const testCount = puzzle.test?.length || 1;
    if (testCount === 1) {
      return ' Solution is incorrect. Try again!';
    } else {
      return ` Some test cases failed. (${testCount} tests required)`;
    }
  };

  // Copy input to solution
  const copyInput = () => {
    if (testInput.length > 0) {
      updateCurrentSolution(testInput.map(row => [...row]));
    }
  };

  // Reset solution to empty
  const handleReplayTutorial = () => {
    setLocation('/tutorial');
  };

  const resetSolution = () => {
    const { width, height } = currentDimensions;
    const emptyGrid = Array(height).fill(null).map(() => Array(width).fill(0));
    updateCurrentSolution(emptyGrid);
  };

  const renderBadges = () => {
    if (!performanceStats) return [];
    return [
      <Badge key="dataset" variant="outline" className="border-sky-400 text-sky-300">Dataset: {performanceStats.dataset}</Badge>,
      <Badge key="attempts" variant="outline" className="border-purple-400 text-purple-300">AI Attempts: {performanceStats.totalAttempts}</Badge>,
      <Badge key="accuracy" variant="outline" className="border-green-400 text-green-300">AI Accuracy: {performanceStats.accuracy.toFixed(1)}%</Badge>,
    ];
  };

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50">
      <Navbar 
        title="ARC Puzzles for People" 
        badges={renderBadges()} 
        showBackButton={true} 
        onBack={onBack}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        

        {/* Training Examples Section */}
        {trainingExamples.length > 0 && (
          <TrainingExamplesSection
            examples={trainingExamples}
            emojiSet={displayState.emojiSet}
            displayMode={displayState.displayMode}
            title="Training Examples - Apply what you learn from them to solve the puzzle"
          />
        )}


        {/* Test Case Navigation - SILVER THEME (Hidden in Assessment Mode) */}
        {totalTests > 1 && !isAssessmentMode && (
          <div className="bg-gradient-to-r from-slate-200 via-gray-100 to-slate-200 border-2 border-slate-400 rounded-lg p-4 shadow-lg">
            <div className="mb-3">
              <h3 className="text-slate-800 text-lg font-bold flex items-center gap-2 mb-1">
                Multi-Test Puzzle - All {totalTests} Tests Required
              </h3>
              <p className="text-slate-700 text-base">
                You must solve ALL {totalTests} test cases to complete this puzzle. Switch between tests using the buttons below.
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

        {/* Assessment Mode Multi-Test Indicator */}
        {totalTests > 1 && isAssessmentMode && (
          <div className="bg-slate-800 border border-amber-400 rounded-lg p-4 mb-6">
            <div className="text-center">
              <h3 className="text-amber-400 text-lg font-bold mb-2">
                Multi-Test Puzzle
              </h3>
              <p className="text-slate-300 text-sm">
                This puzzle has {totalTests} test cases. Complete each test to proceed automatically.
              </p>
            </div>
          </div>
        )}

        {/* Solving Interface - Full Screen Width */}
        <div className="w-full">
          {/* Auto-advance notification for assessment mode */}
          {isAutoAdvancing && autoAdvanceMessage && (
            <div className="bg-green-900 border border-green-600 rounded-lg p-4 mb-4 animate-pulse">
              <div className="text-green-300 text-center font-semibold flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-300"></div>
                {autoAdvanceMessage}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-amber-400 font-bold text-5xl">
              Test Case {currentTestIndex + 1}
              {isAssessmentMode && totalTests > 1 && (
                <span className="text-slate-400 text-2xl font-normal ml-2">
                  of {totalTests}
                </span>
              )}
            </h2>
            <div className="text-slate-300 text-xl font-medium">
              {isValidating ? '🔄 Validating with PlayFab...' : 
               validationResult?.correct ? '🎉 PlayFab Verified!' :
               validationError ? '❌ PlayFab Validation Error' :
               'Apply the pattern to solve'}
            </div>
          </div>

          {/* Responsive layout: vertical on mobile, horizontal on larger screens */}
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            {/* Test Input - Full width on mobile, left column on large screens */}
            <div ref={inputContainerRef} className="flex-1 bg-slate-800 border border-slate-600 rounded p-4">
              <h3 className="text-amber-300 text-3xl font-bold mb-4 text-center">Test Input</h3>
              <ResponsiveOfficerDisplayGrid
                grid={testInput}
                containerType="solver"
                emojiSet={displayState.emojiSet}
                displayMode={displayState.displayMode}
                className="w-full h-full"
                fixedCellSize={inputCellSize}
              />
            </div>

            {/* Central Controls Wrapper - Full width on mobile, center column on large screens */}
            <div className="flex flex-col items-center justify-center px-2 space-y-4 lg:max-w-md lg:flex-shrink-0">
              
              {/* Grid Size Controls */}
              <PuzzleSolverControls
                currentDimensions={currentDimensions}
                onSizeChange={handleSizeChange}
                getSuggestedSizes={getSuggestedSizes}
              />

              {/* Display Controls, Actions, Palette, and Validation */}
              <PuzzleTools
                displayMode={displayState.displayMode}
                emojiSet={displayState.emojiSet}
                selectedValue={displayState.selectedValue}
                onDisplayModeChange={handleDisplayModeChange}
                onEmojiSetChange={handleEmojiSetChange}
                onValueSelect={handleValueSelect}
                onCopyInput={copyInput}
                onResetSolution={resetSolution}
                onReplayTutorial={handleReplayTutorial}
                onValidate={() => validatePuzzleWithPlayFab()}
                isValidating={isValidating}
                allTestsCompleted={isAssessmentMode ? false : completedTests.every(test => test)}
                usedValues={getUsedValues()}
                isAssessmentMode={isAssessmentMode}
              />
            </div>

            {/* User Solution - Full width on mobile, right column on large screens */}
            <div ref={outputContainerRef} className="flex-1 bg-slate-800 border border-slate-600 rounded p-4">
              <h3 className="text-amber-300 text-3xl font-bold mb-4 text-center">Your Solution</h3>
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
            </div>
          </div>

          {/* Validation Status */}
          {validationError && (
            <div className="bg-red-900 border border-red-600 rounded-lg p-4 mt-4">
              <div className="text-red-300 text-base">
                <strong>❌ Validation Error:</strong> {validationError}
              </div>
            </div>
          )}

          {validationResult && (
            <div className="bg-green-900 border border-green-600 rounded-lg p-4 mt-4">
              <div className="text-green-300 text-base">
                <strong>✅ PlayFab Validation Complete:</strong> 
                {getValidationMessage()}
                {validationResult.timeElapsed && (
                  <div>Time: {(validationResult.timeElapsed / 1000).toFixed(1)}s</div>
                )}
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Excellent Work!"
        message="Puzzle solved successfully! Moving to the next challenge..."
        autoCloseDelay={2500}
        showDesignerNotes={true}
      />
    </div>
  );
}