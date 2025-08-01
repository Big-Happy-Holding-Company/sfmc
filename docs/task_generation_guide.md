# SFMC Task Generation Guide

*Author: Cascade with Claude 4 Sonnet Thinking*  
*Created: 2025-06-19*  
*Major Update: 2025-08-01 - Combined Transformation Methodology*

## Table of Contents
- [Introduction](#introduction)
- [Combined Transformation Methodology](#combined-transformation-methodology)
- [Hint-Based Documentation Standards](#hint-based-documentation-standards)
- [Crediting and Attribution Requirements](#crediting-and-attribution-requirements)
- [Project Structure](#project-structure)
- [Task Generation Process](#task-generation-process)
- [Manual Task Creation Guidelines](#manual-task-creation-guidelines)
- [Validation Process](#validation-process)
- [Examples](#examples)

## Introduction

The SFMC Task Generation System creates sophisticated puzzle tasks that combine multiple ARC-AGI transformation types to produce cognitively challenging problems suitable for fluid intelligence training. This guide provides comprehensive methodology for creating high-quality onboarding puzzles that follow strict documentation and attribution standards.

**Key Principles:**
- Each onboarding task combines exactly **2 transformation types** from types.md
- All tasks must be solvable using only visual patterns (no numbers visible to users)
- Hints serve as comprehensive documentation of puzzle logic and solution methodology
- All puzzle creators must be credited with their reasoning and approach

## Combined Transformation Methodology

### Philosophy

True ARC-AGI-style puzzles require more than simple single transformations. By combining two transformation types, we create puzzles that:

1. **Test Multiple Cognitive Skills**: Users must identify and apply two distinct logical operations
2. **Increase Complexity Gradually**: Combinations create natural difficulty progression
3. **Mirror Real ARC-AGI Tasks**: Official ARC tasks often involve multi-step reasoning
4. **Provide Rich Learning Experiences**: Users develop pattern recognition across multiple dimensions

### Transformation Selection Strategy

When selecting 2 transformations to combine:

1. **Choose Complementary Operations**: Select transformations that work well together
   - Example: Geometric transformation + Logical operation
   - Example: Spatial filtering + Value manipulation

2. **Consider Difficulty Progression**: Earlier tasks should combine simpler operations
   - OB-006 to OB-012: Basic combinations (reflections + simple operations)
   - OB-013 to OB-025: Intermediate combinations (rotations + pattern operations)
   - OB-026+: Advanced combinations (complex spatial + logical operations)

3. **Ensure Visual Solvability**: Both transformations must be identifiable using only emoji patterns

### Available Transformation Categories (from types.md)

**GEOMETRIC TRANSFORMATIONS (1-10)**
- Horizontal/Vertical Reflection, Rotations, Diagonal Reflections, Translation, Scaling

**PATTERN OPERATIONS (11-20)**  
- Pattern Completion, Extension, Repetition, Sequence Increment, Symmetry Completion

**LOGICAL OPERATIONS (21-30)**
- AND, OR, XOR, NOT Operations, Value Matching, Neighbor Count, Majority Value, etc.

**SPATIAL FILTERING (31-40)**
- Border Extraction, Interior Extraction, Corner Marking, Cross Extraction, etc.

## Hint-Based Documentation Standards

### Purpose of Hints

Hints serve as the **primary documentation system** for puzzle logic. They must:

1. **Explain the Solution Process**: Step-by-step methodology for solving the puzzle
2. **Document Transformation Logic**: Clear explanation of each transformation applied
3. **Provide Context**: Why this combination makes sense within the Space Force theme
4. **Enable Debugging**: Sufficient detail for developers to validate puzzle correctness
5. **Credit the Creator**: Attribution and design rationale

### Hint Structure Requirements

Each task must include **4-6 hints** following this pattern:

1. **Step 1 Explanation**: "First, [describe first transformation with technical details]"
2. **Step 2 Explanation**: "Then, [describe second transformation with technical details]"
3. **Thematic Context**: "[Space Force operational context for why this combination is needed]"
4. **Technical Note** (optional): Additional implementation details if complex
5. **Validation Tip** (optional): How to verify the solution is correct
6. **Creator Credit**: "Created by: Cascade with Claude 4 Sonnet Thinking based on types.md. [Design rationale explanation]"

### Example Hint Set

```json
"hints": [
  "First, rotate the grid 90° clockwise: [i][j] becomes [j][n-1-i].",
  "Then fill missing values (0s) by completing the orbital pattern based on established sequence.",
  "Orbital mechanics follows predictable trajectory sequences that can be calculated.",
  "The rotation represents satellite orbital perspective change, pattern completion fills trajectory gaps.",
  "Created by: Cascade with Claude 4 Sonnet Thinking based on types.md. Combined 90° Rotation (#3) with Pattern Completion (#11) to create a realistic orbital mechanics scenario that tests both geometric transformation recognition and sequence pattern identification."
]
```

## Crediting and Attribution Requirements

### Mandatory Credit Format

The final hint **must always** include:

```
"Created by: Cascade with Claude 4 Sonnet Thinking based on types.md. [Design rationale explaining why these specific transformations were combined and what cognitive skills the puzzle tests.]"
```

### Design Rationale Components

1. **Transformation Selection**: Why these 2 specific types were chosen
2. **Combination Logic**: How they work together conceptually 
3. **Cognitive Goals**: What skills/reasoning the puzzle develops
4. **Space Force Context**: How it fits the thematic setting
5. **Difficulty Considerations**: Why this level of complexity is appropriate

### Example Design Rationales

- "Combined Horizontal Reflection (#1) with Border Extraction (#31) to test both geometric symmetry recognition and spatial filtering skills in an emergency systems context."
- "Paired Translation/Shift (#8) with XOR Operation (#23) to challenge users with sequential geometric transformation followed by exclusive logical operation, simulating airlock recalibration protocols."
- "Used 180° Rotation (#4) with Corner Marking (#33) to develop rotational spatial awareness combined with critical point identification, essential for heat shield stress analysis."

## Project Structure

The templatization system is organized as follows:

```
server/
├── templates/
│   ├── categories.ts        # Category definitions and metadata
│   ├── transformations.ts   # Transformation type definitions
│   ├── generators/          # Grid generation logic for each transformation
│   │   ├── horizontal-reflection-generator.ts
│   │   ├── rotation-90deg-generator.ts
│   │   ├── pattern-completion-generator.ts
│   │   ├── xor-operation-generator.ts
│   │   └── object-counting-generator.ts
│   ├── task.interface.ts    # Task data structure interface
│   └── validators.ts        # Schema and logic validation
├── tools/
│   ├── task-factory.ts      # Task creation factory
│   └── test-runner.ts       # Test execution
└── cli/
    └── generate-task.ts     # CLI entry point
```

## Manual Task Creation Guidelines

### Philosophy

While CLI tools exist for basic tasks, **manual creation** is the preferred method for onboarding puzzles that combine transformations. This approach ensures:

1. **Quality Control**: Each puzzle is carefully designed and validated
2. **Creative Flexibility**: Complex combinations require human insight
3. **Thematic Coherence**: Space Force context can be properly integrated
4. **Educational Value**: Puzzles are optimized for learning progression

### Step-by-Step Creation Process

#### 1. Select Transformation Combination

- Choose 2 transformations from types.md (numbered 1-40)
- Ensure they work well together conceptually
- Consider difficulty progression within the onboarding sequence
- Verify both are visually solvable using only emoji patterns

#### 2. Design Grid Examples

**Create 2 Examples Minimum:**
- Start with input grids that clearly demonstrate the pattern
- Apply transformation 1, then transformation 2 in sequence
- Verify outputs are correct and unambiguous
- Test different grid sizes (typically 2x2, 3x3, or 4x4)

**Grid Design Principles:**
- Use integers 0-9 (never emojis in data files)
- Make patterns visually distinctive when mapped to emojis
- Avoid overly complex initial grids that obscure the transformations
- Include varied examples that test edge cases

#### 3. Create Test Input/Output

- Design a test case that follows the same transformation logic
- Ensure it's neither too easy nor impossibly difficult
- Verify the test output is the unique correct solution

#### 4. Craft Comprehensive Hints

**Hint 1**: "First, [detailed explanation of transformation 1 with technical notation]"
**Hint 2**: "Then, [detailed explanation of transformation 2 with technical notation]"
**Hint 3**: "[Space Force operational context explaining why this combination makes sense]"
**Hint 4**: "[Additional technical or validation information if needed]"
**Hint 5**: "Created by: Cascade with Claude 4 Sonnet Thinking based on types.md. [Design rationale]"

#### 5. Set Metadata

```json
{
  "id": "OB-XXX",
  "title": "[Space Force Themed Title]",
  "description": "[Description explaining the operational context and transformation combination]",
  "category": "⚙️ Onboard Systems",
  "difficulty": "Basic|Intermediate|Advanced",
  "gridSize": 2|3|4|5,
  "timeLimit": null,
  "basePoints": 2000|2500|3000,
  "requiredRankLevel": 1,
  "emojiSet": "tech_set2"
}
```

### Quality Assurance Checklist

**Before Publishing:**
- [ ] Both transformations are clearly identifiable from examples
- [ ] Test output is mathematically correct
- [ ] All hints explain the solution methodology completely
- [ ] Space Force theme is coherent and engaging
- [ ] Grid patterns work visually with emoji mapping
- [ ] Creator credit includes design rationale
- [ ] JSON structure validates against schema
- [ ] File naming follows OB-XXX.json convention

## Task Generation Process

1. **Category Selection**: Choose one of the predefined categories from `categories.ts`
2. **Transformation Selection**: Choose a transformation type from `transformations.ts`
3. **Grid Generation**: The appropriate generator class creates input and output grid pairs
4. **Task Assembly**: The task factory combines metadata with generated grids
5. **Validation**: The validator ensures schema compliance and logical consistency
6. **Output**: The task is saved to the specified location

### Important Implementation Requirements

1. Tasks IDs must follow the sequential format (`XXX-100`, `XXX-101`, etc.) starting at 100 for each category
2. Each task must include exactly three hints
3. Transformation names must match exactly those defined in `transformations.ts`
4. Category codes and names must match exactly those defined in `categories.ts`
5. Emoji sets must reference `spaceEmojis.ts` as the source of truth

## Customizing Generators

Each generator extends the `GridGenerator` base class and implements the following methods:

- `generateGrid(size: number)`: Creates a random input grid
- `applyTransformation(grid: number[][])`: Applies the transformation to produce the output grid
- `generateExamples(count: number, size: number)`: Creates example input-output pairs

To customize a generator:

1. Open the specific generator file in `server/templates/generators/`
2. Modify the grid generation logic or transformation application
3. Run tests to ensure the generator produces valid grid pairs

## Adding New Transformations

To add a new transformation:

1. Define the transformation in `transformations.ts`:
```typescript
export const MY_NEW_TRANSFORMATION: Transformation = {
  name: 'my_new_transformation',
  displayName: 'My New Transformation',
  description: 'A description of what this transformation does'
};
```

2. Create a new generator class in `server/templates/generators/`:
```typescript
import { GridGenerator } from './grid-generator';

export class MyNewTransformationGenerator extends GridGenerator {
  // Implementation...
}
```

3. Register the transformation and generator in the task factory
4. Update the validator to support the new transformation

## Validation Process

The validation system ensures that generated tasks strictly comply with the project schema and requirements. It checks:

1. **Schema Compliance**: All required fields are present with correct data types
2. **Transformation Correctness**: Output grids are valid transformations of input grids
3. **Metadata Consistency**: Category, difficulty, and other metadata are consistent
4. **Content Standards**: Three hints are included, emoji sets are valid, etc.

## Troubleshooting

### Common Issues

#### "Unknown transformation type"
- Ensure transformation names exactly match those in `transformations.ts` (check for typos, underscores vs. hyphens)

#### "Missing required field"
- Verify that all required fields are included in the generated task
- Check for typos in field names

#### "Invalid grid transformation"
- Debug the generator logic to ensure it correctly applies the transformation
- Verify that input and output grids are consistent

#### ESM/TypeScript Issues
- Ensure your `tsconfig.json` includes proper ESM configuration
- Use `npx tsx` instead of `ts-node` to run TypeScript CLI tools

## Examples

### Example 1: Generate a Communication Task

```powershell
npx tsx server\cli\generate-task.ts single -c COM -t horizontal_reflection -s 3 -o server\data\tasks\COM-100.json
```

### Example 2: Generate Multiple Navigation Tasks

```powershell
npx tsx server\cli\generate-task.ts category -c NAV -o server\data\tasks
```

### Example 3: Custom Task with Specific Parameters

```powershell
npx tsx server\cli\generate-task.ts single -c FS -t rotation_90deg -s 4 -d Advanced -o server\data\tasks\FS-100.json
```


