# Mission Control 2045 - Templatization Implementation Plan COMPLETED! 
*Author: Cascade* Claude 3.7 Sonnet (Thinking)

> This implementation guide provides step-by-step instructions for developing the templatization system for SFMC puzzles. It focuses on implementing 5 core transformation types across all 7 categories, working alongside existing manual tasks.

**Last updated: 2025-06-21**

## Implementation Strategy Overview

We will build a templatization system that can generate 35 tasks (5 transformation types × 7 categories) while maintaining compatibility with existing manually created tasks. This plan follows a test-driven, incremental approach to ensure quality and validation at each step.

## Phase 1: Foundation Setup

### Step 1: Create Basic Project Structure (1-2 prompts)
```
server/
├── templates/
│   ├── categories.ts          # Category definitions
│   ├── transformations.ts     # 5 core transformation patterns
│   ├── generators/            # Grid generation classes  
│   └── validators.ts          # Validation logic
├── tools/
│   ├── task-factory.ts        # Main generation engine
│   └── test-runner.ts         # Testing utilities
```

### Step 2: Define Category Templates (1 prompt)
Create a `categories.ts` file with definitions for all 7 categories, following this structure:

```typescript
/**
 * CategoryTemplate defines task properties that are driven by category.
 * Maps 1:1 with Task properties in schema.ts
 */
interface CategoryTemplate {
  categoryCode: string;       // Two/three-letter code (e.g., "COM" or "OS" or "PL" or "PWR" or "SEC" or "NAV" or "FS") followed by -XXX start numbering of generated tasks at -100 (e.g., "COM-100")
  categoryName: string;       // Display name with emoji must conform to schema.ts
  emojiSet: string;          // Must exist as a set key in spaceEmojis.ts (e.g., "tech_set2")
  basePoints: number;        // Default point value
  requiredRankLevel: number; // Usually 1
}

// Source of truth for all category metadata
const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  COM: {
    categoryCode: "COM",
    categoryName: "📡 Communications",
    emojiSet: "tech_set2",
    basePoints: 400,
    requiredRankLevel: 1
  },
  OS: {
    categoryCode: "OS",
    categoryName: "🛡️ O₂ Sensor Check",
    emojiSet: "status_main",
    basePoints: 350,
    requiredRankLevel: 1
  },
  // Add remaining 5 categories...
};
```

### Step 3: Implement the Task Interface (1 prompt)
Create a `task.interface.ts` file matching the existing structure in `puzzle_tasks_plan_2025-06-17.md`:

```typescript
interface TaskDefinition {
  id: string;                    // Format: "COM-001"
  title: string;
  description: string;
  category: string;              // Full category name with emoji
  difficulty: "Basic" | "Intermediate" | "Advanced";
  gridSize: number;              // Usually 2-4
  timeLimit: null;               // Always null per requirements
  basePoints: number;
  requiredRankLevel: number;     // Always 1 per requirements
  emojiSet: string;              // Must exist as a set key in spaceEmojis.ts (e.g., "tech_set2") 
  examples: ExamplePair[];       // At least 2 examples
  testInput: number[][];         // Test case input grid
  testOutput: number[][];        // Expected output grid
  hints: string[];               // 3 hints as per guidelines
  // Optional metadata flag for generated vs manual
  generated?: boolean;           // true for template-generated tasks
}

interface ExamplePair {
  input: number[][];
  output: number[][];
}
```

## Phase 2: Core Transformations

### Step 4: Define the 5 Core Transformations (1-2 prompts)
Create a `transformations.ts` file implementing the 5 core transformations:

```typescript
interface TransformationTemplate {
  type: string;                // Unique ID for the transformation
  category: string;            // Transformation category
  titlePattern: string;        // Template for generating titles
  descriptionPattern: string;  // Template for descriptions
  gridGenerator: GridGeneratorFunction; // Function to generate grids
  hintPatterns: string[];      // Templates for standard hints
  difficulty: "Basic" | "Intermediate" | "Advanced";
}

// Implement the 5 core transformations
const TRANSFORMATION_TEMPLATES: TransformationTemplate[] = [
  // 1. Horizontal reflection (geometric)
  {
    type: "horizontal_reflection",
    category: "geometric",
    titlePattern: "{context} Reflection",
    descriptionPattern: "Analyze {domain} by reflecting the grid horizontally.",
    gridGenerator: generateHorizontalReflection,
    hintPatterns: [
      "Flip the grid left-to-right.",
      "First column becomes last column, middle stays centered.",
      "⬛ reflects like any other cell."
    ],
    difficulty: "Basic"
  },
  
  // 2. 90° rotation (geometric)
  // 3. Pattern completion (pattern)
  // 4. XOR operation (logical)
  // 5. Object counting (object manipulation)
];
```

### Step 5: Implement Grid Generators (2 prompts)
Create base classes for grid generation in `generators/`:

```typescript
interface GridGenerator {
  generateExamples(count: number, size: number): ExamplePair[];
  generateTestCase(size: number): TestCase;
  validateTransformation(input: number[][], output: number[][]): boolean;
}

// Implement concrete classes for each transformation type:
// 1. HorizontalReflectionGenerator
// 2. Rotation90Generator
// 3. PatternCompletionGenerator
// 4. XorOperationGenerator
// 5. ObjectCountingGenerator
```

## Phase 3: Task Factory

### Step 6: Create Task Factory (1-2 prompts)
Implement the core task generation in `task-factory.ts`:

```typescript
class TaskFactory {
  constructor(
    private categoryTemplates: Record<string, CategoryTemplate>,
    private transformationTemplates: TransformationTemplate[]
  ) {}

  generateTask(
    categoryCode: string, 
    transformationType: string, 
    options?: TaskOptions
  ): TaskDefinition {
    // Implementation details...
  }

  // Helper methods for title generation, description, etc.
  private generateTitle(
    category: CategoryTemplate, 
    transformation: TransformationTemplate
  ): string {
    // Implementation to generate creative titles based on patterns
  }

  // More helper methods...
}
```

### Step 7: Implement Validation System (1 prompt)
Create a robust validation framework in `validators.ts`:

```typescript
class TaskValidator {
  validateTask(task: TaskDefinition): ValidationResult {
    return {
      isValid: this.validateSchema(task) && this.validateLogic(task),
      errors: [...this.getSchemaErrors(task), ...this.getLogicErrors(task)]
    };
  }

  private validateSchema(task: TaskDefinition): boolean {
    // Check required fields and formats
  }

  private validateLogic(task: TaskDefinition): boolean {
    // Verify transformation logic is correct
  }
}
```

## Phase 4: Integration

### Step 8: Build CLI Tools (1 prompt)
Create command-line scripts for generating tasks:

```typescript
// generate-task.ts
const categoryCode = process.argv[2];
const transformationType = process.argv[3];

const taskFactory = new TaskFactory(CATEGORY_TEMPLATES, TRANSFORMATION_TEMPLATES);
const task = taskFactory.generateTask(categoryCode, transformationType);

// Validate and output
const validator = new TaskValidator();
const result = validator.validateTask(task);

if (result.isValid) {
  writeTaskToFile(task);
} else {
  console.error("Validation failed:", result.errors);
}
```

### Step 9: Implement npm Scripts (1 prompt)
Add these to `package.json`:

```json
"scripts": {
  "generate:task": "ts-node server/tools/generate-task.ts",
  "generate:core-set": "ts-node server/tools/generate-core-set.ts",
  "generate:all-core": "ts-node server/tools/generate-all-core.ts",
  "validate:tasks": "ts-node server/tools/validate-tasks.ts",
  "test:difficulty-curve": "ts-node server/tools/test-difficulty.ts"
}
```

## Phase 5: Testing and Quality Assurance

### Step 10: Create Test Suite (1 prompt)
Build automated tests for grid generation and transformation:

```typescript
// test-transformations.ts
describe('Transformation Tests', () => {
  // Test each transformation type
  describe('Horizontal Reflection', () => {
    const generator = new HorizontalReflectionGenerator();
    
    it('should correctly reflect a 2x2 grid', () => {
      const input = [[1, 2], [3, 4]];
      const expected = [[2, 1], [4, 3]];
      expect(generator.transform(input)).toEqual(expected);
    });
    
    // More tests...
  });
  
  // Tests for other transformations...
});
```

### Step 11: Implement Difficulty Analysis (1 prompt)
Build tools to measure and analyze difficulty levels:

```typescript
class DifficultyAnalyzer {
  analyzeTasks(tasks: TaskDefinition[]): DifficultyReport {
    // Implementation that measures:
    // - Grid complexity
    // - Number of steps required
    // - Transformation complexity
  }
}
```

## Phase 6: Content Generation

### Step 12: Generate Initial Tasks (1-2 prompts)
Generate sample tasks for each category/transformation pair:

```bash
# Example: Generate all 5 core transformations for the COM category
npm run generate:core-set COM

# Example: Generate all 35 tasks (5 transformations × 7 categories)  
npm run generate:all-core
```

## Implementation Guidelines

### Follow Existing Puzzle Guidelines
Refer to the `puzzle_tasks_plan_2025-06-17.md` document for:
- Core schema requirements (integers 0-9 only, properly formatted)
- Transformation playbook (simple, visually clear patterns)
- Hint writing guidelines (3 hints with specific formats)

### Maintain Compatibility
- Test generated tasks alongside manual tasks
- Flag generated tasks with `"generated": true` metadata
- Use the same schema and interface as existing tasks

### Code Organization
- Keep transformation logic separate from string templates
- Follow consistent naming conventions
- Add comprehensive comments explaining the generation logic

### Task Quality
- Generate tasks with clear, unambiguous rules
- Include multiple examples for each transformation
- Validate tasks programmatically before saving

## Success Criteria
- ✅ All 35 tasks (5 transformations × 7 categories) are generated successfully
- ✅ Generated tasks pass validation checks
- ✅ Generated tasks work alongside manual tasks
- ✅ Users can solve generated tasks with similar difficulty progression
- ✅ System is extensible for future transformation types

This implementation plan provides a clear, step-by-step roadmap for building a templatization system that focuses on quality and testing while delivering immediate value through 35 well-crafted tasks across all game categories.
