/**
 * Testing utilities for SFMC puzzle tasks
 * 
 * This file provides tools for testing generated tasks, validating transformations,
 * and analyzing difficulty levels.
 * 
 * @author Cascade
 */

/**
 * Test runner for generated tasks
 * 
 * This file provides utilities for testing generated tasks against various
 * test cases to ensure they are working properly.
 * 
 * @author Cascade
 */

import { TaskDefinition, ExamplePair } from '../templates/task.interface';
import { TaskValidator, ValidationResult } from '../templates/validators';
import { getGridGenerator } from '../templates/generators';
import { getTransformationByType } from '../templates/transformations';

/**
 * Result of a task test run
 */
export interface TestResult {
  taskId: string;
  passed: boolean;
  validationResult: ValidationResult;
  examplesVerified: boolean;
  testCasesVerified: boolean;
  errorMessages: string[];
  performanceMetrics?: {
    executionTime: number;
    memoryUsage: number;
  };
}

/**
 * Options for test runner
 */
export interface TestRunnerOptions {
  /** Whether to generate additional test cases beyond those in the task */
  generateAdditionalTestCases?: boolean;
  /** Number of additional test cases to generate */
  additionalTestCasesCount?: number;
  /** Whether to collect performance metrics */
  collectPerformanceMetrics?: boolean;
  /** Whether to fail on first error */
  failFast?: boolean;
}

/**
 * TestRunner provides methods for running automated tests
 * on generated tasks to ensure quality and correctness
 */
export class TestRunner {
  private validator: TaskValidator;
  private options: TestRunnerOptions;

  /**
   * Create a new TestRunner instance
   * @param options Test runner options
   */
  constructor(options: TestRunnerOptions = {}) {
    this.validator = new TaskValidator();
    this.options = {
      generateAdditionalTestCases: options.generateAdditionalTestCases || false,
      additionalTestCasesCount: options.additionalTestCasesCount || 3,
      collectPerformanceMetrics: options.collectPerformanceMetrics || false,
      failFast: options.failFast || false
    };
  }

  /**
   * Run tests on a task definition
   * @param task Task to test
   * @returns Test result
   */
  testTask(task: TaskDefinition): TestResult {
    const errors: string[] = [];
    const startTime = this.options.collectPerformanceMetrics ? performance.now() : 0;
    const startMemory = this.options.collectPerformanceMetrics ? this.getMemoryUsage() : 0;
    
    // First, validate the task schema and logic
    const validationResult = this.validator.validateTask(task);
    
    let examplesVerified = false;
    let testCasesVerified = false;
    
    if (validationResult.isValid) {
      // Verify that the examples follow the transformation pattern
      examplesVerified = this.verifyExamples(task, errors);
      
      // Verify that the test case follows the transformation pattern
      testCasesVerified = this.verifyTestCase(task, errors);
      
      // Generate and verify additional test cases if configured
      if (this.options.generateAdditionalTestCases) {
        this.verifyAdditionalTestCases(task, errors);
      }
    } else {
      errors.push(...validationResult.errors);
    }
    
    // Calculate performance metrics if enabled
    let performanceMetrics;
    if (this.options.collectPerformanceMetrics) {
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      
      performanceMetrics = {
        executionTime: endTime - startTime,
        memoryUsage: endMemory - startMemory
      };
    }
    
    const passed = validationResult.isValid && examplesVerified && testCasesVerified && errors.length === 0;
    
    return {
      taskId: task.id,
      passed,
      validationResult,
      examplesVerified,
      testCasesVerified,
      errorMessages: errors,
      performanceMetrics
    };
  }

  /**
   * Verify that the examples in a task follow the transformation pattern
   * @param task Task to verify
   * @param errors Array to add error messages to
   * @returns true if all examples verified successfully
   */
  private verifyExamples(task: TaskDefinition, errors: string[]): boolean {
    if (!task.examples || task.examples.length === 0) {
      errors.push("No examples to verify");
      return false;
    }
    
    // Get the grid generator for this task's transformation
    const transformationType = this.inferTransformationType(task.id);
    if (!transformationType) {
      errors.push(`Could not infer transformation type for task ${task.id}`);
      return false;
    }
    
    const transformation = getTransformationByType(transformationType);
    if (!transformation) {
      errors.push(`Transformation not found: ${transformationType}`);
      return false;
    }
    
    const generator = getGridGenerator(transformation.gridGenerator);
    if (!generator) {
      errors.push(`Generator not found: ${transformation.gridGenerator}`);
      return false;
    }
    
    // Verify each example
    let allValid = true;
    
    for (let i = 0; i < task.examples.length; i++) {
      const example = task.examples[i];
      
      if (!generator.validateTransformation(example.input, example.output)) {
        errors.push(`Example ${i+1} failed validation for ${transformationType} transformation`);
        allValid = false;
        
        if (this.options.failFast) {
          return false;
        }
      }
    }
    
    return allValid;
  }

  /**
   * Verify that the test case in a task follows the transformation pattern
   * @param task Task to verify
   * @param errors Array to add error messages to
   * @returns true if the test case verified successfully
   */
  private verifyTestCase(task: TaskDefinition, errors: string[]): boolean {
    if (!task.testInput || !task.testOutput) {
      errors.push("Test case input or output is missing");
      return false;
    }
    
    // Get the grid generator for this task's transformation
    const transformationType = this.inferTransformationType(task.id);
    if (!transformationType) {
      errors.push(`Could not infer transformation type for task ${task.id}`);
      return false;
    }
    
    const transformation = getTransformationByType(transformationType);
    if (!transformation) {
      errors.push(`Transformation not found: ${transformationType}`);
      return false;
    }
    
    const generator = getGridGenerator(transformation.gridGenerator);
    if (!generator) {
      errors.push(`Generator not found: ${transformation.gridGenerator}`);
      return false;
    }
    
    // Verify the test case
    if (!generator.validateTransformation(task.testInput, task.testOutput)) {
      errors.push(`Test case failed validation for ${transformationType} transformation`);
      return false;
    }
    
    return true;
  }

  /**
   * Generate and verify additional test cases for a task
   * @param task Task to verify
   * @param errors Array to add error messages to
   * @returns true if all additional test cases verified successfully
   */
  private verifyAdditionalTestCases(task: TaskDefinition, errors: string[]): boolean {
    // Get the grid generator for this task's transformation
    const transformationType = this.inferTransformationType(task.id);
    if (!transformationType) {
      errors.push(`Could not infer transformation type for task ${task.id}`);
      return false;
    }
    
    const transformation = getTransformationByType(transformationType);
    if (!transformation) {
      errors.push(`Transformation not found: ${transformationType}`);
      return false;
    }
    
    const generator = getGridGenerator(transformation.gridGenerator);
    if (!generator) {
      errors.push(`Generator not found: ${transformation.gridGenerator}`);
      return false;
    }
    
    // Generate additional test cases
    const additionalCount = this.options.additionalTestCasesCount || 3;
    const additionalTestCases: ExamplePair[] = [];
    
    for (let i = 0; i < additionalCount; i++) {
      additionalTestCases.push(generator.generateTestCase(task.gridSize));
    }
    
    // Verify each additional test case
    let allValid = true;
    
    for (let i = 0; i < additionalTestCases.length; i++) {
      const testCase = additionalTestCases[i];
      
      if (!generator.validateTransformation(testCase.input, testCase.output)) {
        errors.push(`Additional test case ${i+1} failed validation for ${transformationType} transformation`);
        allValid = false;
        
        if (this.options.failFast) {
          return false;
        }
      }
    }
    
    return allValid;
  }

  /**
   * Infer the transformation type from a task ID
   * @param taskId Task ID (e.g., "HOR-123")
   * @returns Transformation type or undefined if not found
   */
  private inferTransformationType(taskId: string): string | undefined {
    // This implementation should match the one in TaskValidator
    // In a real implementation, this would be a shared utility
    
    if (taskId.startsWith("COM-")) return "horizontal_reflection";
    if (taskId.startsWith("NAV-")) return "rotation_90deg";
    if (taskId.startsWith("SEC-")) return "xor_operation";
    if (taskId.startsWith("PL-")) return "pattern_completion";
    if (taskId.startsWith("OS-")) return "object_counting";
    
    return undefined;
  }

  /**
   * Get the current memory usage
   * @returns Memory usage in bytes
   */
  private getMemoryUsage(): number {
    // In a browser environment, we would use performance.memory
    // In Node.js, we would use process.memoryUsage().heapUsed
    
    // This is a placeholder implementation
    // In a real implementation, we would use the appropriate API
    // for the current environment
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed;
      }
      return 0;
    } catch {
      return 0;
    }
  }
}
