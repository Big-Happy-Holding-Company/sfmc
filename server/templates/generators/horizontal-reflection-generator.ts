/**
 * Horizontal Reflection grid generator for SFMC puzzles
 * 
 * This generator creates grid pairs where the output is a horizontal (left-to-right)
 * reflection of the input grid.
 * 
 * @author Cascade
 */

import { ExamplePair } from "../task.interface";
import { GridGenerator } from "./base-generator";

/**
 * Generates and validates horizontal reflection transformations
 * The output grid is a horizontal reflection (left-to-right mirror) of the input grid
 */
export class HorizontalReflectionGenerator extends GridGenerator {
  /**
   * Generate example pairs for horizontal reflection
   * @param size Grid size (2-4)
   * @param count Number of examples to generate
   * @returns Array of input/output grid pairs
   */
  generateExamples(size: number, count: number): ExamplePair[] {
    const examples: ExamplePair[] = [];
    
    for (let i = 0; i < count; i++) {
      const input = this.createRandomGrid(size);
      const output = this.applyHorizontalReflection(input);
      
      examples.push({ input, output });
    }
    
    return examples;
  }

  /**
   * Generate a test case for horizontal reflection
   * @param size Grid size (2-4)
   * @returns Single input/output grid pair
   */
  generateTestCase(size: number): ExamplePair {
    const input = this.createRandomGrid(size);
    const output = this.applyHorizontalReflection(input);
    
    return { input, output };
  }

  /**
   * Validate that the output grid is a correct horizontal reflection of the input
   * @param input Input grid
   * @param output Output grid
   * @returns true if transformation is valid, false otherwise
   */
  validateTransformation(input: number[][], output: number[][]): boolean {
    if (!input || !output) return false;
    if (input.length !== output.length) return false;
    
    const size = input.length;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // For horizontal reflection, output[i][j] should equal input[i][size-1-j]
        if (output[i][j] !== input[i][size - 1 - j]) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Apply horizontal reflection transformation to a grid
   * @param grid Input grid
   * @returns New grid with horizontal reflection applied
   */
  private applyHorizontalReflection(grid: number[][]): number[][] {
    const size = grid.length;
    const result = this.copyGrid(grid);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        result[i][j] = grid[i][size - 1 - j];
      }
    }
    
    return result;
  }
}
