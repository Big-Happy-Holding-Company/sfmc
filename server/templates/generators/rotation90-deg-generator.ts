/**
 * 90-Degree Rotation grid generator for SFMC puzzles
 * 
 * This generator creates grid pairs where the output is a 90-degree clockwise
 * rotation of the input grid.
 * 
 * @author Cascade
 */

import { ExamplePair } from "../task.interface";
import { GridGenerator } from "./base-generator";

/**
 * Generates and validates 90-degree clockwise rotation transformations
 * The output grid is the input grid rotated 90 degrees clockwise
 */
export class Rotation90DegGenerator extends GridGenerator {
  /**
   * Generate example pairs for 90-degree rotation
   * @param size Grid size (2-4)
   * @param count Number of examples to generate
   * @returns Array of input/output grid pairs
   */
  generateExamples(size: number, count: number): ExamplePair[] {
    const examples: ExamplePair[] = [];
    
    for (let i = 0; i < count; i++) {
      const input = this.createRandomGrid(size);
      const output = this.applyRotation90Deg(input);
      
      examples.push({ input, output });
    }
    
    return examples;
  }

  /**
   * Generate a test case for 90-degree rotation
   * @param size Grid size (2-4)
   * @returns Single input/output grid pair
   */
  generateTestCase(size: number): ExamplePair {
    const input = this.createRandomGrid(size);
    const output = this.applyRotation90Deg(input);
    
    return { input, output };
  }

  /**
   * Validate that the output grid is a correct 90-degree clockwise rotation of the input
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
        // For 90-degree clockwise rotation: output[j][size-1-i] should equal input[i][j]
        // or alternatively: output[i][j] should equal input[size-1-j][i]
        if (output[i][j] !== input[size - 1 - j][i]) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Apply 90-degree clockwise rotation transformation to a grid
   * @param grid Input grid
   * @returns New grid with 90-degree rotation applied
   */
  private applyRotation90Deg(grid: number[][]): number[][] {
    const size = grid.length;
    const result: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // In a 90-degree clockwise rotation:
        // - The first row becomes the last column (reading top to bottom)
        // - The second row becomes the second-to-last column
        // - And so on...
        result[j][size - 1 - i] = grid[i][j];
      }
    }
    
    return result;
  }
}
