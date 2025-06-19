/**
 * Command-line tool for testing tasks
 * 
 * This CLI tool validates and tests task definitions to ensure they meet
 * all requirements and logical constraints.
 * 
 * @author Cascade
 */

import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import { TaskValidator } from '../templates/validators';
import { TaskDefinition } from '../templates/task.interface';
import { TestRunner, TestRunnerOptions } from '../tools/test-runner';

// Set up the command line interface
program
  .name('test-tasks')
  .description('Test and validate SFMC puzzle tasks')
  .version('1.0.0');

// Command to test a single task file
program
  .command('file')
  .description('Test a single task file')
  .requiredOption('-f, --file <path>', 'Path to the task JSON file')
  .option('--additional-tests', 'Generate additional test cases', false)
  .option('--fail-fast', 'Stop on first error', false)
  .option('--performance', 'Collect performance metrics', false)
  .action(testSingleFile);

// Command to test all tasks in a directory
program
  .command('directory')
  .description('Test all task files in a directory')
  .requiredOption('-d, --directory <path>', 'Directory containing task JSON files')
  .option('--recursive', 'Recursively search subdirectories', false)
  .option('--additional-tests', 'Generate additional test cases', false)
  .option('--fail-fast', 'Stop on first error', false)
  .option('--performance', 'Collect performance metrics', false)
  .action(testDirectory);

/**
 * Test a single task file
 * @param options Command options
 */
async function testSingleFile(options: any) {
  const testRunnerOptions: TestRunnerOptions = {
    generateAdditionalTestCases: options.additionalTests,
    additionalTestCasesCount: 3,
    collectPerformanceMetrics: options.performance,
    failFast: options.failFast
  };
  
  const testRunner = new TestRunner(testRunnerOptions);
  
  try {
    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    
    // Read and parse the task file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const task = JSON.parse(fileContent) as TaskDefinition;
    
    console.log(`Testing task ${task.id} (${filePath})...`);
    
    // Run the tests
    const testResult = testRunner.testTask(task);
    
    // Display the results
    if (testResult.passed) {
      console.log(`✓ Task ${task.id} passed all tests`);
    } else {
      console.error(`✗ Task ${task.id} failed tests`);
      console.error('Errors:');
      testResult.errorMessages.forEach(error => console.error(`  - ${error}`));
    }
    
    // Display performance metrics if collected
    if (testResult.performanceMetrics) {
      console.log('\nPerformance metrics:');
      console.log(`  Execution time: ${testResult.performanceMetrics.executionTime.toFixed(2)}ms`);
      console.log(`  Memory usage: ${(testResult.performanceMetrics.memoryUsage / 1024).toFixed(2)}KB`);
    }
    
    // Exit with appropriate status
    process.exit(testResult.passed ? 0 : 1);
  } catch (error) {
    console.error(`Error processing file: ${error}`);
    process.exit(1);
  }
}

/**
 * Test all task files in a directory
 * @param options Command options
 */
async function testDirectory(options: any) {
  const testRunnerOptions: TestRunnerOptions = {
    generateAdditionalTestCases: options.additionalTests,
    additionalTestCasesCount: 3,
    collectPerformanceMetrics: options.performance,
    failFast: options.failFast
  };
  
  const testRunner = new TestRunner(testRunnerOptions);
  const validator = new TaskValidator();
  
  try {
    const dirPath = path.resolve(options.directory);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      console.error(`Error: Directory not found: ${dirPath}`);
      process.exit(1);
    }
    
    // Find all JSON files in the directory
    const files = findJsonFiles(dirPath, options.recursive);
    if (files.length === 0) {
      console.error(`No JSON files found in ${dirPath}`);
      process.exit(1);
    }
    
    console.log(`Found ${files.length} task files to test`);
    
    // Test each file
    const results = [];
    for (const file of files) {
      try {
        // Read and parse the task file
        const fileContent = fs.readFileSync(file, 'utf-8');
        const task = JSON.parse(fileContent) as TaskDefinition;
        
        console.log(`Testing task ${task.id} (${path.relative(dirPath, file)})...`);
        
        // Run schema validation first
        const validationResult = validator.validateTask(task);
        if (!validationResult.isValid) {
          console.error(`✗ Task ${task.id} failed schema validation:`);
          validationResult.errors.forEach(error => console.error(`  - ${error}`));
          results.push({ id: task.id, status: 'failed', errors: validationResult.errors });
          continue;
        }
        
        // Run full test
        const testResult = testRunner.testTask(task);
        
        if (testResult.passed) {
          console.log(`✓ Task ${task.id} passed all tests`);
          results.push({ id: task.id, status: 'passed' });
        } else {
          console.error(`✗ Task ${task.id} failed tests:`);
          testResult.errorMessages.forEach(error => console.error(`  - ${error}`));
          results.push({ id: task.id, status: 'failed', errors: testResult.errorMessages });
        }
      } catch (error) {
        console.error(`Error processing file ${file}: ${error}`);
        results.push({ 
          id: path.basename(file, '.json'), 
          status: 'error', 
          errors: [`Error processing file: ${error}`] 
        });
      }
    }
    
    // Output summary
    console.log('\nTest summary:');
    console.log(`  Total: ${results.length}`);
    console.log(`  Passed: ${results.filter(r => r.status === 'passed').length}`);
    console.log(`  Failed: ${results.filter(r => r.status === 'failed').length}`);
    console.log(`  Errors: ${results.filter(r => r.status === 'error').length}`);
    
    // Exit with appropriate status
    const allPassed = results.every(r => r.status === 'passed');
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

/**
 * Find all JSON files in a directory
 * @param directory Directory to search
 * @param recursive Whether to search subdirectories
 * @returns Array of file paths
 */
function findJsonFiles(directory: string, recursive: boolean): string[] {
  const files: string[] = [];
  
  const items = fs.readdirSync(directory);
  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isFile() && path.extname(item).toLowerCase() === '.json') {
      files.push(itemPath);
    } else if (recursive && stats.isDirectory()) {
      files.push(...findJsonFiles(itemPath, recursive));
    }
  }
  
  return files;
}

// Parse command line arguments
program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
