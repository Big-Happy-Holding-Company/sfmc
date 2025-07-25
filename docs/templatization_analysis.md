# Mission Control 2045 - Templatization Strategy

## Current State Analysis

### Existing Structure
- **Task Files**: Individual JSON files in `server/data/tasks/`
- **Categories**: 7 categories (OS, PL, FS, NAV, COM, PWR, SEC)
- **Transformation Types**: 40+ ARC-AGI transformation patterns
- **Emoji Sets**: 8 predefined sets with 10 emojis each

### Pain Points Identified
1. **Manual Task Creation**: Each task requires hand-crafting JSON
2. **Consistency Challenges**: Different developers may format differently
3. **Validation Gaps**: No automatic validation of task structure
4. **Scaling Issues**: 280+ potential tasks (7 categories × 40 transformations)

## Proposed Templatization System

### 1. Task Generator Templates

#### Category-Based Templates
Create category-specific templates that embed domain knowledge:

```typescript
/**
 * CategoryTemplate is used by the TaskFactory to pre-populate
 * Task fields that are purely category-driven. ALL keys below
 * correspond 1-to-1 with properties in the canonical `Task`
 * type found in `shared/schema.ts`.
 */
interface CategoryTemplate {
  /** Two- or three-letter mission code (e.g. "PL", "COM") */
  categoryCode: string;
  /** Display name surfaced in the frontend */
  categoryName: string;
  /** Emoji palette key (must exist in spaceEmojis.ts) */
  emojiSet: string;
  /** Default point reward for tasks of this category */
  basePoints: number;
  /** Minimum rank level required to attempt the task */
  requiredRankLevel: number;
}

/**
 * Registry of category presets.  Only fields that are written
 * verbatim into the final Task JSON are listed here – the
 * generator may use additional internal metadata elsewhere.
 */
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
  }
  // ... other categories
};
```

#### Transformation Pattern Templates
Map ARC-AGI transformations to reusable patterns:

```typescript
interface TransformationTemplate {
  type: string;
  category: string;
  titlePattern: string;
  descriptionPattern: string;
  gridGenerator: (size: number) => GridGeneratorFunction;
  hintPatterns: string[];
  difficulty: "Basic" | "Intermediate" | "Advanced";
}

const TRANSFORMATION_TEMPLATES: TransformationTemplate[] = [
  {
    type: "horizontal_reflection",
    category: "geometric",
    titlePattern: "{context} Reflection",
    descriptionPattern: "Analyze {domain} by reflecting the grid horizontally.",
    gridGenerator: generateHorizontalReflection,
    hintPatterns: [
      "Flip the grid left-to-right.",
      "First column becomes last column, middle stays centered."
    ],
    difficulty: "Basic"
  },
  {
    type: "rotation_90",
    category: "geometric", 
    titlePattern: "{context} Rotation",
    descriptionPattern: "Rotate {domain} indicators 90 degrees clockwise.",
    gridGenerator: generateRotation90,
    hintPatterns: [
      "Rotate the entire grid 90° clockwise.",
      "Top row becomes right column."
    ],
    difficulty: "Basic"
  }
  // ... 38 more transformations
]
```

### 2. Automated Task Generation System

#### Task Factory
```typescript
class TaskFactory {
  generateTask(
    categoryCode: string, 
    transformationType: string, 
    options?: TaskOptions
  ): TaskDefinition {
    const category = CATEGORY_TEMPLATES[categoryCode];
    const transformation = TRANSFORMATION_TEMPLATES.find(t => t.type === transformationType);
    
    return {
      id: `${categoryCode}-${this.getNextId(categoryCode)}`,
      title: this.generateTitle(category, transformation),
      description: this.generateDescription(category, transformation),
      category: category.categoryName,
      difficulty: transformation.difficulty,
      gridSize: options?.gridSize || 3,
      timeLimit: null,
      basePoints: this.calculatePoints(category, transformation),
      requiredRankLevel: this.calculateRankLevel(transformation.difficulty),
      emojiSet: category.emojiSet,
      examples: this.generateExamples(transformation, options?.gridSize),
      testInput: this.generateTestCase(transformation, options?.gridSize).input,
      testOutput: this.generateTestCase(transformation, options?.gridSize).output,
      hints: this.generateHints(category, transformation)
    };
  }
}
```

### 3. Grid Generation Engine

#### Pattern-Based Generators
```typescript
interface GridGenerator {
  generateExamples(count: number, size: number): ExamplePair[];
  generateTestCase(size: number): TestCase;
  validateTransformation(input: number[][], output: number[][]): boolean;
}

class HorizontalReflectionGenerator implements GridGenerator {
  generateExamples(count: number, size: number): ExamplePair[] {
    return Array.from({ length: count }, () => {
      const input = this.generateRandomGrid(size);
      const output = this.horizontalReflect(input);
      return { input, output };
    });
  }
  
  private horizontalReflect(grid: number[][]): number[][] {
    return grid.map(row => [...row].reverse());
  }
}
```

### 4. Content Generation Templates

#### Story Context Templates
```typescript
const STORY_TEMPLATES = {
  COM: {
    reflection: "Signal Relay {action}",
    rotation: "Antenna Array {action}",
    pattern_completion: "Communication Protocol {action}"
  },
  OS: {
    reflection: "Oxygen Flow {action}",
    rotation: "Sensor Array {action}", 
    pattern_completion: "Life Support {action}"
  }
};

const ACTION_WORDS = {
  reflection: ["Reflection", "Mirror", "Reversal"],
  rotation: ["Rotation", "Alignment", "Calibration"],
  pattern_completion: ["Completion", "Restoration", "Synchronization"]
};
```

### 5. Validation Templates

#### Schema Validation
```typescript
const TASK_SCHEMA = {
  required: ["id", "title", "description", "category", "examples", "testInput", "testOutput"],
  properties: {
    id: { pattern: "^(COM|OS|PL|FS|NAV|PWR|SEC)-\\d{3}$" },
    gridSize: { minimum: 2, maximum: 5 },
    examples: { minItems: 2, maxItems: 3 },
    hints: { minItems: 2, maxItems: 4 }
  }
};

class TaskValidator {
  validateTask(task: TaskDefinition): ValidationResult {
    // Schema validation
    // Logic validation (input/output consistency)
    // Story coherence validation
    // Difficulty progression validation
  }
}
```

### 6. Batch Generation System

#### Mass Production Tools
```typescript
class BatchTaskGenerator {
  generateFullCategorySet(categoryCode: string): TaskDefinition[] {
    const transformations = TRANSFORMATION_TEMPLATES;
    return transformations.map((transform, index) => {
      return this.taskFactory.generateTask(
        categoryCode, 
        transform.type,
        { 
          sequenceNumber: index + 1,
          gridSize: this.selectOptimalGridSize(transform.type)
        }
      );
    });
  }
  
  generateProgressiveDifficulty(
    categoryCode: string, 
    transformationType: string
  ): TaskDefinition[] {
    return [2, 3, 4].map(gridSize => 
      this.taskFactory.generateTask(categoryCode, transformationType, { gridSize })
    );
  }
}
```

## Implementation Roadmap

### Phase 1: Core Foundation & Testing
- [ ] Create category templates (all categories)
- [ ] Build validation framework with automatic test case generation
- [ ] Implement task quality verification system

### Phase 2: Initial Transformations
- [ ] Implement 5 core transformation types:
  - [ ] Horizontal reflection (geometric)
  - [ ] 90° rotation (geometric)
  - [ ] Pattern completion (pattern)
  - [ ] XOR operation (logical)
  - [ ] Object counting (object manipulation)
- [ ] Build grid generation for these transformations only

### Phase 3: Integration & Compatibility
- [ ] Implement hybrid approach for task management:
  - [ ] Flag manual vs generated tasks
  - [ ] Ensure generated tasks work alongside existing manual tasks
  - [ ] Create migration path for converting manual tasks (optional)

### Phase 4: User Testing & Refinement
- [ ] Generate test batch of 10 tasks (2 per transformation type)
- [ ] Conduct playtesting sessions with real users
- [ ] Measure difficulty levels and adjust generation parameters
- [ ] Document findings and refine generation algorithms

## Benefits of This Approach

### Development Efficiency
- **Initial Focus**: Generate 35 tasks (5 transformations × 7 categories) to establish the system
- **Consistency**: Uniform formatting and validation across manually and automatically generated tasks
- **Quality**: Automated testing of transformation logic with robust validation

### Maintainability
- **Hybrid Approach**: Support both manual and generated tasks in the same system
- **Versioning**: Track template changes to maintain consistency
- **Incremental Expansion**: Add more transformation types as needed after validating the initial set

### Quality Assurance
- **Early Validation**: Test-driven development with automatic verification
- **Real User Feedback**: Playtesting to validate difficulty levels and engagement
- **Balanced Learning Curve**: Focus on core patterns that provide a solid foundation

## File Structure Changes

```
server/
├── templates/
│   ├── categories.ts          # Category definitions
│   ├── transformations.ts     # ARC-AGI transformation patterns
│   ├── generators/            # Grid generation classes  
│   └── validators.ts          # Validation logic
├── tools/
│   ├── task-factory.ts        # Main generation engine
│   ├── batch-generator.ts     # Mass production tools
│   └── content-generator.ts   # Story/hint generation
└── data/
    ├── tasks/                 # Generated task files
    └── templates/             # Template definitions
```

## Migration Strategy

### Hybrid Task Management
- Maintain existing manual tasks without disruption
- Flag tasks as `generated: true` in task metadata
- Implement both systems side-by-side with clear documentation
- Prioritize user experience consistency across both task types

### Developer Workflow
```bash
# Generate a specific task for a category
npm run generate:task COM horizontal_reflection

# Generate 5 core transformations for a specific category
npm run generate:core-set COM

# Generate all 5 core transformations across all categories (35 tasks)
npm run generate:all-core

# Validate tasks against schema and transformation rules
npm run validate:tasks

# Run automated playtest simulation
npm run test:difficulty-curve
```

This templatization system will transform task creation through a balanced approach - starting with 35 high-quality tasks (5 transformation types across 7 categories) that can be thoroughly tested and refined before expanding. The hybrid compatibility ensures we get the best of both worlds: structured automation while preserving existing manual content.