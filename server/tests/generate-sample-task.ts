/**
 * Generate a sample task for demonstration
 * 
 * This script directly uses the TaskFactory to generate a sample task
 * and save it to a JSON file.
 * 
 * @author Cascade
 */

import fs from 'fs';
import path from 'path';
import { TaskFactory } from '../tools/task-factory';
import { TaskValidator } from '../templates/validators';

// Create instances of TaskFactory and TaskValidator
const factory = new TaskFactory();
const validator = new TaskValidator();

// Generate a task with the COM category and horizontal_reflection transformation
const task = factory.generateTask('COM', 'horizontal_reflection');

if (!task) {
  console.error('Failed to generate task');
  process.exit(1);
}

// Validate the generated task
const validationResult = validator.validateTask(task);
if (!validationResult.isValid) {
  console.error('Generated task is invalid:');
  validationResult.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

// Output the task
const outputPath = path.join(__dirname, '../data/tasks/COM-100.json');
const taskJson = JSON.stringify(task, null, 2);

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write to file
fs.writeFileSync(outputPath, taskJson);
console.log(`Task generated and saved to ${outputPath}`);
console.log('\nTask Content:');
console.log(taskJson);
