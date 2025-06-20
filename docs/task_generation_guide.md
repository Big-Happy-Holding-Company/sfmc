# SFMC Task Generation Guide

*Author: Cascade*  
*Created: 2025-06-19*

## Table of Contents
- [Introduction](#introduction)
- [Project Structure](#project-structure)
- [CLI Tools](#cli-tools)
- [Task Generation Process](#task-generation-process)
- [Customizing Generators](#customizing-generators)
- [Adding New Transformations](#adding-new-transformations)
- [Validation Process](#validation-process)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Introduction

The SFMC Task Generation System enables programmatic creation of puzzle tasks that strictly follow the project's schema and requirements. This document provides comprehensive guidance for developers on how to use, extend, and troubleshoot the task generation system.

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

## CLI Tools

### Prerequisites

- Node.js 16+ with npm/npx
- TypeScript
- Project dependencies installed (`npm install`)

### Environment Setup

The project uses ESM modules with TypeScript, which requires specific configuration:

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    // Other settings...
  },
  "ts-node": {
    "esm": true
  }
}
```

For best results, use `npx tsx` to run the CLI tools, which handles TypeScript ESM modules properly.

### Task Generation Commands

#### Generate a Single Task

```powershell
npx tsx server\cli\generate-task.ts single -c <CATEGORY> -t <TRANSFORMATION> -s <SIZE> -o <OUTPUT_PATH>
```

Example:
```powershell
npx tsx server\cli\generate-task.ts single -c COM -t horizontal_reflection -s 4 -o server\data\tasks\COM-100.json
```

#### Generate All Tasks for a Category

```powershell
npx tsx server\cli\generate-task.ts category -c <CATEGORY> -o <OUTPUT_DIR>
```

Example:
```powershell
npx tsx server\cli\generate-task.ts category -c NAV -o server\data\tasks
```

#### Generate All Tasks for All Categories

```powershell
npx tsx server\cli\generate-task.ts all -o <OUTPUT_DIR>
```

Example:
```powershell
npx tsx server\cli\generate-task.ts all -o server\data\tasks
```

#### List Available Categories and Transformations

```powershell
npx tsx server\cli\generate-task.ts list
```

### Command Parameters

| Parameter | Short | Description | Values |
|-----------|-------|-------------|--------|
| `--category` | `-c` | Category code | `COM`, `NAV`, `FS`, `OS`, `PL`, `PWR`, `SEC` |
| `--transformation` | `-t` | Transformation type | `horizontal_reflection`, `rotation_90deg`, `pattern_completion`, `xor_operation`, `object_counting` |
| `--size` | `-s` | Grid size | `2`, `3`, `4` (default: `3`) |
| `--difficulty` | `-d` | Difficulty level | `Basic`, `Intermediate`, `Advanced` (determined automatically if not specified) |
| `--output` | `-o` | Output file or directory path | Any valid path (`server\data\tasks` for default location) |

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

----

For questions or support, refer to the development team or update this document as new features and requirements are added.
