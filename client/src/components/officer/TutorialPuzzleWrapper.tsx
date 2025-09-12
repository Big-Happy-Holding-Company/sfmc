/**
 * Tutorial Puzzle Wrapper
 * =======================
 * Wraps ResponsivePuzzleSolver with tutorial-specific enhancements.
 * This component acts as a container, orchestrating various tutorial UI elements.
 */

import { useState, useEffect } from 'react';
import { useTutorialProgress } from '@/hooks/useTutorialProgress';
import { TUTORIAL_STEPS } from '@/config/tutorialSteps';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';

import { ResponsivePuzzleSolver } from './ResponsivePuzzleSolver';
import { PermanentHintSystem } from './PermanentHintSystem';
import { TutorialHeader } from './TutorialHeader';
import { StepGuidancePanel } from './StepGuidancePanel';
import { IncorrectPuzzleWarning } from './IncorrectPuzzleWarning';
import { TutorialProgressBar } from './TutorialProgressBar';

interface TutorialPuzzleWrapperProps {
  puzzle: OfficerTrackPuzzle;
  onBack: () => void;
  onTutorialComplete?: () => void;
}

export function TutorialPuzzleWrapper({ 
  puzzle, 
  onBack, 
  onTutorialComplete 
}: TutorialPuzzleWrapperProps) {
  const {
    currentStep,
    isLastStep,
    completeCurrentStep,
    nextStep,
    endTutorial
  } = useTutorialProgress();

  const [showStepGuidance, setShowStepGuidance] = useState(true);
  const [puzzleStartTime] = useState(Date.now());
  const [stepCompleted, setStepCompleted] = useState(false);

  const isCorrectPuzzle = currentStep?.puzzleId === puzzle.id;
  const totalSteps = TUTORIAL_STEPS.length;

  useEffect(() => {
    const timer = setTimeout(() => setShowStepGuidance(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleStepComplete = () => {
    if (!stepCompleted) {
      completeCurrentStep();
      setStepCompleted(true);
      const completionTime = Date.now() - puzzleStartTime;
      console.log(`Tutorial Step ${currentStep?.stepNumber} completed in ${completionTime}ms`);
    }
  };

  const handleNextStep = () => {
    if (isLastStep) {
      endTutorial();
      onTutorialComplete?.();
    } else {
      nextStep();
      onBack();
    }
  };

  const handleExitTutorial = () => {
    endTutorial();
    onBack();
  };

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-slate-900 text-amber-50 flex items-center justify-center">
        Tutorial step not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50">
      <TutorialHeader
        currentStep={currentStep}
        stepCompleted={stepCompleted}
        totalSteps={totalSteps}
        showStepGuidance={showStepGuidance}
        onToggleGuidance={() => setShowStepGuidance(!showStepGuidance)}
        onExitTutorial={handleExitTutorial}
      />

      {showStepGuidance && (
        <StepGuidancePanel
          currentStep={currentStep}
          isCorrectPuzzle={isCorrectPuzzle}
          stepCompleted={stepCompleted}
          isLastStep={isLastStep}
          onStepComplete={handleStepComplete}
          onNextStep={handleNextStep}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <PermanentHintSystem 
          puzzle={puzzle}
          tutorialMode={true}
          className="mb-4"
        />
      </div>

      {!isCorrectPuzzle && (
        <IncorrectPuzzleWarning 
          puzzleId={puzzle.id} 
          expectedPuzzleId={currentStep.puzzleId} 
        />
      )}

      <ResponsivePuzzleSolver 
        puzzle={puzzle}
        onBack={onBack}
        tutorialMode={true}
      />

      <TutorialProgressBar
        currentStep={currentStep}
        stepCompleted={stepCompleted}
        totalSteps={totalSteps}
      />

      <div className="h-16" />
    </div>
  );
}