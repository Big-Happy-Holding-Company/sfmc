/**
 * Tutorial Puzzle Wrapper
 * =======================
 * Wraps ResponsivePuzzleSolver with tutorial-specific enhancements
 * Adds tutorial context, progress tracking, and guided interactions
 */

import { useState, useEffect } from 'react';
import { ResponsivePuzzleSolver } from './ResponsivePuzzleSolver';
import { PermanentHintSystem } from './PermanentHintSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTutorialProgress } from '@/hooks/useTutorialProgress';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';

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
    progress,
    isLastStep,
    completeCurrentStep,
    nextStep,
    endTutorial
  } = useTutorialProgress();

  const [showStepGuidance, setShowStepGuidance] = useState(true);
  const [puzzleStartTime] = useState(Date.now());
  const [stepCompleted, setStepCompleted] = useState(false);

  // Check if this is the correct puzzle for the current tutorial step
  const isCorrectPuzzle = currentStep?.puzzleId === puzzle.id;

  useEffect(() => {
    // Auto-hide step guidance after 10 seconds if user hasn't interacted
    const timer = setTimeout(() => {
      setShowStepGuidance(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleStepComplete = () => {
    if (!stepCompleted) {
      completeCurrentStep();
      setStepCompleted(true);
      
      // Log completion time for analytics
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
      onBack(); // Return to tutorial modal to see next step
    }
  };

  const handleExitTutorial = () => {
    endTutorial();
    onBack();
  };

  if (!currentStep) {
    return <div className="min-h-screen bg-slate-900 text-amber-50 flex items-center justify-center">
      Tutorial step not found.
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50">
      
      {/* Tutorial Context Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 border-b-2 border-cyan-400 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/Cadet-Yvonne.PNG" 
                alt="Cadet Yvonne" 
                className="w-12 h-12 rounded-full border-2 border-cyan-400 object-cover" 
              />
              <div>
                <h1 className="text-xl font-bold text-cyan-400">
                  🎖️ Tutorial Mode - Step {currentStep.stepNumber} of 5
                </h1>
                <p className="text-amber-300 text-sm">{currentStep.title}</p>
              </div>
              <Badge className={`${stepCompleted ? 'bg-green-600' : 'bg-amber-600'} text-white`}>
                {stepCompleted ? '✅ Completed' : '⏳ In Progress'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowStepGuidance(!showStepGuidance)}
                className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900"
              >
                {showStepGuidance ? '📖 Hide Guide' : '📖 Show Guide'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExitTutorial}
                className="border-red-400 text-red-400 hover:bg-red-400 hover:text-slate-900"
              >
                Exit Tutorial
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Guidance Panel - Collapsible */}
      {showStepGuidance && (
        <div className="bg-slate-800 border-b border-slate-600 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Card className="bg-gradient-to-r from-blue-950 to-purple-950 border-cyan-400">
              <CardHeader className="pb-3">
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  💡 Step {currentStep.stepNumber} Guidance
                  <Badge className="ml-2 bg-blue-600 text-white text-xs">
                    {isCorrectPuzzle ? 'Correct Puzzle' : 'Different Puzzle'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Current Step Objectives */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-amber-400 font-semibold mb-2">🎯 What to Practice:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-200">
                      {currentStep.learningObjectives.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-semibold mb-2">✅ Success Criteria:</h4>
                    <p className="text-sm text-slate-200">{currentStep.successCriteria}</p>
                  </div>
                </div>

                {/* Quick Instructions */}
                <div className="bg-slate-900 rounded p-3 mb-4">
                  <h4 className="text-amber-400 font-semibold mb-2">📋 Quick Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-200">
                    {currentStep.instructions.slice(0, 2).map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>

                {/* Step Completion Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-slate-400 text-sm">
                    💭 Practice the concepts above, then mark this step as complete.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStepComplete}
                      disabled={stepCompleted}
                      className={`${
                        stepCompleted 
                          ? 'bg-green-600 text-white' 
                          : 'bg-amber-400 hover:bg-amber-500 text-slate-900'
                      } font-semibold`}
                    >
                      {stepCompleted ? '✅ Step Complete' : '✅ Mark Complete'}
                    </Button>
                    
                    {stepCompleted && (
                      <Button
                        onClick={handleNextStep}
                        className="bg-cyan-400 hover:bg-blue-500 text-slate-900 font-semibold"
                      >
                        {isLastStep ? '🎉 Finish Tutorial' : 'Next Step →'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Enhanced Permanent Hint System - Tutorial Mode */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <PermanentHintSystem 
          puzzle={puzzle}
          tutorialMode={true}
          className="mb-4"
        />
      </div>

      {/* DESIGNER INPUT: Tutorial-Specific Enhancements */}
      {!isCorrectPuzzle && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <Card className="bg-yellow-900 border-yellow-600">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-400 text-xl">⚠️</div>
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-1">Different Puzzle Detected</h4>
                  <p className="text-yellow-100 text-sm">
                    <strong>DESIGNER INPUT:</strong> This puzzle ({puzzle.id}) doesn't match the tutorial step puzzle ({currentStep.puzzleId}).
                    You can still practice here, but return to the tutorial to continue with the intended training sequence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Puzzle Solver - Enhanced for Tutorial */}
      <ResponsivePuzzleSolver 
        puzzle={puzzle}
        onBack={onBack}
        tutorialMode={true}
      />

      {/* Tutorial Progress Indicators - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-cyan-400 p-2 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-cyan-400 text-sm font-medium">
              Tutorial Progress:
            </div>
            <div className="flex space-x-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`w-8 h-2 rounded ${
                    i + 1 < currentStep.stepNumber
                      ? 'bg-green-500'
                      : i + 1 === currentStep.stepNumber
                      ? stepCompleted
                        ? 'bg-green-500'
                        : 'bg-amber-400'
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="text-slate-300 text-sm">
            Step {currentStep.stepNumber} of 5 • 
            <span className="text-amber-400 font-medium ml-1">
              {currentStep.title}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom spacing to account for fixed footer */}
      <div className="h-16" />
    </div>
  );
}