/**
 * Tutorial Steps Configuration
 * ============================
 * Configuration for the Officer Academy onboarding tutorial
 * Each step contains DESIGNER INPUT sections for easy customization
 */

export interface TutorialStep {
  id: string;
  stepNumber: number;
  title: string;
  puzzleId: string;
  instructorDialogue: string;
  instructions: string[];
  hints: string[];
  successCriteria: string;
  learningObjectives: string[];
}

// =============================================================================
// DESIGNER INPUT: TUTORIAL STEPS CONFIGURATION
// =============================================================================
// Modify the content below to customize each tutorial step
// Each step should focus on a specific skill or concept

export const TUTORIAL_STEPS: TutorialStep[] = [
  
  // STEP 1: BASIC GRID INTERACTION
  {
    id: "step-1-basic-interaction",
    stepNumber: 1,
    title: "DESIGNER INPUT: Step 1 Title",
    
    // DESIGNER INPUT: Choose a simple puzzle ID for basic grid interaction
    puzzleId: "DESIGNER_INPUT_PUZZLE_ID_1",
    
    // DESIGNER INPUT: Customize Cadet Yvonne's introduction
    instructorDialogue: `
      DESIGNER INPUT: Add Cadet Yvonne's welcoming dialogue here.
      This should introduce the cadet to the puzzle interface and explain
      what they'll be learning in this first step.
      
      Example: "Welcome to Officer Academy, Cadet! I'm Yvonne, and I'll be
      your instructor today. Let's start with the basics..."
    `,
    
    // DESIGNER INPUT: Step-by-step instructions for basic interaction
    instructions: [
      "DESIGNER INPUT: Instruction 1 - Basic grid understanding",
      "DESIGNER INPUT: Instruction 2 - How to select values",
      "DESIGNER INPUT: Instruction 3 - How to paint cells",
      "DESIGNER INPUT: Instruction 4 - Understanding the input/output relationship"
    ],
    
    // DESIGNER INPUT: Progressive hints for this step
    hints: [
      "DESIGNER INPUT: Hint 1 - Basic navigation tip",
      "DESIGNER INPUT: Hint 2 - Value selection guidance", 
      "DESIGNER INPUT: Hint 3 - Pattern recognition starter"
    ],
    
    // DESIGNER INPUT: What needs to be accomplished to complete this step
    successCriteria: "DESIGNER INPUT: Define success criteria for step 1",
    
    // DESIGNER INPUT: Learning objectives for this step
    learningObjectives: [
      "DESIGNER INPUT: Learning objective 1",
      "DESIGNER INPUT: Learning objective 2", 
      "DESIGNER INPUT: Learning objective 3"
    ]
  },

  // STEP 2: PATTERN RECOGNITION
  {
    id: "step-2-pattern-recognition",
    stepNumber: 2,
    title: "DESIGNER INPUT: Step 2 Title",
    
    // DESIGNER INPUT: Choose a puzzle that demonstrates clear patterns
    puzzleId: "DESIGNER_INPUT_PUZZLE_ID_2",
    
    // DESIGNER INPUT: Cadet Yvonne explains pattern recognition
    instructorDialogue: `
      DESIGNER INPUT: Add dialogue about pattern recognition here.
      This should build on step 1 and introduce the concept of
      identifying patterns in the training examples.
    `,
    
    // DESIGNER INPUT: Instructions for pattern recognition
    instructions: [
      "DESIGNER INPUT: How to study training examples",
      "DESIGNER INPUT: Identifying transformation patterns",
      "DESIGNER INPUT: Applying patterns to test cases",
      "DESIGNER INPUT: Verifying pattern consistency"
    ],
    
    // DESIGNER INPUT: Hints for pattern recognition
    hints: [
      "DESIGNER INPUT: Pattern identification hint",
      "DESIGNER INPUT: Training example analysis tip",
      "DESIGNER INPUT: Common pattern types guidance"
    ],
    
    successCriteria: "DESIGNER INPUT: Pattern recognition success criteria",
    
    learningObjectives: [
      "DESIGNER INPUT: Pattern recognition objective 1",
      "DESIGNER INPUT: Pattern recognition objective 2",
      "DESIGNER INPUT: Pattern recognition objective 3"
    ]
  },

  // STEP 3: GRID SIZING AND TOOLS
  {
    id: "step-3-grid-tools",
    stepNumber: 3,
    title: "DESIGNER INPUT: Step 3 Title",
    
    // DESIGNER INPUT: Choose a puzzle that requires different output size
    puzzleId: "DESIGNER_INPUT_PUZZLE_ID_3",
    
    // DESIGNER INPUT: Dialogue about grid tools and sizing
    instructorDialogue: `
      DESIGNER INPUT: Add dialogue about grid sizing and tools here.
      Explain when and why output grids might be different sizes,
      and introduce the various tools available.
    `,
    
    // DESIGNER INPUT: Instructions for using grid tools
    instructions: [
      "DESIGNER INPUT: How to change output grid size",
      "DESIGNER INPUT: Using suggested sizes from training examples", 
      "DESIGNER INPUT: Copy input and reset tools",
      "DESIGNER INPUT: Display mode and emoji set options"
    ],
    
    // DESIGNER INPUT: Tool usage hints
    hints: [
      "DESIGNER INPUT: Grid sizing strategy hint",
      "DESIGNER INPUT: Tool selection guidance",
      "DESIGNER INPUT: When to use copy vs manual creation"
    ],
    
    successCriteria: "DESIGNER INPUT: Grid tools mastery criteria",
    
    learningObjectives: [
      "DESIGNER INPUT: Grid tools objective 1",
      "DESIGNER INPUT: Grid tools objective 2",
      "DESIGNER INPUT: Grid tools objective 3"
    ]
  },

  // STEP 4: MULTI-TEST PUZZLES
  {
    id: "step-4-multi-test",
    stepNumber: 4,
    title: "DESIGNER INPUT: Step 4 Title",
    
    // DESIGNER INPUT: Choose a puzzle with multiple test cases
    puzzleId: "DESIGNER_INPUT_PUZZLE_ID_4",
    
    // DESIGNER INPUT: Dialogue about multi-test puzzles
    instructorDialogue: `
      DESIGNER INPUT: Add dialogue about multi-test puzzles here.
      Explain why some puzzles have multiple test cases and how
      to approach solving them systematically.
    `,
    
    // DESIGNER INPUT: Multi-test puzzle instructions
    instructions: [
      "DESIGNER INPUT: Understanding multi-test requirements",
      "DESIGNER INPUT: Navigating between test cases",
      "DESIGNER INPUT: Ensuring pattern consistency across tests",
      "DESIGNER INPUT: Completing all test cases before validation"
    ],
    
    // DESIGNER INPUT: Multi-test puzzle hints
    hints: [
      "DESIGNER INPUT: Test case navigation hint",
      "DESIGNER INPUT: Pattern consistency check",
      "DESIGNER INPUT: Systematic approach guidance"
    ],
    
    successCriteria: "DESIGNER INPUT: Multi-test completion criteria",
    
    learningObjectives: [
      "DESIGNER INPUT: Multi-test objective 1",
      "DESIGNER INPUT: Multi-test objective 2",
      "DESIGNER INPUT: Multi-test objective 3"
    ]
  },

  // STEP 5: ADVANCED VALIDATION
  {
    id: "step-5-validation",
    stepNumber: 5,
    title: "DESIGNER INPUT: Step 5 Title",
    
    // DESIGNER INPUT: Choose a challenging puzzle for final validation
    puzzleId: "DESIGNER_INPUT_PUZZLE_ID_5",
    
    // DESIGNER INPUT: Final step dialogue from Cadet Yvonne
    instructorDialogue: `
      DESIGNER INPUT: Add culminating dialogue here.
      This should tie together all previous learning and prepare
      the cadet for independent puzzle solving.
    `,
    
    // DESIGNER INPUT: Advanced validation instructions
    instructions: [
      "DESIGNER INPUT: Understanding frontend vs PlayFab validation",
      "DESIGNER INPUT: When to submit for official validation",
      "DESIGNER INPUT: Interpreting validation results",
      "DESIGNER INPUT: Strategies for complex puzzles"
    ],
    
    // DESIGNER INPUT: Advanced puzzle hints
    hints: [
      "DESIGNER INPUT: Validation strategy hint",
      "DESIGNER INPUT: Complex pattern approach",
      "DESIGNER INPUT: Final problem-solving guidance"
    ],
    
    successCriteria: "DESIGNER INPUT: Tutorial completion criteria",
    
    learningObjectives: [
      "DESIGNER INPUT: Final validation objective 1", 
      "DESIGNER INPUT: Final validation objective 2",
      "DESIGNER INPUT: Final validation objective 3"
    ]
  }
];

// =============================================================================
// DESIGNER INPUT: TUTORIAL COMPLETION REWARDS
// =============================================================================
// Customize what happens when the tutorial is completed

export const TUTORIAL_COMPLETION = {
  title: "DESIGNER INPUT: Completion Title",
  message: "DESIGNER INPUT: Add completion message from Cadet Yvonne",
  achievements: [
    "DESIGNER INPUT: Achievement 1",
    "DESIGNER INPUT: Achievement 2", 
    "DESIGNER INPUT: Achievement 3"
  ],
  nextSteps: "DESIGNER INPUT: Guidance for what to do after tutorial"
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const getTutorialStep = (stepId: string): TutorialStep | undefined => {
  return TUTORIAL_STEPS.find(step => step.id === stepId);
};

export const getTutorialStepByNumber = (stepNumber: number): TutorialStep | undefined => {
  return TUTORIAL_STEPS.find(step => step.stepNumber === stepNumber);
};

export const getTotalTutorialSteps = (): number => {
  return TUTORIAL_STEPS.length;
};

export const getNextTutorialStep = (currentStepId: string): TutorialStep | undefined => {
  const currentStep = getTutorialStep(currentStepId);
  if (!currentStep) return undefined;
  
  return getTutorialStepByNumber(currentStep.stepNumber + 1);
};

export const getPreviousTutorialStep = (currentStepId: string): TutorialStep | undefined => {
  const currentStep = getTutorialStep(currentStepId);
  if (!currentStep) return undefined;
  
  return getTutorialStepByNumber(currentStep.stepNumber - 1);
};