/**
 * Tutorial Header
 * ===============
 * Renders the main header for the tutorial mode, including the title,
 * step number, instructor avatar, and action buttons.
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TutorialStep } from '@/config/tutorialSteps';

interface TutorialHeaderProps {
  currentStep: TutorialStep;
  stepCompleted: boolean;
  totalSteps: number;
  showStepGuidance: boolean;
  onToggleGuidance: () => void;
  onExitTutorial: () => void;
}

export function TutorialHeader({
  currentStep,
  stepCompleted,
  totalSteps,
  showStepGuidance,
  onToggleGuidance,
  onExitTutorial,
}: TutorialHeaderProps) {
  return (
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
                🎖️ Tutorial Mode - Step {currentStep.stepNumber} of {totalSteps}
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
              onClick={onToggleGuidance}
              className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900"
            >
              {showStepGuidance ? '📖 Hide Guide' : '📖 Show Guide'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onExitTutorial}
              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-slate-900"
            >
              Exit Tutorial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
