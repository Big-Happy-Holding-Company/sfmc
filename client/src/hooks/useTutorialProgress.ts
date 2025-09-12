/**
 * Tutorial Progress Hook
 * ======================
 * Manages tutorial state, progression, and persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { TUTORIAL_STEPS, getTutorialStep, getNextTutorialStep, getPreviousTutorialStep } from '@/config/tutorialSteps';
import type { TutorialStep } from '@/config/tutorialSteps';

export interface TutorialProgress {
  currentStepId: string;
  completedSteps: string[];
  isActive: boolean;
  startedAt: number;
}

export interface UseTutorialProgressReturn {
  // Current state
  currentStep: TutorialStep | undefined;
  progress: TutorialProgress;
  isFirstStep: boolean;
  isLastStep: boolean;
  completionPercentage: number;
  
  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepId: string) => void;
  
  // Progress management
  completeCurrentStep: () => void;
  startTutorial: () => void;
  endTutorial: () => void;
  resetTutorial: () => void;
  
  // Persistence
  saveTutorialProgress: () => void;
  loadTutorialProgress: () => void;
}

const TUTORIAL_PROGRESS_KEY = 'officer-tutorial-progress';
const DEFAULT_PROGRESS: TutorialProgress = {
  currentStepId: TUTORIAL_STEPS[0]?.id || '',
  completedSteps: [],
  isActive: false,
  startedAt: 0
};

export function useTutorialProgress(): UseTutorialProgressReturn {
  const [progress, setProgress] = useState<TutorialProgress>(DEFAULT_PROGRESS);

  // Load progress from localStorage on mount
  useEffect(() => {
    loadTutorialProgress();
  }, []);

  const currentStep = getTutorialStep(progress.currentStepId);
  const isFirstStep = currentStep?.stepNumber === 1;
  const isLastStep = currentStep?.stepNumber === TUTORIAL_STEPS.length;
  const completionPercentage = (progress.completedSteps.length / TUTORIAL_STEPS.length) * 100;

  // Navigation functions
  const nextStep = useCallback(() => {
    const next = getNextTutorialStep(progress.currentStepId);
    if (next) {
      setProgress(prev => ({
        ...prev,
        currentStepId: next.id
      }));
    }
  }, [progress.currentStepId]);

  const previousStep = useCallback(() => {
    const previous = getPreviousTutorialStep(progress.currentStepId);
    if (previous) {
      setProgress(prev => ({
        ...prev,
        currentStepId: previous.id
      }));
    }
  }, [progress.currentStepId]);

  const goToStep = useCallback((stepId: string) => {
    const step = getTutorialStep(stepId);
    if (step) {
      setProgress(prev => ({
        ...prev,
        currentStepId: stepId
      }));
    }
  }, []);

  // Progress management
  const completeCurrentStep = useCallback(() => {
    if (!progress.currentStepId) return;
    
    setProgress(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(prev.currentStepId)
        ? prev.completedSteps
        : [...prev.completedSteps, prev.currentStepId]
    }));
  }, [progress.currentStepId]);

  const startTutorial = useCallback(() => {
    setProgress({
      currentStepId: TUTORIAL_STEPS[0]?.id || '',
      completedSteps: [],
      isActive: true,
      startedAt: Date.now()
    });
  }, []);

  const endTutorial = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  const resetTutorial = useCallback(() => {
    setProgress({
      ...DEFAULT_PROGRESS,
      currentStepId: TUTORIAL_STEPS[0]?.id || ''
    });
    localStorage.removeItem(TUTORIAL_PROGRESS_KEY);
  }, []);

  // Persistence functions
  const saveTutorialProgress = useCallback(() => {
    try {
      localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn('Failed to save tutorial progress:', error);
    }
  }, [progress]);

  const loadTutorialProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem(TUTORIAL_PROGRESS_KEY);
      if (saved) {
        const parsedProgress = JSON.parse(saved) as TutorialProgress;
        
        // Validate the loaded progress
        if (parsedProgress.currentStepId && getTutorialStep(parsedProgress.currentStepId)) {
          setProgress(parsedProgress);
        } else {
          // Invalid progress, reset to default
          setProgress(DEFAULT_PROGRESS);
        }
      }
    } catch (error) {
      console.warn('Failed to load tutorial progress:', error);
      setProgress(DEFAULT_PROGRESS);
    }
  }, []);

  // Auto-save progress when it changes
  useEffect(() => {
    if (progress.isActive && progress.currentStepId) {
      saveTutorialProgress();
    }
  }, [progress, saveTutorialProgress]);

  return {
    // Current state
    currentStep,
    progress,
    isFirstStep,
    isLastStep,
    completionPercentage,
    
    // Navigation
    nextStep,
    previousStep,
    goToStep,
    
    // Progress management
    completeCurrentStep,
    startTutorial,
    endTutorial,
    resetTutorial,
    
    // Persistence
    saveTutorialProgress,
    loadTutorialProgress
  };
}

// Helper hook for checking tutorial completion
export function useTutorialCompletion() {
  const { progress } = useTutorialProgress();
  
  const isCompleted = progress.completedSteps.length === TUTORIAL_STEPS.length;
  const shouldShowTutorial = !isCompleted && !progress.isActive;
  
  return {
    isCompleted,
    shouldShowTutorial,
    completedStepsCount: progress.completedSteps.length,
    totalSteps: TUTORIAL_STEPS.length
  };
}