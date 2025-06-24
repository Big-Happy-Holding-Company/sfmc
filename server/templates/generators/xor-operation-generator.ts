/** THIS IS INCORRECT AND WILL BE REPLACED
 * XOR Operation grid generator for SFMC puzzles
 * 
 * This generator creates grid pairs where the output is the result of applying
 * XOR operations to adjacent cells in each row of the input grid.
 * 
 * @author Cascade
 */

import { ExamplePair } from "../task.interface";
import { GridGenerator } from "./base-generator";

/**
 * Generates and validates XOR operation transformations
 * The output grid contains the results of XOR operations on adjacent cells
 */
export class XorOperationGenerator extends GridGenerator {
  /**
   * Generate example pairs for XOR operations
   * @param size Grid size (2-4)
   * @param count Number of examples to generate
   * @returns Array of input/output grid pairs
   */
  generateExamples(size: number, count: number): ExamplePair[] {
    const examples: ExamplePair[] = [];
    
    for (let i = 0; i < count; i++) {
      // Use smaller values for simpler XOR results (0-4)
      const input = Array(size).fill(0).map(() => 
        Array(size).fill(0).map(() => Math.floor(Math.random() * 5))
      );
      const output = this.applyXorOperation(input);
      
      examples.push({ input, output });
    }
    
    return examples;
  }

  /**
   * Generate a test case for XOR operation
   * @param size Grid size (2-4)
   * @returns Single input/output grid pair
   */
  generateTestCase(size: number): ExamplePair {
    // Use smaller values for simpler XOR results (0-4)
    const input = Array(size).fill(0).map(() => 
      Array(size).fill(0).map(() => Math.floor(Math.random() * 5))
    );
    const output = this.applyXorOperation(input);
    
    return { input, output };
  }

  /**
   * Validate that the output grid correctly applies XOR operations to the input
   * @param input Input grid
   * @param output Output grid
   * @returns true if transformation is valid, false otherwise
   */
  validateTransformation(input: number[][], output: number[][]): boolean {
    if (!input || !output) return false;
    if (input.length !== output.length) return false;
    
    const size = input.length;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - 1; j++) {
        // For XOR operation, output[i][j] should be input[i][j] XOR input[i][j+1]
        // We use our simplified XOR operation
        const xorResult = this.simpleXor(input[i][j], input[i][j+1]);
        if (output[i][j] !== xorResult) {
          return false;
        }
      }
      // Last column in output is determined differently
      if (output[i][size-1] !== input[i][size-1]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Apply XOR operation to a grid
   * @param grid Input grid
   * @returns New grid with XOR operations applied
   */
  private applyXorOperation(grid: number[][]): number[][] {
    const size = grid.length;
    const result = Array(size).fill(0).map(() => Array(size).fill(0));
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - 1; j++) {
        // Each cell is the XOR of current and next cell in the input row
        result[i][j] = this.simpleXor(grid[i][j], grid[i][j+1]);
      }
      // Last column carries over the value from input
      result[i][size-1] = grid[i][size-1];
    }
    
    return result;
  }

  /**
   * Simplified XOR operation for puzzle generation
   * Makes the result more intuitive for players:
   * - If a and b are the same, result is 0
   * - If a and b are different, result is their sum (bounded to 0-9)
   * 
   * @param a First value
   * @param b Second value
   * @returns Simplified XOR result
   */
  private simpleXor(a: number, b: number): number {
    if (a === b) {
      return 0; // Same values result in 0
    } else {
      // Different values result in their sum, bounded to 0-9
      return Math.min(a + b, 9);
    }
  }
}
