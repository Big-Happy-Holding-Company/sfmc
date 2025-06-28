/**
 * Primary Diagonal Reflection grid generator for SFMC puzzles
 * 
 * This generator creates grid pairs where the output is a reflection across
 * the primary diagonal (top-left to bottom-right) of the input grid.
 * 
 * @author Cascade
 */

import { ExamplePair } from "../task.interface";
import { GridGenerator } from "./base-generator";

/**
 * Generates and validates primary diagonal reflection transformations
 * The output grid is a reflection across the primary diagonal (top-left to bottom-right) of the input grid
 */
export class PrimaryDiagonalReflectionGenerator extends GridGenerator {
  /**
   * Generate example pairs for primary diagonal reflection
   * @param size Grid size (2-4)
   * @param count Number of examples to generate
   * @returns Array of input/output grid pairs
   */
  generateExamples(size: number, count: number): ExamplePair[] {
    const examples: ExamplePair[] = [];
    
    for (let i = 0; i < count; i++) {
      const input = this.createRandomGrid(size);
      const output = this.applyPrimaryDiagonalReflection(input);
      
      examples.push({ input, output });
    }
    
    return examples;
  }

  /**
   * Generate a test case for primary diagonal reflection
   * @param size Grid size (2-4)
   * @returns Single input/output grid pair
   */
  generateTestCase(size: number): ExamplePair {
    const input = this.createRandomGrid(size);
    const output = this.applyPrimaryDiagonalReflection(input);
    
    return { input, output };
  }

  /**
   * Validate that the output grid is a correct primary diagonal reflection of the input
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
        // For primary diagonal reflection, output[i][j] should equal input[j][i]
        if (output[i][j] !== input[j][i]) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Apply primary diagonal reflection transformation to a grid
   * @param grid Input grid
   * @returns New grid with primary diagonal reflection applied
   */
  private applyPrimaryDiagonalReflection(grid: number[][]): number[][] {
    const size = grid.length;
    const result = this.copyGrid(grid);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        result[i][j] = grid[j][i];
      }
    }
    
    return result;
  }
}
