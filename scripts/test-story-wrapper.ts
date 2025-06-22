/**
 * Story Wrapper Test Script
 * ------------------------
 * This script applies the story wrapper to specified task files and outputs the results.
 * It also generates a new task file with a story based on provided parameters.
 * 
 * Author: Cascade
 * Date: 2025-06-21
 */

// Use proper ESM imports
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyStory } from '../server/tools/story-factory.js';
import { TaskDefinition } from '../server/templates/task.interface.js';

// Set up directory paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Utility to read a task file
function readTaskFile(taskId: string): TaskDefinition {
  const filePath = path.resolve(projectRoot, 'server/data/tasks', `${taskId}.json`);
  console.log(`Reading task from: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TaskDefinition;
}

// Utility to write a task file
function writeTaskFile(taskId: string, task: TaskDefinition): void {
  const filePath = path.resolve(projectRoot, 'server/data/tasks', `${taskId}.json`);
  console.log(`Writing task to: ${filePath}`);
  fs.writeFileSync(filePath, JSON.stringify(task, null, 2), 'utf-8');
}

// Process existing tasks
function processExistingTask(taskId: string): void {
  console.log(`\n== Processing Task ${taskId} ==\n`);
  
  try {
    // Read the original task
    console.log(`Reading task file: ${taskId}.json`);
    const originalTask = readTaskFile(taskId);
    console.log('Original Task:');
    console.log(`Title: ${originalTask.title}`);
    console.log(`Description: ${originalTask.description}`);
    console.log(`Transformation Type: ${originalTask.transformationType || 'not specified'}`);
    
    // Apply the story wrapper
    console.log(`Applying story wrapper to task ${taskId}...`);
    const enhancedTask = applyStory(originalTask);
    console.log('\nEnhanced Task:');
    console.log(`Title: ${enhancedTask.title}`);
    console.log(`Description: ${enhancedTask.description}`);
    
    // Ask if user wants to save the changes
    console.log('\nThe enhanced task has been generated. To save these changes, run:');
    console.log(`npx tsx scripts/test-story-wrapper.ts save ${taskId}`);
  } catch (error) {
    console.error(`Error processing task ${taskId}:`, error);
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
    throw error; // Re-throw so main error handler can catch it
  }
}

// Generate a new task
function generateNewTask(taskId: string, baseTaskId: string, transformationType: string): void {
  console.log(`\n== Generating New Task ${taskId} ==\n`);
  
  try {
    // Read the base task to use as template
    const baseTask = readTaskFile(baseTaskId);
    
    // Create new task object
    const newTask: TaskDefinition = {
      ...baseTask,
      id: taskId,
      transformationType: transformationType
    };
    
    // Apply story wrapper
    const enhancedTask = applyStory(newTask);
    console.log('Generated Task:');
    console.log(`Title: ${enhancedTask.title}`);
    console.log(`Description: ${enhancedTask.description}`);
    
    // Ask if user wants to save the new task
    console.log('\nThe new task has been generated. To save it, run:');
    console.log(`npx tsx scripts/test-story-wrapper.ts save-new ${taskId} ${baseTaskId} ${transformationType}`);
  } catch (error) {
    console.error(`Error generating task ${taskId}:`, error);
  }
}

// Save an existing task with the story wrapper applied
function saveExistingTask(taskId: string): void {
  try {
    const originalTask = readTaskFile(taskId);
    const enhancedTask = applyStory(originalTask);
    writeTaskFile(taskId, enhancedTask);
    console.log(`Task ${taskId} has been updated with the story wrapper.`);
  } catch (error) {
    console.error(`Error saving task ${taskId}:`, error);
  }
}

// Save a new task
function saveNewTask(taskId: string, baseTaskId: string, transformationType: string): void {
  try {
    const baseTask = readTaskFile(baseTaskId);
    const newTask: TaskDefinition = {
      ...baseTask,
      id: taskId,
      transformationType: transformationType
    };
    const enhancedTask = applyStory(newTask);
    writeTaskFile(taskId, enhancedTask);
    console.log(`New task ${taskId} has been created with the story wrapper.`);
  } catch (error) {
    console.error(`Error saving new task ${taskId}:`, error);
  }
}

// Main function
function main(): void {
  console.log('Starting script with arguments:', process.argv);
  const command = process.argv[2] || 'preview';
  console.log(`Running command: ${command}`);
  
  switch (command) {
    case 'preview':
      // Process existing tasks
      console.log('Processing existing tasks COM-104 and COM-100...');
      try {
        processExistingTask('COM-104');
        processExistingTask('COM-100');
      } catch (error) {
        console.error('Error in preview mode:', error);
      }
      break;
      
    case 'save':
      const taskId = process.argv[3];
      if (!taskId) {
        console.error('Task ID is required for save command');
        process.exit(1);
      }
      saveExistingTask(taskId);
      break;
      
    case 'generate':
      const newTaskId = process.argv[3] || 'COM-101';
      const baseTaskId = process.argv[4] || 'COM-100';
      const transformationType = process.argv[5] || 'horizontal_reflection';
      generateNewTask(newTaskId, baseTaskId, transformationType);
      break;
      
    case 'save-new':
      const saveNewTaskId = process.argv[3];
      const saveBaseTaskId = process.argv[4];
      const saveTransformationType = process.argv[5];
      if (!saveNewTaskId || !saveBaseTaskId || !saveTransformationType) {
        console.error('Task ID, base task ID, and transformation type are required for save-new command');
        process.exit(1);
      }
      saveNewTask(saveNewTaskId, saveBaseTaskId, saveTransformationType);
      break;
      
    default:
      console.log('Unknown command. Available commands:');
      console.log('- preview: Preview story wrappers for COM-104 and COM-100');
      console.log('- save [taskId]: Save story wrapper for an existing task');
      console.log('- generate [newTaskId] [baseTaskId] [transformationType]: Generate a new task with a story');
      console.log('- save-new [newTaskId] [baseTaskId] [transformationType]: Save a new task with a story');
      break;
  }
}

// Run the main function with error handling
try {
  main();
} catch (error) {
  console.error('Script failed with error:', error);
  process.exit(1);
}
