/**
 * Vertical Reflection grid generator for SFMC puzzles
 * 
 * This generator creates grid pairs where the output is a vertical (top-to-bottom)
 * reflection of the input grid.
 * 
 * @author Cascade
 */

import { ExamplePair } from "../task.interface";
import { GridGenerator } from "./base-generator";

/**
 * Generates and validates vertical reflection transformations
 * The output grid is a vertical reflection (top-to-bottom mirror) of the input grid
 */
export class VerticalReflectionGenerator extends GridGenerator {
  /**
   * Generate example pairs for vertical reflection
   * @param size Grid size (2-4)
   * @param count Number of examples to generate
   * @returns Array of input/output grid pairs
   */
  generateExamples(size: number, count: number): ExamplePair[] {
    const examples: ExamplePair[] = [];
    
    for (let i = 0; i < count; i++) {
      const input = this.createRandomGrid(size);
      const output = this.applyVerticalReflection(input);
      
      examples.push({ input, output });
    }
    
    return examples;
  }

  /**
   * Generate a test case for vertical reflection
   * @param size Grid size (2-4)
   * @returns Single input/output grid pair
   */
  generateTestCase(size: number): ExamplePair {
    const input = this.createRandomGrid(size);
    const output = this.applyVerticalReflection(input);
    
    return { input, output };
  }

  /**
   * Validate that the output grid is a correct vertical reflection of the input
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
        // For vertical reflection, output[i][j] should equal input[size-1-i][j]
        if (output[i][j] !== input[size - 1 - i][j]) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Apply vertical reflection transformation to a grid
   * @param grid Input grid
   * @returns New grid with vertical reflection applied
   */
  private applyVerticalReflection(grid: number[][]): number[][] {
    const size = grid.length;
    const result = this.copyGrid(grid);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        result[i][j] = grid[size - 1 - i][j];
      }
    }
    
    return result;
  }
}
