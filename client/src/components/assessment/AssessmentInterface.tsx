/**
 * HARC Platform - Assessment Interface
 * ===================================
 * A clean interface for presenting curated ARC puzzles to participants.
 * Uses existing puzzle services that already work in the project.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';
import { ResponsivePuzzleSolver } from '@/components/officer/ResponsivePuzzleSolver';
import { Navbar } from '@/components/layout/Navbar';
import { PermanentHintSystem } from '@/components/officer/PermanentHintSystem';
import { AssessmentModal } from '@/components/assessment/AssessmentModal';
import { puzzleRepository } from '@/services/core/puzzleRepository';
import { playFabRequestManager, playFabAuthManager, playFabUserData } from '@/services/playfab';

// Curated assessment puzzle IDs
const ASSESSMENT_PUZZLE_IDS = [
  
  'e7dd8335',    //  Easy answer, fill the bottom half of the symmetrical shape
  'fc754716',    //  Make the outline whatever the dot is
  'a699fb00',    //  Connect the dots
  'ea786f4a',    //  Make an X
  'e7639916',    //  Connect the dots! Large!
  '66e6c45b',    //  Expand!
  '0bb8deee',    //  Corral the shapes
  '32e9702f',    //  Easy answer, everything pulled to the left and change 0 to 5 
  '27a28665',    // 7 Examples, 3 Tests!
 //   '7b80bb43', //  Close the gates!  Very Large and unusual size
 //   '1caeab9d', //  Line them up!
 //   '87ab05b8', //

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
  const isAdvancing = useRef(false);

  console.log(`[Render] AssessmentInterface - Puzzle Index: ${currentPuzzleIndex}`);

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
          const puzzleData = await puzzleRepository.findById(puzzleId, true, true);

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
      console.log('🎉 Assessment completed!');
    }
  };

  const handleNextPuzzle = async () => {
    // Check for completion first
    await checkForCompletion();
    
    if (currentPuzzleIndex < puzzles.length - 1) {
      const nextPuzzleIndex = currentPuzzleIndex + 1;
      setCurrentPuzzleIndex(nextPuzzleIndex);
      resetHintsForNewPuzzle();
      setAttemptCounts(prev => {
        const newCounts = new Map(prev);
        newCounts.delete(puzzles[nextPuzzleIndex].id);
        return newCounts;
      });
    }
  };

  const handlePreviousPuzzle = () => {
    if (currentPuzzleIndex > 0) {
      const prevPuzzleIndex = currentPuzzleIndex - 1;
      setCurrentPuzzleIndex(prevPuzzleIndex);
      resetHintsForNewPuzzle();
      setAttemptCounts(prev => {
        const newCounts = new Map(prev);
        newCounts.delete(puzzles[prevPuzzleIndex].id);
        return newCounts;
      });
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
  const handleAssessmentValidation = useCallback(async (puzzleId: string, validationResult: any) => {
    console.log(`🔍 handleAssessmentValidation called for puzzle ${puzzleId}`);
    console.log(`🔍 Validation result:`, validationResult);
    
    const currentAttempts = attemptCounts.get(puzzleId) || 0;
    const newAttempts = currentAttempts + 1;
    
    console.log(`🔍 Current attempts: ${currentAttempts}, New attempts: ${newAttempts}`);
    
    // Update attempt count
    const newAttemptCounts = new Map(attemptCounts);
    newAttemptCounts.set(puzzleId, newAttempts);
    setAttemptCounts(newAttemptCounts);
    
    setIsAwaitingValidation(false);
    
    console.log(`📝 Assessment validation for ${puzzleId}: attempt ${newAttempts}, result:`, validationResult);
    
    // Assessment advancement logic:
    // - First attempt success: advancement controlled by success modal "OK" button
    // - First attempt fail: stay on puzzle for second attempt
    // - Second attempt (any result): auto-advance after delay
    const shouldAutoAdvance = (newAttempts >= 2);

    console.log(`🔍 Should auto-advance? ${shouldAutoAdvance} (attempts: ${newAttempts}, correct: ${validationResult?.correct})`);

    if (shouldAutoAdvance && !isAdvancing.current) {
      isAdvancing.current = true;
      console.log(`✅ Auto-advancing after attempt ${newAttempts} for puzzle ${puzzleId}`);
      setTimeout(() => {
        console.log(`🚀 Calling handleNextPuzzle() now...`);
        handleNextPuzzle();
        isAdvancing.current = false; // Reset after advancing
      }, 2000); // Brief delay to show result
    } else if (newAttempts === 1 && validationResult?.correct) {
      console.log(`🎉 First attempt success! Advancement will be controlled by success modal.`);
    } else {
      console.log(`🔄 Staying on puzzle ${puzzleId} after first failed attempt`);
    }
  }, [attemptCounts, currentPuzzleIndex, puzzles.length]);

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
          <p className="text-slate-300 mb-8">
            Congratulations! You've completed all assessment puzzles. 
            Your performance data has been recorded. See how you stack up against the leading AI models.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/assessment/comparison">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700">View Performance vs. AI</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">Go to Dashboard</Button>
            </Link>
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

      <Navbar title="Human - ARC Assessment">
        <div className="flex items-center gap-8">
          <p className="text-slate-300 text-base">
            Puzzle {currentPuzzleIndex + 1} of {puzzles.length}
            {currentPuzzle && attemptCounts.get(currentPuzzle.id) && (
              <span className="ml-2 text-amber-300">
                (Attempt {attemptCounts.get(currentPuzzle.id)} of 2)
              </span>
            )}
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => setShowModal(true)} 
              variant="outline" 
              size="lg"
              className="border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-slate-900"
            >
              About Assessment
            </Button>
            <Button onClick={handleBackToLanding} variant="outline" size="lg" className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900">
              Exit Assessment
            </Button>
          </div>
        </div>
      </Navbar>

      {/* The ResponsivePuzzleSolver */}
      <ResponsivePuzzleSolver
        puzzle={currentPuzzle}
        onBack={handleBackToLanding}
        isAssessmentMode={true}
        onSolve={handleAssessmentSolve}
        onValidationResult={(result) => handleAssessmentValidation(currentPuzzle.id, result)}
        onAssessmentAdvance={handleNextPuzzle}
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
            size="lg"
          >
            ← Previous
          </Button>
          
          <div className="text-slate-300 text-lg">
            {currentPuzzleIndex + 1} / {puzzles.length}
          </div>
          
          <Button 
            onClick={handleNextPuzzle} 
            className="bg-amber-600 hover:bg-amber-700"
            size="lg"
          >
            {currentPuzzleIndex === puzzles.length - 1 ? 'Finish Assessment' : 'Next →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
