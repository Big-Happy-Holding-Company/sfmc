/**
 * Script to generate and save diagonal reflection tasks as JSON files
 * 
 * This script creates properly formatted task JSON files for both primary and 
 * secondary diagonal reflections that can be used directly in the game.
 * 
 * @author Cascade
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper function to create a grid of given size filled with random numbers (0-9)
 */
function createRandomGrid(size) {
  const grid = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      // Generate random number between 0 and 9
      row.push(Math.floor(Math.random() * 10));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Apply primary diagonal reflection transformation to a grid
 */
function applyPrimaryDiagonalReflection(grid) {
  const size = grid.length;
  const result = [];
  
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(grid[j][i]);
    }
    result.push(row);
  }
  
  return result;
}

/**
 * Apply secondary diagonal reflection transformation to a grid
 */
function applySecondaryDiagonalReflection(grid) {
  const size = grid.length;
  const result = [];
  
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(grid[size - 1 - j][size - 1 - i]);
    }
    result.push(row);
  }
  
  return result;
}

/**
 * Format the grid nicely for console display
 */
function formatGrid(grid) {
  return grid.map(row => row.join(' ')).join('\n');
}

/**
 * Create a full task definition for a diagonal reflection task
 */
function createTaskDefinition(category, transformationType, gridSize, input, output, hints, id) {
  // Common task structure based on the TaskDefinition interface
  const task = {
    id: id,
    title: `${transformationType === 'primary_diagonal_reflection' ? 'Primary' : 'Secondary'} Diagonal Reflection Task`,
    description: `${transformationType === 'primary_diagonal_reflection' ? 
      'Reflect the grid across the primary diagonal (top-left to bottom-right)' : 
      'Reflect the grid across the secondary diagonal (top-right to bottom-left)'}`,
    category: category,
    difficulty: gridSize <= 2 ? "Basic" : gridSize <= 3 ? "Intermediate" : "Advanced",
    gridSize: gridSize,
    timeLimit: null,
    basePoints: 100,
    requiredRankLevel: 1,
    emojiSet: "0",
    examples: [
      {
        input: createRandomGrid(gridSize),
        output: transformationType === 'primary_diagonal_reflection' ? 
          applyPrimaryDiagonalReflection(createRandomGrid(gridSize)) : 
          applySecondaryDiagonalReflection(createRandomGrid(gridSize))
      },
      {
        input: createRandomGrid(gridSize),
        output: transformationType === 'primary_diagonal_reflection' ? 
          applyPrimaryDiagonalReflection(createRandomGrid(gridSize)) : 
          applySecondaryDiagonalReflection(createRandomGrid(gridSize))
      }
    ],
    testInput: input,
    testOutput: output,
    hints: hints,
    transformationType: transformationType,
    generated: true
  };
  
  return task;
}

/**
 * Generate and save a task for primary diagonal reflection
 */
async function savePrimaryDiagonalReflectionTask(category, id, gridSize = 4) {
  console.log(`\nGenerating primary diagonal reflection task for ${category} (ID: ${id})...`);
  
  // Generate a test case
  const input = createRandomGrid(gridSize);
  const output = applyPrimaryDiagonalReflection(input);
  
  // Define hints
  const hints = [
    "Imagine a line going from the top-left corner to the bottom-right corner of the grid ↘️. Flip the grid over this line.",
    "This is like swapping rows and columns - the first row becomes the first column, the second row becomes the second column, and so on.",
    "The number in the top-right corner will move to the bottom-left corner, like looking at the grid in a mirror along the diagonal."
  ];
  
  // Create the full task definition
  const task = createTaskDefinition(
    category, 
    "primary_diagonal_reflection", 
    gridSize, 
    input, 
    output, 
    hints, 
    `${category}-${id}`
  );
  
  // Save to file
  const outputDir = path.join(__dirname, '..', 'data', 'tasks');
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filePath = path.join(outputDir, `${category}-${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(task, null, 2));
  
  console.log(`Task saved to: ${filePath}`);
  console.log('Input Grid:');
  console.log(formatGrid(input));
  console.log('Expected Output Grid:');
  console.log(formatGrid(output));
  
  return task;
}

/**
 * Generate and save a task for secondary diagonal reflection
 */
async function saveSecondaryDiagonalReflectionTask(category, id, gridSize = 4) {
  console.log(`\nGenerating secondary diagonal reflection task for ${category} (ID: ${id})...`);
  
  // Generate a test case
  const input = createRandomGrid(gridSize);
  const output = applySecondaryDiagonalReflection(input);
  
  // Define hints
  const hints = [
    "Imagine a line going from the top-right corner to the bottom-left corner of the grid ↙️. Flip the grid over this line.",
    "The top-left corner will swap with the bottom-right corner, like a different kind of mirror.",
    "Think of this as \"flipping the grid upside down\" and then \"flipping it left to right\" all at once."
  ];
  
  // Create the full task definition
  const task = createTaskDefinition(
    category, 
    "secondary_diagonal_reflection", 
    gridSize, 
    input, 
    output, 
    hints, 
    `${category}-${id}`
  );
  
  // Save to file
  const outputDir = path.join(__dirname, '..', 'data', 'tasks');
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filePath = path.join(outputDir, `${category}-${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(task, null, 2));
  
  console.log(`Task saved to: ${filePath}`);
  console.log('Input Grid:');
  console.log(formatGrid(input));
  console.log('Expected Output Grid:');
  console.log(formatGrid(output));
  
  return task;
}

// Process command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('Usage: node save-diagonal-tasks.js <category> <primaryId> <secondaryId> [gridSize]');
  console.log('Example: node server/scripts/save-diagonal-tasks.js OS 111 112 4');
  process.exit(1);
}

const category = args[0];
const primaryId = args[1];
const secondaryId = args[2];
const gridSize = args[3] ? parseInt(args[3]) : 4;

// Generate and save both types of diagonal reflection tasks
console.log(`Generating and saving diagonal reflection tasks for category ${category}...`);

try {
  await savePrimaryDiagonalReflectionTask(category, primaryId, gridSize);
  await saveSecondaryDiagonalReflectionTask(category, secondaryId, gridSize);
  console.log('\nTask generation complete!');
} catch (error) {
  console.error('Error generating tasks:', error);
  process.exit(1);
}
