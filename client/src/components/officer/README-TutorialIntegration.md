# Officer Academy Tutorial System - Integration Guide

## Overview

The Officer Academy tutorial system provides a comprehensive 5-step onboarding experience for the ARC-AGI puzzle interface. The system is built using a **wrapper pattern** that enhances the existing `ResponsivePuzzleSolver` without modifying its core functionality.

## Quick Integration Example

Here's how to integrate the tutorial system into your Officer Track interface:

```tsx
import { useState } from 'react';
import { OfficerTutorialModal } from '@/components/officer/OfficerTutorialModal';
import { TutorialPuzzleWrapper } from '@/components/officer/TutorialPuzzleWrapper';
import { useTutorialCompletion } from '@/hooks/useTutorialProgress';

export function YourOfficerTrackComponent() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialPuzzleId, setTutorialPuzzleId] = useState<string | null>(null);
  const { shouldShowTutorial } = useTutorialCompletion();

  // Show tutorial modal if user hasn't completed it
  useEffect(() => {
    if (shouldShowTutorial) {
      setShowTutorial(true);
    }
  }, [shouldShowTutorial]);

  const handleStartTutorial = (puzzleId: string) => {
    setTutorialPuzzleId(puzzleId);
    setShowTutorial(false);
    // Navigate to tutorial puzzle or load it
  };

  const handleTutorialComplete = () => {
    setTutorialPuzzleId(null);
    // Return to main Officer Track interface
  };

  return (
    <div>
      {/* Tutorial Modal */}
      <OfficerTutorialModal
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        onStartTutorial={handleStartTutorial}
      />

      {/* Tutorial Puzzle View */}
      {tutorialPuzzleId ? (
        <TutorialPuzzleWrapper
          puzzle={yourPuzzleData}
          onBack={() => setTutorialPuzzleId(null)}
          onTutorialComplete={handleTutorialComplete}
        />
      ) : (
        // Your regular Officer Track interface
        <YourRegularInterface />
      )}
    </div>
  );
}
```

## Content Configuration

### Step 1: Configure Puzzle IDs

Edit `client/src/config/tutorialSteps.ts` and replace the `DESIGNER_INPUT_PUZZLE_ID_*` placeholders with actual puzzle IDs:

```typescript
// Replace these with actual puzzle IDs
puzzleId: "1ae2feb7", // Instead of "DESIGNER_INPUT_PUZZLE_ID_1"
```

### Step 2: Customize Tutorial Content

Each tutorial step has marked sections for customization:

```typescript
// DESIGNER INPUT: Customize Cadet Yvonne's introduction
instructorDialogue: `
  Welcome to Officer Academy, Cadet! I'm Yvonne, and I'll be your
  instructor today. In this first step, we'll learn the basics of
  grid interaction and value selection...
`,

// DESIGNER INPUT: Step-by-step instructions
instructions: [
  "Click on any cell in the solution grid to select it",
  "Use the palette below to choose a value (0-9)",
  "Paint cells by clicking or dragging across them",
  "Study the training examples to understand the pattern"
],
```

### Step 3: Set Learning Objectives

Define what each step teaches:

```typescript
learningObjectives: [
  "Master basic grid interaction and cell selection",
  "Understand the value palette system", 
  "Learn to paint cells efficiently with drag gestures"
]
```

## Component Architecture

### Core Components

1. **OfficerTutorialModal** - The main tutorial interface
   - 5-step progression with navigation
   - Cadet Yvonne as instructor
   - Step-by-step guidance and objectives

2. **TutorialPuzzleWrapper** - Enhances puzzle solving with tutorial context
   - Wraps `ResponsivePuzzleSolver` with tutorial-specific UI
   - Progress tracking and step completion
   - Tutorial-specific guidance overlays

3. **PermanentHintSystem** - Always-available hints during puzzle solving
   - Character rotation (Yvonne, Wyatt, Divyapriya, Kim, Luz)
   - Output grid size hints from puzzle data
   - Specialty-based hint targeting

### State Management

The `useTutorialProgress` hook manages:
- Current step progression
- Completion tracking
- LocalStorage persistence
- Navigation between steps

```typescript
const {
  currentStep,           // Current tutorial step data
  progress,             // Overall progress state
  isFirstStep,          // Navigation helpers
  isLastStep,
  nextStep,             // Navigation functions
  previousStep,
  completeCurrentStep   // Progress management
} = useTutorialProgress();
```

## Integration Points

### 1. Officer Track Main Page
Add tutorial trigger button and modal:

```tsx
// Add to your main Officer Track page
<Button onClick={() => setShowTutorial(true)}>
  🎖️ Start Officer Training
</Button>
```

### 2. Enhanced Puzzle Solver
The `ResponsivePuzzleSolver` now accepts a `tutorialMode` prop:

```tsx
<ResponsivePuzzleSolver
  puzzle={puzzleData}
  onBack={handleBack}
  tutorialMode={true}  // Enables tutorial enhancements
/>
```

### 3. Character-Based Hints
The `PermanentHintSystem` integrates automatically and provides:
- Output size hints from puzzle data
- Rotating character specialists
- Tutorial-specific guidance when in tutorial mode

## Customization Areas

### Characters and Specialties

Modify character specialties in `PermanentHintSystem.tsx`:

```typescript
const HINT_CHARACTERS = [
  {
    name: "Yvonne",
    specialty: "Pattern Recognition",
    hintTypes: ["pattern", "basic", "tutorial"]
  },
  // Add more characters as needed
];
```

### Tutorial Completion Rewards

Customize completion messaging in `tutorialSteps.ts`:

```typescript
export const TUTORIAL_COMPLETION = {
  title: "🎉 Officer Training Complete!",
  message: "Congratulations! You've mastered the essential skills...",
  achievements: [
    "Grid Interaction Master",
    "Pattern Recognition Expert",
    "Multi-Test Strategist"
  ]
};
```

## Advanced Features

### Progress Persistence
Tutorial progress is automatically saved to localStorage and restored on page reload.

### Responsive Design
All tutorial components are fully responsive and match the Space Force Mission Control theme.

### Character Rotation
Hint system automatically rotates characters every 30 seconds, or users can manually change helpers.

### Multi-Test Support
Tutorial system handles both single and multi-test puzzles appropriately.

## Developer Notes

### Non-Intrusive Design
- Tutorial components enhance rather than replace existing functionality
- Core puzzle solver remains unchanged
- Easy to add/remove without affecting main application

### Component Reusability
- Tutorial modal pattern can be reused for other training flows
- Hint system can be used independently of tutorial
- Wrapper pattern allows gradual feature rollout

### Error Handling
- Graceful degradation when puzzle IDs are not configured
- Clear developer warnings for missing DESIGNER INPUT content
- Fallback states for incomplete tutorial data

## Testing Recommendations

1. **Content Validation**: Ensure all DESIGNER INPUT sections are populated
2. **Progress Flow**: Test step progression and completion tracking
3. **Character Rotation**: Verify hint system character cycling
4. **Responsive Design**: Test on various screen sizes
5. **LocalStorage**: Test tutorial progress persistence across browser sessions

This tutorial system provides a solid foundation for Officer Academy training while maintaining flexibility for future enhancements and content updates.