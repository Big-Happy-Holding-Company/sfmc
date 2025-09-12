/**
 * HARC Platform - Assessment Interface
 * ===================================
 * A clean interface for presenting curated ARC puzzles to participants.
 * Uses existing puzzle services that already work in the project.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';
import { ResponsivePuzzleSolver } from '@/components/officer/ResponsivePuzzleSolver';
import { PermanentHintSystem } from '@/components/officer/PermanentHintSystem';
import { AssessmentModal } from '@/components/assessment/AssessmentModal';
import { puzzlePerformanceService } from '@/services/puzzlePerformanceService';
import { playFabRequestManager, playFabAuthManager, playFabUserData } from '@/services/playfab';

// Curated assessment puzzle IDs
const ASSESSMENT_PUZZLE_IDS = [
  
  'e7dd8335',    //  Easy answer, fill the bottom half of the symmetrical shape
  'fc754716',    //  Make the outline whatever the dot is
  'a699fb00',    //  Connect the dots
  'ea786f4a',    //  Make an X
  'e7639916',    //  Connect the dots
  '66e6c45b',    //  Expand!
  '32e9702f',    //  Easy answer, everything pulled to the left and change 0 to 5 

  //  '27a28665',
 //   '7b80bb43',
 //   '87ab05b8',

];

export function AssessmentInterface() {
  const [, setLocation] = useLocation();
  const [puzzles, setPuzzles] = useState<OfficerTrackPuzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [completedPuzzles, setCompletedPuzzles] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(true);
  const [hintsUsedForCurrentPuzzle, setHintsUsedForCurrentPuzzle] = useState(0);
  // 2-attempt tracking system
  const [attemptCounts, setAttemptCounts] = useState<Map<string, number>>(new Map());
  const [isAwaitingValidation, setIsAwaitingValidation] = useState(false);

  // Initialize and load assessment puzzles
  useEffect(() => {
    const initializeAndLoadPuzzles = async () => {
      try {
        setIsLoading(true);
        console.log('🎯 Initializing assessment...');
        
        // Initialize PlayFab if needed (same as PuzzleSolver page)
        const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
        if (!titleId) {
          throw new Error('VITE_PLAYFAB_TITLE_ID environment variable not found');
        }
        if (!playFabRequestManager.isInitialized()) {
          await playFabRequestManager.initialize({ titleId, secretKey: import.meta.env.VITE_PLAYFAB_SECRET_KEY });
        }
        await playFabAuthManager.ensureAuthenticated();
        
        // Load assessment puzzles using existing service
        console.log('📚 Loading assessment puzzles:', ASSESSMENT_PUZZLE_IDS);
        const loadedPuzzles: OfficerTrackPuzzle[] = [];
        
        for (const puzzleId of ASSESSMENT_PUZZLE_IDS) {
          console.log(`Loading puzzle ${puzzleId}...`);
          const puzzleData = await puzzlePerformanceService.findPuzzleById(puzzleId);
          
          if (puzzleData) {
            loadedPuzzles.push(puzzleData);
          } else {
            console.warn(`Could not load puzzle ${puzzleId}`);
          }
        }
        
        if (loadedPuzzles.length === 0) {
          throw new Error('No assessment puzzles could be loaded.');
        }
        
        setPuzzles(loadedPuzzles);
        console.log(`✅ Loaded ${loadedPuzzles.length} assessment puzzles`);
        
        // Check for already completed puzzles
        const completed = await checkCompletedPuzzles();
        if (ASSESSMENT_PUZZLE_IDS.every(id => completed.has(id))) {
          setIsComplete(true);
          console.log('🎉 Assessment already completed!');
          setTimeout(() => setLocation('/dashboard'), 2000);
        }
        
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndLoadPuzzles();
  }, []);

  // Check which puzzles have already been completed
  const checkCompletedPuzzles = async (): Promise<Set<string>> => {
    try {
      const userData = await playFabUserData.getPlayerData();
      const humanPerformanceData = userData?.humanPerformanceData;
      
      if (humanPerformanceData) {
        const records: { puzzleId: string }[] = JSON.parse(humanPerformanceData);
        const completed = new Set<string>(records.map(r => r.puzzleId));
        setCompletedPuzzles(completed);
        return completed;
      }
    } catch (error) {
      console.error('Failed to check completed puzzles:', error);
    }
    return new Set<string>();
  };

  // Check for assessment completion after solving a puzzle
  const checkForCompletion = async () => {
    const completed = await checkCompletedPuzzles();
    
    const allComplete = ASSESSMENT_PUZZLE_IDS.every(id => completed.has(id));
    if (allComplete && !isComplete) {
      setIsComplete(true);
      console.log('🎉 Assessment completed! Navigating to dashboard...');
      setTimeout(() => setLocation('/dashboard'), 3000);
    }
  };

  const handleNextPuzzle = async () => {
    // Check for completion first
    await checkForCompletion();
    
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(prev => prev + 1);
      resetHintsForNewPuzzle();
    }
  };

  const handlePreviousPuzzle = () => {
    if (currentPuzzleIndex > 0) {
      setCurrentPuzzleIndex(prev => prev - 1);
      resetHintsForNewPuzzle();
    }
  };

  const handleBackToLanding = () => {
    setLocation('/');
  };

  // Handle hint usage for current puzzle
  const handleHintUsed = (hintLevel: number, totalHintsUsed: number) => {
    setHintsUsedForCurrentPuzzle(totalHintsUsed);
    console.log(`🔍 Hint level ${hintLevel} used. Total hints for this puzzle: ${totalHintsUsed}`);
  };

  // Reset hints when moving to next puzzle
  const resetHintsForNewPuzzle = () => {
    setHintsUsedForCurrentPuzzle(0);
  };

  // Handle PlayFab validation result for assessment flow
  const handleAssessmentValidation = async (puzzleId: string, validationResult: any) => {
    const currentAttempts = attemptCounts.get(puzzleId) || 0;
    const newAttempts = currentAttempts + 1;
    
    // Update attempt count
    const newAttemptCounts = new Map(attemptCounts);
    newAttemptCounts.set(puzzleId, newAttempts);
    setAttemptCounts(newAttemptCounts);
    
    setIsAwaitingValidation(false);
    
    console.log(`📝 Assessment validation for ${puzzleId}: attempt ${newAttempts}, result:`, validationResult);
    
    // Assessment advancement logic: 
    // - First attempt success: advance immediately
    // - Second attempt (any result): advance regardless  
    const shouldAdvance = (newAttempts === 1 && validationResult?.correct) || (newAttempts >= 2);
    
    if (shouldAdvance) {
      console.log(`✅ Auto-advancing after attempt ${newAttempts} for puzzle ${puzzleId}`);
      setTimeout(() => {
        handleNextPuzzle();
      }, 2000); // Brief delay to show result
    } else {
      console.log(`🔄 Staying on puzzle ${puzzleId} after first failed attempt`);
    }
  };

  // Custom onSolve handler that tracks validation instead of auto-advancing
  const handleAssessmentSolve = () => {
    // In assessment mode, onSolve is called after successful PlayFab validation
    // But we handle advancement in handleAssessmentValidation based on attempt count
    console.log('🎯 Assessment solve callback triggered - validation successful');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <div>Loading Assessment...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <div className="text-red-400 font-semibold mb-2">Assessment Loading Failed</div>
          <div className="text-slate-400 mb-4">{error}</div>
          <Button onClick={handleBackToLanding} className="bg-amber-600 hover:bg-amber-700">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Show completion screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-amber-400 mb-4">Assessment Complete!</h1>
          <p className="text-slate-300 mb-6">
            Congratulations! You've completed all assessment puzzles. 
            Your performance data has been recorded and you'll be redirected to view your results.
          </p>
          <div className="text-slate-400 text-sm">
            Redirecting to dashboard in 3 seconds...
          </div>
        </div>
      </div>
    );
  }

  const currentPuzzle = puzzles[currentPuzzleIndex];

  if (!currentPuzzle) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-amber-400 text-4xl mb-4">🧩</div>
          <div>No puzzle data available.</div>
          <Button onClick={handleBackToLanding} className="mt-4 bg-amber-600 hover:bg-amber-700">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Assessment Information Modal */}
      <AssessmentModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
      />

      {/* Header with progress */}
      <div className="bg-slate-800 border-b-2 border-amber-400 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-amber-400">ARC Assessment</h1>
            <p className="text-slate-300 text-sm">Puzzle {currentPuzzleIndex + 1} of {puzzles.length}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowModal(true)} 
              variant="outline" 
              size="sm"
            >
              About Assessment
            </Button>
            <Button onClick={handleBackToLanding} variant="outline" size="sm">
              Exit Assessment
            </Button>
          </div>
        </div>
      </div>

      {/* The ResponsivePuzzleSolver */}
      <ResponsivePuzzleSolver 
        puzzle={currentPuzzle} 
        onBack={handleBackToLanding}
        isAssessmentMode={true}
        onSolve={handleAssessmentSolve}
        onValidationResult={(result) => handleAssessmentValidation(currentPuzzle.id, result)}
      />

      {/* Hint System - positioned adjacent to puzzle grids */}
      <div className="max-w-4xl mx-auto px-4 pb-4">
        <PermanentHintSystem
          puzzle={currentPuzzle}
          onHintUsed={handleHintUsed}
          className="mx-auto max-w-2xl"
        />
      </div>

      {/* Navigation controls */}
      <div className="bg-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button 
            onClick={handlePreviousPuzzle} 
            disabled={currentPuzzleIndex === 0}
            variant="outline"
          >
            ← Previous
          </Button>
          
          <div className="text-slate-300">
            {currentPuzzleIndex + 1} / {puzzles.length}
          </div>
          
          <Button 
            onClick={handleNextPuzzle} 
            className="bg-amber-600 hover:bg-amber-700"
          >
            {currentPuzzleIndex === puzzles.length - 1 ? 'Finish Assessment' : 'Next →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
