# Puzzle Test Cases Reference
Just some puzzles I found useful
This document contains a JSON array of test puzzles used for development and debugging.

## Available Test Cases

```json
[
  {
    "id": "87ab05b8",
    "name": "4x4 Basic Test",
    "description": "Simple 4x4 puzzle for basic functionality testing",
    "difficulty": "easy",
    "gridSize": { "width": 4, "height": 4 },
    "testCount": 1,
    "dataPath": "data/training2/87ab05b8.json",
    "tags": ["basic", "small-grid", "quick-test"]
  },
  {
    "id": "be03b35f",
    "name": "Standard Test Puzzle",
    "description": "Reliable test case for general testing",
    "difficulty": "easy",
    "gridSize": { "width": 6, "height": 6 },
    "testCount": 1,
    "dataPath": "data/evaluation/be03b35f.json",
    "tags": ["standard", "balanced"]
  },
  {
    "id": "9aaea919",
    "name": "Maximum Size Test",
    "description": "Tests grid size limits and performance",
    "difficulty": "hard",
    "gridSize": { "width": 30, "height": 30 },
    "testCount": 1,
    "dataPath": "data/evaluation2/9aaea919.json",
    "tags": ["performance", "large-grid", "stress-test"]
  },
  {
    "id": "27a28665",
    "name": "Multi-Test Challenge",
    "description": "Requires 3 tests to complete",
    "difficulty": "medium",
    "gridSize": { "width": 8, "height": 8 },
    "testCount": 3,
    "dataPath": "data/training2/27a28665.json",
    "tags": ["multi-test", "challenge"]
  },
  {
    "id": "d35bdbdc",
    "name": "10x10 Test Suite",
    "description": "10x10 grid with multiple test cases",
    "difficulty": "medium",
    "gridSize": { "width": 10, "height": 10 },
    "testCount": 3,
    "dataPath": "data/evaluation2/d35bdbdc.json",
    "tags": ["evaluation", "medium-grid", "multi-test"]
  },
  {
    "id": "d631b094",
    "name": "Number Connection Puzzle",
    "description": "Connect matching numbers with lines that don't cross",
    "difficulty": "medium",
    "gridSize": { "width": 3, "height": 3 },
    "testCount": 1,
    "dataPath": "data/training2/d631b094.json",
    "tags": ["training"],
    "testCase": {
      "input": [
        [4, 4, 0],
        [4, 0, 4],
        [0, 0, 4]
      ],
      "expectedOutput": [
        [4, 4, 4, 4, 4]
      ]
    },

  

  },
  {
    "id": "7b80bb43",
    "name": "Gate Closing",
    "description": "Close the gates, eliminate the noise",
    "difficulty": "hard",
    "gridSize": { "width": 29, "height": 17 },
    "testCount": 1,
    "dataPath": "data/training2/d631b094.json",
    "tags": ["training"],
    
    },

  


]
```

## Usage in Code

```typescript
// Import from the TypeScript module
import { getPuzzleById } from '@/testUtils/puzzleTestCases';

// Get a specific puzzle
const puzzle = getPuzzleById('87ab05b8');
```

## Fields Description

- `id`: Unique puzzle identifier
- `name`: Short descriptive name
- `description`: Purpose of the test case
- `difficulty`: Difficulty level (easy/medium/hard)
- `gridSize`: Width and height of the puzzle grid
- `testCount`: Number of tests required to complete
- `dataPath`: Path to the puzzle data file
- `tags`: Categories for filtering test cases
