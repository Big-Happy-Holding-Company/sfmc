/**
 * Validation logic for task definitions
 * 
 * This file provides validation utilities to ensure generated tasks meet all 
 * requirements and contain valid transformations.
 * 
 * @author Cascade
 */

import { TaskDefinition } from "./task.interface";
import { getGridGenerator } from "./generators";
import { getTransformationByType } from "./transformations";
import { SPACE_EMOJIS, EmojiSet } from "../../client/src/constants/spaceEmojis";

/**
 * Result of a task validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * TaskValidator provides methods to validate task definitions
 * to ensure they meet all requirements before being used in the game
 */
export class TaskValidator {
  /**
   * Validate a complete task definition
   * @param task Task definition to validate
   * @returns Validation result with status and any error messages
   */
  validateTask(task: TaskDefinition): ValidationResult {
    const schemaErrors = this.getSchemaErrors(task);
    const logicErrors = this.getLogicErrors(task);
    const errors = [...schemaErrors, ...logicErrors];
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a task passes schema validation
   * @param task Task to validate
   * @returns true if the task schema is valid
   */
  private validateSchema(task: TaskDefinition): boolean {
    return this.getSchemaErrors(task).length === 0;
  }

  /**
   * Check if a task passes logical validation
   * @param task Task to validate
   * @returns true if the task logic is valid
   */
  private validateLogic(task: TaskDefinition): boolean {
    return this.getLogicErrors(task).length === 0;
  }

  /**
   * Get all schema-related errors for a task
   * @param task Task to validate
   * @returns Array of error messages
   */
  private getSchemaErrors(task: TaskDefinition): string[] {
    const errors: string[] = [];
    
    // Check required fields
    if (!task.id) errors.push("Task ID is required");
    if (!task.title) errors.push("Title is required");
    if (!task.description) errors.push("Description is required");
    if (!task.category) errors.push("Category is required");
    if (!task.difficulty) errors.push("Difficulty is required");
    if (task.gridSize === undefined) errors.push("Grid size is required");
    if (task.basePoints === undefined) errors.push("Base points are required");
    if (task.requiredRankLevel === undefined) errors.push("Required rank level is required");
    if (!task.emojiSet) errors.push("Emoji set is required");
    if (!task.examples) errors.push("Examples are required");
    if (!task.testInput) errors.push("Test input is required");
    if (!task.testOutput) errors.push("Test output is required");
    if (!task.hints) errors.push("Hints are required");
    
    // Check ID format (e.g., "COM-123")
    if (task.id && !/^[A-Z]{2,3}-\d{3}$/.test(task.id)) {
      errors.push(`Task ID format invalid: ${task.id} (should be like "COM-123")`); 
    }
    
    // Check difficulty values
    if (task.difficulty && !["Basic", "Intermediate", "Advanced"].includes(task.difficulty)) {
      errors.push(`Invalid difficulty: ${task.difficulty}`);
    }
    
    // Check grid size (2-4)
    if (task.gridSize !== undefined && (task.gridSize < 2 || task.gridSize > 4)) {
      errors.push(`Invalid grid size: ${task.gridSize} (should be 2-4)`); 
    }
    
    // Check emoji set exists
    if (task.emojiSet && !this.isValidEmojiSet(task.emojiSet as EmojiSet)) {
      errors.push(`Invalid emoji set: ${task.emojiSet}`);
    }
    
    // Check examples (at least 2)
    if (task.examples && task.examples.length < 2) {
      errors.push(`Not enough examples: ${task.examples.length} (minimum 2)`); 
    }
    
    // Check hints (exactly 3)
    if (task.hints && task.hints.length !== 3) {
      errors.push(`Invalid number of hints: ${task.hints.length} (should be 3)`); 
    }
    
    return errors;
  }

  /**
   * Get all logic-related errors for a task
   * @param task Task to validate
   * @returns Array of error messages
   */
  private getLogicErrors(task: TaskDefinition): string[] {
    const errors: string[] = [];
    
    // Check grid values are within valid range (0-9)
    this.validateGridValues(task.testInput, "Test input", errors);
    this.validateGridValues(task.testOutput, "Test output", errors);
    
    if (task.examples) {
      task.examples.forEach((example, i) => {
        this.validateGridValues(example.input, `Example ${i+1} input`, errors);
        this.validateGridValues(example.output, `Example ${i+1} output`, errors);
      });
    }
    
    // Check grid dimensions match the specified size
    if (task.gridSize) {
      this.validateGridSize(task.testInput, task.gridSize, `Test input`, errors);
      
      // For Object Counting, the output grid can have different dimensions
      if (!task.id.startsWith("OBJ-")) {
        this.validateGridSize(task.testOutput, task.gridSize, `Test output`, errors);
      }
      
      if (task.examples) {
        task.examples.forEach((example, i) => {
          this.validateGridSize(example.input, task.gridSize, `Example ${i+1} input`, errors);
          
          // For Object Counting, the output grid can have different dimensions
          if (!task.id.startsWith("OBJ-")) {
            this.validateGridSize(example.output, task.gridSize, `Example ${i+1} output`, errors);
          }
        });
      }
    }
    
    // Validate that the transformation logic is correct
    this.validateTransformationLogic(task, errors);
    
    return errors;
  }

  /**
   * Validate that a grid's values are within the valid range (0-9)
   * @param grid Grid to validate
   * @param label Label for error messages
   * @param errors Array to add error messages to
   */
  private validateGridValues(grid: number[][], label: string, errors: string[]): void {
    if (!grid) return;
    
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        const value = grid[i][j];
        if (value < 0 || value > 9 || !Number.isInteger(value)) {
          errors.push(`${label} contains invalid value at [${i},${j}]: ${value} (should be integer 0-9)`);
        }
      }
    }
  }

  /**
   * Validate that a grid's dimensions match the expected size
   * @param grid Grid to validate
   * @param expectedSize Expected grid size
   * @param label Label for error messages
   * @param errors Array to add error messages to
   */
  private validateGridSize(grid: number[][], expectedSize: number, label: string, errors: string[]): void {
    if (!grid) return;
    
    if (grid.length !== expectedSize) {
      errors.push(`${label} has wrong number of rows: ${grid.length} (expected ${expectedSize})`);
    } else {
      for (let i = 0; i < grid.length; i++) {
        if (grid[i].length !== expectedSize) {
          errors.push(`${label} row ${i} has wrong length: ${grid[i].length} (expected ${expectedSize})`);
        }
      }
    }
  }

  /**
   * Validate that the transformation logic is correctly applied
   * @param task Task to validate
   * @param errors Array to add error messages to
   */
  private validateTransformationLogic(task: TaskDefinition, errors: string[]): void {
    // Prefer explicit transformationType if present; otherwise infer from ID
    const transformationType = task.transformationType || this.inferTransformationType(task.id);
    if (!transformationType) {
      errors.push(`Could not infer transformation type from task ID: ${task.id}`);
      return;
    }
    
    // Get the corresponding grid generator
    const transformation = getTransformationByType(transformationType);
    if (!transformation) {
      errors.push(`Unknown transformation type: ${transformationType}`);
      return;
    }
    
    const generator = getGridGenerator(transformation.gridGenerator);
    if (!generator) {
      errors.push(`Grid generator not found for transformation: ${transformation.gridGenerator}`);
      return;
    }
    
    // Validate test case
    if (!generator.validateTransformation(task.testInput, task.testOutput)) {
      errors.push(`Test case does not follow the ${transformationType} transformation pattern`);
    }
    
    // Validate examples
    if (task.examples) {
      task.examples.forEach((example, i) => {
        if (!generator.validateTransformation(example.input, example.output)) {
          errors.push(`Example ${i+1} does not follow the ${transformationType} transformation pattern`);
        }
      });
    }
  }

  /**
   * Infer the transformation type from a task ID
   * @param taskId Task ID (e.g., "HOR-123")
   * @returns Transformation type or undefined if not found
   */
  private inferTransformationType(taskId: string): string | undefined {
    // Extract transformation type from the task ID parameter, if provided
    const parts = taskId.split('-');
    const categoryPrefix = parts[0];
    const taskNumber = parseInt(parts[1]);
    
    // For sequentially numbered tasks (100+), use the transformation type passed directly
    // This approach is needed because the new sequential numbering system doesn't encode the transformation
    if (taskNumber >= 100) {
      // Since the task ID no longer encodes the transformation, we need to check if the task has a specific transformation
      // For now, we'll use the default transformation mapping based on category
      if (categoryPrefix === "COM") return "horizontal_reflection";
      if (categoryPrefix === "NAV") return "rotation_90deg";
      if (categoryPrefix === "SEC") return "xor_operation";
      if (categoryPrefix === "PL") return "pattern_completion";
      if (categoryPrefix === "OS") return "xor_operation"; // Change from object_counting to xor_operation for OS tasks
      if (categoryPrefix === "FS") return "rotation_90deg";
      if (categoryPrefix === "PWR") return "pattern_completion";
    }
    
    // Legacy implementation for reference tasks (001-099)
    // Return a default transformation for each category (for backwards compatibility)
    if (categoryPrefix === "COM") return "horizontal_reflection";
    if (categoryPrefix === "NAV") return "rotation_90deg";
    if (categoryPrefix === "SEC") return "xor_operation";
    if (categoryPrefix === "PL") return "pattern_completion";
    if (categoryPrefix === "OS") return "object_counting"; // Keep the original mapping for reference tasks
    if (categoryPrefix === "FS") return "rotation_90deg";
    if (categoryPrefix === "PWR") return "pattern_completion";
    
    return undefined;
  }

  /**
   * Check if an emoji set is valid
   * @param emojiSet Emoji set name
   * @returns true if the emoji set exists
   */
  private isValidEmojiSet(emojiSet: EmojiSet): boolean {
    return emojiSet in SPACE_EMOJIS;
  }
}

