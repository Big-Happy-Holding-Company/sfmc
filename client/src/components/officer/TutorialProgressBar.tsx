/**
 * Tutorial Progress Bar
 * =====================
 * A fixed footer that displays the user's progress through the tutorial steps.
 */

import type { TutorialStep } from '@/config/tutorialSteps';

interface TutorialProgressBarProps {
  currentStep: TutorialStep;
  stepCompleted: boolean;
  totalSteps: number;
}

export function TutorialProgressBar({
  currentStep,
  stepCompleted,
  totalSteps,
}: TutorialProgressBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-cyan-400 p-2 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-cyan-400 text-sm font-medium">
            Tutorial Progress:
          </div>
          <div className="flex space-x-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-2 rounded ${i + 1 < currentStep.stepNumber
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
          Step {currentStep.stepNumber} of {totalSteps} • 
          <span className="text-amber-400 font-medium ml-1">
            {currentStep.title}
          </span>
        </div>
      </div>
    </div>
  );
}
