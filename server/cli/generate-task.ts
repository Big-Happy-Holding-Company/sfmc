/**
 * Command-line tool for generating tasks
 * 
 * This CLI tool generates tasks by combining category templates with transformations.
 * It can generate a single task or batches of tasks.
 * 
 * @author Cascade
 */

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { TaskFactory } from '../tools/task-factory';
import { TaskValidator } from '../templates/validators';
import { CATEGORY_TEMPLATES } from '../templates/categories';
import { TRANSFORMATION_TEMPLATES, getTransformationByType } from '../templates/transformations';

// Set up the command line interface
const program = new Command()
  .name('generate-task')
  .description('Generate tasks for SFMC puzzles')
  .version('1.0.0');

// Command to generate a single task
program
  .command('single')
  .description('Generate a single task')
  .requiredOption('-c, --category <code>', 'Category code (e.g., COM, NAV)')
  .requiredOption('-t, --transformation <type>', 'Transformation type')
  .option('-d, --difficulty <level>', 'Difficulty level (Basic, Intermediate, Advanced)')
  .option('-s, --size <number>', 'Grid size (2-4)', parseInt)
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .action(generateSingleTask);

// Command to generate all tasks for a category
program
  .command('category')
  .description('Generate all tasks for a category')
  .requiredOption('-c, --category <code>', 'Category code (e.g., COM, NAV)')
  .option('-d, --difficulty <level>', 'Difficulty level (Basic, Intermediate, Advanced)')
  .option('-o, --output <dir>', 'Output directory', './generated-tasks')
  .action(generateCategoryTasks);

// Command to generate all tasks (all categories x all transformations)
program
  .command('all')
  .description('Generate all tasks (all categories x all transformations)')
  .option('-d, --difficulty <level>', 'Difficulty level (Basic, Intermediate, Advanced)')
  .option('-o, --output <dir>', 'Output directory', './generated-tasks')
  .action(generateAllTasks);

// Command to list available categories and transformations
program
  .command('list')
  .description('List available categories and transformations')
  .action(listAvailableOptions);

/**
 * Generate a single task
 * @param options Command options
 */
async function generateSingleTask(options: any) {
  const factory = new TaskFactory();
  const validator = new TaskValidator();
  
  // Validate inputs
  if (!CATEGORY_TEMPLATES[options.category]) {
    console.error(`Error: Category '${options.category}' not found`);
    process.exit(1);
  }
  
  const transformation = getTransformationByType(options.transformation);
  if (!transformation) {
    console.error(`Error: Transformation '${options.transformation}' not found`);
    process.exit(1);
  }
  
  // Generate the task
  const task = factory.generateTask(options.category, options.transformation, {
    difficulty: options.difficulty,
    gridSize: options.size
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
  
  // Output the task
  const taskJson = JSON.stringify(task, null, 2);
  
  if (options.output) {
    try {
      // Ensure directory exists
      const dir = path.dirname(options.output);
      fs.mkdirSync(dir, { recursive: true });
      
      // Write the task to file
      fs.writeFileSync(options.output, taskJson);
      console.log(`Task generated and saved to ${options.output}`);
    } catch (error) {
      console.error(`Error writing to file: ${error}`);
      process.exit(1);
    }
  } else {
    // Output to stdout
    console.log(taskJson);
  }
}

/**
 * Generate all tasks for a category
 * @param options Command options
 */
async function generateCategoryTasks(options: any) {
  const factory = new TaskFactory();
  const validator = new TaskValidator();
  
  // Validate category
  if (!CATEGORY_TEMPLATES[options.category]) {
    console.error(`Error: Category '${options.category}' not found`);
    process.exit(1);
  }
  
  // Ensure output directory exists
  try {
    fs.mkdirSync(options.output, { recursive: true });
  } catch (error) {
    console.error(`Error creating output directory: ${error}`);
    process.exit(1);
  }
  
  // Generate tasks for each transformation
  const results = [];
  // Extract transformation types from the templates
  const transformationTypes = TRANSFORMATION_TEMPLATES.map(template => template.type);
  
  for (const transformationType of transformationTypes) {
    console.log(`Generating ${options.category} × ${transformationType}...`);
    
    const task = factory.generateTask(options.category, transformationType, {
      difficulty: options.difficulty
    });
    
    if (!task) {
      console.error(`Error: Failed to generate task for ${transformationType}`);
      continue;
    }
    
    // Validate the task
    const validationResult = validator.validateTask(task);
    if (!validationResult.isValid) {
      console.error(`Error: Generated task for ${transformationType} is invalid:`);
      validationResult.errors.forEach(error => console.error(`  - ${error}`));
      continue;
    }
    
    // Save the task
    const filename = `${task.id}.json`;
    const filePath = path.join(options.output, filename);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(task, null, 2));
      console.log(`  ✓ Saved to ${filename}`);
      results.push({ id: task.id, status: 'success' });
    } catch (error) {
      console.error(`  ✗ Error writing to file: ${error}`);
      results.push({ id: task.id, status: 'error', message: String(error) });
    }
  }
  
  // Output summary
  console.log('\nGeneration summary:');
  console.log(`  Total: ${results.length}`);
  console.log(`  Success: ${results.filter(r => r.status === 'success').length}`);
  console.log(`  Failed: ${results.filter(r => r.status === 'error').length}`);
  console.log(`\nTasks saved to ${options.output}`);
}

/**
 * Generate all tasks (all categories x all transformations)
 * @param options Command options
 */
async function generateAllTasks(options: any) {
  const factory = new TaskFactory();
  const validator = new TaskValidator();
  
  // Ensure output directory exists
  try {
    fs.mkdirSync(options.output, { recursive: true });
  } catch (error) {
    console.error(`Error creating output directory: ${error}`);
    process.exit(1);
  }
  
  // Generate tasks for each category and transformation
  const results = [];
  for (const categoryCode of Object.keys(CATEGORY_TEMPLATES)) {
    // Extract transformation types from the templates
    const transformationTypes = TRANSFORMATION_TEMPLATES.map(template => template.type);
    
    for (const transformationType of transformationTypes) {
      console.log(`Generating ${categoryCode} × ${transformationType}...`);
      
      const task = factory.generateTask(categoryCode, transformationType, {
        difficulty: options.difficulty
      });
      
      if (!task) {
        console.error(`Error: Failed to generate task for ${categoryCode} × ${transformationType}`);
        continue;
      }
      
      // Validate the task
      const validationResult = validator.validateTask(task);
      if (!validationResult.isValid) {
        console.error(`Error: Generated task for ${categoryCode} × ${transformationType} is invalid:`);
        validationResult.errors.forEach(error => console.error(`  - ${error}`));
        continue;
      }
      
      // Save the task
      const filename = `${task.id}.json`;
      const filePath = path.join(options.output, filename);
      
      try {
        fs.writeFileSync(filePath, JSON.stringify(task, null, 2));
        console.log(`  ✓ Saved to ${filename}`);
        results.push({ id: task.id, status: 'success' });
      } catch (error) {
        console.error(`  ✗ Error writing to file: ${error}`);
        results.push({ id: task.id, status: 'error', message: String(error) });
      }
    }
  }
  
  // Output summary
  console.log('\nGeneration summary:');
  console.log(`  Total: ${results.length}`);
  console.log(`  Success: ${results.filter(r => r.status === 'success').length}`);
  console.log(`  Failed: ${results.filter(r => r.status === 'error').length}`);
  console.log(`\nTasks saved to ${options.output}`);
}

/**
 * List available categories and transformations
 */
function listAvailableOptions() {
  console.log('Available categories:');
  Object.keys(CATEGORY_TEMPLATES).forEach(code => {
    const category = CATEGORY_TEMPLATES[code];
    console.log(`  ${code}: ${category.categoryName} (${category.emojiSet})`);
  });
  
  console.log('\nAvailable Transformations:');
  TRANSFORMATION_TEMPLATES.forEach((template) => {
    const type: string = template.type;
    const transformation = getTransformationByType(type);
    if (transformation) {
      console.log(`  ${type}: ${transformation.name} (${transformation.difficulty})`);
    } else {
      console.log(`  ${type}`);
    }
  });
}

// Parse command line arguments
program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
