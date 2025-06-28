/**
 * Simplified task generator for diagonal reflection tasks
 * 
 * This script generates task files for diagonal reflections without requiring ts-node.
 * 
 * @author Cascade
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import required components from project files
import { TaskFactory } from '../tools/task-factory.js';
import { TaskValidator } from '../templates/validators.js';

/**
 * Generate a task for the specified category and diagonal reflection type
 * @param {string} category Category code (e.g. "OS", "NAV")
 * @param {string} transformationType Transformation type (primary_diagonal_reflection or secondary_diagonal_reflection)
 * @param {string} outputPath Path to save the generated task
 * @param {Object} options Additional options (difficulty, gridSize)
 */
// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateDiagonalTask(category, transformationType, outputPath, options = {}) {
  // Create factory and validator instances
  const factory = new TaskFactory();
  const validator = new TaskValidator();
  
  console.log(`Generating ${category} × ${transformationType} task...`);
  
  // Generate the task
  const task = factory.generateTask(category, transformationType, {
    difficulty: options.difficulty || 'Intermediate',
    gridSize: options.gridSize || 4
  });
  
  if (!task) {
    console.error('Error: Failed to generate task');
    process.exit(1);
  }
  
  // Validate the generated task
  const validationResult = validator.validateTask(task);
  if (!validationResult.isValid) {
    console.error('Error: Generated task is invalid:');
    validationResult.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  // Make sure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Save the task to file
  fs.writeFileSync(outputPath, JSON.stringify(task, null, 2));
  console.log(`Task generated and saved to ${outputPath}`);
  
  return task;
}

// Command line arguments
const args = process.argv.slice(2);
const usage = 'Usage: node generate-diagonal-task.js <category> <transformation> <output-file>';

// Check arguments
if (args.length < 3) {
  console.log(usage);
  console.log('\nExample:');
  console.log('  node server/scripts/generate-diagonal-task.js OS primary_diagonal_reflection server/data/tasks/OS-111.json');
  console.log('  node server/scripts/generate-diagonal-task.js NAV secondary_diagonal_reflection server/data/tasks/NAV-112.json');
  process.exit(1);
}

// Parse arguments
const [category, transformation, outputPath] = args;

// Validate transformation type
if (transformation !== 'primary_diagonal_reflection' && transformation !== 'secondary_diagonal_reflection') {
  console.error(`Error: Transformation must be 'primary_diagonal_reflection' or 'secondary_diagonal_reflection'`);
  console.log(usage);
  process.exit(1);
}

// Generate the task
generateDiagonalTask(category, transformation, outputPath).catch(err => {
  console.error('Error generating task:', err);
  process.exit(1);
});
