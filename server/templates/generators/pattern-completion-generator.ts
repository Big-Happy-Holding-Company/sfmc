/**
 * Pattern Completion grid generator for SFMC puzzles
 * 
 * This generator creates grid pairs where the output completes a pattern
 * from the input grid by filling in logically deduced values.
 * 
 * @author Cascade
 */

import { ExamplePair } from "../task.interface";
import { GridGenerator } from "./base-generator";

/**
 * Generates and validates pattern completion transformations
 * The output grid completes logical patterns from the input grid
 */
export class PatternCompletionGenerator extends GridGenerator {
  /**
   * Generate example pairs for pattern completion
   * @param size Grid size (2-4)
   * @param count Number of examples to generate
   * @returns Array of input/output grid pairs
   */
  generateExamples(size: number, count: number): ExamplePair[] {
    const examples: ExamplePair[] = [];
    
    for (let i = 0; i < count; i++) {
      // For pattern completion, we'll create the output first with a clear pattern
      // Then derive an input that has some values missing
      const { input, output } = this.generatePatternPair(size);
      examples.push({ input, output });
    }
    
    return examples;
  }

  /**
   * Generate a test case for pattern completion
   * @param size Grid size (2-4)
   * @returns Single input/output grid pair
   */
  generateTestCase(size: number): ExamplePair {
    return this.generatePatternPair(size);
  }

  /**
   * Validate that the output grid correctly completes the pattern from the input
   * @param input Input grid
   * @param output Output grid
   * @returns true if transformation is valid, false otherwise
   */
  validateTransformation(input: number[][], output: number[][]): boolean {
    if (!input || !output) return false;
    if (input.length !== output.length) return false;
    
    const size = input.length;
    
    // First check that all non-zero values in input match in output
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // If this is a value that was given in the input (nonzero),
        // it should match exactly in the output
        if (input[i][j] !== 0 && input[i][j] !== output[i][j]) {
          return false;
        }
      }
    }
    
    // Since pattern completion can have various valid solutions,
    // we need to check if the completed pattern follows logical rules
    // This is a simplified version that checks for linear patterns
    
    // Check if each row follows an arithmetic progression
    for (let i = 0; i < size; i++) {
      if (!this.isArithmeticProgression(output[i])) {
        return false;
      }
    }
    
    // Check if each column follows an arithmetic progression
    for (let j = 0; j < size; j++) {
      const column = Array(size).fill(0).map((_, i) => output[i][j]);
      if (!this.isArithmeticProgression(column)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Generate a pattern completion input/output pair
   * @param size Grid size
   * @returns Input and output grids
   */
  private generatePatternPair(size: number): ExamplePair {
    // Create a grid with a clear pattern: increasing values in each row
    const output = Array(size).fill(0).map((_, i) => {
      return Array(size).fill(0).map((_, j) => {
        // Create a simple arithmetic sequence
        return (i + j) % 10; // Modulo to keep values 0-9
      });
    });
    
    // Create input by removing some values (replacing with 0)
    const input = this.copyGrid(output);
    const numToRemove = Math.ceil(size * size / 3); // Remove about 1/3 of the values
    
    let removed = 0;
    while (removed < numToRemove) {
      const i = Math.floor(Math.random() * size);
      const j = Math.floor(Math.random() * size);
      
      if (input[i][j] !== 0) {
        input[i][j] = 0; // Replace with 0 to indicate "missing" value
        removed++;
      }
    }
    
    return { input, output };
  }

  /**
   * Check if an array follows an arithmetic progression (or constant sequence)
   * @param arr Array to check
   * @returns true if the array follows an arithmetic progression
   */
  private isArithmeticProgression(arr: number[]): boolean {
    if (arr.length <= 2) return true;
    
    // If all elements are the same, it's a valid constant sequence
    const allSame = arr.every(val => val === arr[0]);
    if (allSame) return true;
    
    // Check for arithmetic progression
    const diff = arr[1] - arr[0];
    for (let i = 2; i < arr.length; i++) {
      if (arr[i] - arr[i-1] !== diff) {
        return false;
      }
    }
    
    return true;
  }
}
