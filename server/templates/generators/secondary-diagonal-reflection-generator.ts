/**
 * Secondary Diagonal Reflection grid generator for SFMC puzzles
 * 
 * This generator creates grid pairs where the output is a reflection across
 * the secondary diagonal (top-right to bottom-left) of the input grid.
 * 
 * @author Cascade
 */

import { ExamplePair } from "../task.interface";
import { GridGenerator } from "./base-generator";

/**
 * Generates and validates secondary diagonal reflection transformations
 * The output grid is a reflection across the secondary diagonal (top-right to bottom-left) of the input grid
 */
export class SecondaryDiagonalReflectionGenerator extends GridGenerator {
  /**
   * Generate example pairs for secondary diagonal reflection
   * @param size Grid size (2-4)
   * @param count Number of examples to generate
   * @returns Array of input/output grid pairs
   */
  generateExamples(size: number, count: number): ExamplePair[] {
    const examples: ExamplePair[] = [];
    
    for (let i = 0; i < count; i++) {
      const input = this.createRandomGrid(size);
      const output = this.applySecondaryDiagonalReflection(input);
      
      examples.push({ input, output });
    }
    
    return examples;
  }

  /**
   * Generate a test case for secondary diagonal reflection
   * @param size Grid size (2-4)
   * @returns Single input/output grid pair
   */
  generateTestCase(size: number): ExamplePair {
    const input = this.createRandomGrid(size);
    const output = this.applySecondaryDiagonalReflection(input);
    
    return { input, output };
  }

  /**
   * Validate that the output grid is a correct secondary diagonal reflection of the input
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
        // For secondary diagonal reflection, output[i][j] should equal input[size-1-j][size-1-i]
        if (output[i][j] !== input[size - 1 - j][size - 1 - i]) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Apply secondary diagonal reflection transformation to a grid
   * @param grid Input grid
   * @returns New grid with secondary diagonal reflection applied
   */
  private applySecondaryDiagonalReflection(grid: number[][]): number[][] {
    const size = grid.length;
    const result = this.copyGrid(grid);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        result[i][j] = grid[size - 1 - j][size - 1 - i];
      }
    }
    
    return result;
  }
}
