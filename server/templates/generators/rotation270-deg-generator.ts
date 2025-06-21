/**
 * 270-Degree Rotation grid generator for SFMC puzzles
 *
 * This generator creates grid pairs where the output is a 270-degree clockwise
 * (or 90-degree counter-clockwise) rotation of the input grid.
 *
 * Author: Cascade
 */

import { ExamplePair } from "../task.interface";
import { GridGenerator } from "./base-generator";

/**
 * Generates and validates 270-degree rotation transformations.
 * The output grid is the input grid rotated 270 degrees clockwise.
 */
export class Rotation270DegGenerator extends GridGenerator {
  /**
   * Generate example pairs for 270-degree rotation
   * @param size Grid size (2-4)
   * @param count Number of examples to generate
   * @returns Array of input/output grid pairs
   */
  generateExamples(size: number, count: number): ExamplePair[] {
    const examples: ExamplePair[] = [];

    for (let i = 0; i < count; i++) {
      const input = this.createRandomGrid(size);
      const output = this.applyRotation270Deg(input);
      examples.push({ input, output });
    }

    return examples;
  }

  /**
   * Generate a test case for 270-degree rotation
   * @param size Grid size (2-4)
   */
  generateTestCase(size: number): ExamplePair {
    const input = this.createRandomGrid(size);
    const output = this.applyRotation270Deg(input);
    return { input, output };
  }

  /**
   * Validate that the output grid is a correct 270-degree clockwise rotation of the input
   */
  validateTransformation(input: number[][], output: number[][]): boolean {
    if (!input || !output) return false;
    if (input.length !== output.length) return false;

    const size = input.length;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // For 270° clockwise rotation: output[size-1-j][i] === input[i][j]
        if (output[size - 1 - j][i] !== input[i][j]) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Apply 270-degree clockwise rotation transformation to a grid
   */
  private applyRotation270Deg(grid: number[][]): number[][] {
    const size = grid.length;
    const result: number[][] = Array(size)
      .fill(0)
      .map(() => Array(size).fill(0));

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // 270° clockwise: equivalent to 90° counter-clockwise
        result[size - 1 - j][i] = grid[i][j];
      }
    }

    return result;
  }
}
