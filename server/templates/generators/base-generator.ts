/**
 * Base grid generator for SFMC puzzles
 * 
 * This file provides the abstract base class that all grid generators will extend.
 * It defines common functionality and interfaces for grid generation.
 * 
 * @author Cascade
 */

import { ExamplePair } from "../task.interface";

/**
 * Abstract base class for all grid generators
 * 
 * Each specific transformation type extends this base class to implement
 * its unique grid generation and validation logic.
 */
export abstract class GridGenerator {
  /**
   * Generate a set of example pairs for the transformation
   * @param size Grid size (2-4)
   * @param count Number of examples to generate
   * @returns Array of input/output grid pairs
   */
  abstract generateExamples(size: number, count: number): ExamplePair[];

  /**
   * Generate a test case for the transformation
   * @param size Grid size (2-4)
   * @returns Single input/output grid pair for testing
   */
  abstract generateTestCase(size: number): ExamplePair;

  /**
   * Validate that the output grid correctly reflects the transformation of the input grid
   * @param input Input grid
   * @param output Output grid
   * @returns true if transformation is valid, false otherwise
   */
  abstract validateTransformation(input: number[][], output: number[][]): boolean;

  /**
   * Helper method to create a grid of given size filled with random numbers (0-9)
   * @param size Grid size
   * @returns A size x size grid with random values
   */
  protected createRandomGrid(size: number): number[][] {
    const grid = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        // Generate random number between 0 and 9
        row.push(Math.floor(Math.random() * 10));
      }
      grid.push(row);
    }
    return grid;
  }

  /**
   * Create a deep copy of a grid
   * @param grid Grid to copy
   * @returns New grid with same values
   */
  protected copyGrid(grid: number[][]): number[][] {
    return grid.map(row => [...row]);
  }
}

/**
 * Type for a constructor function that can instantiate a GridGenerator
 */
export type GridGeneratorConstructor = new () => GridGenerator;

/**
 * Grid generator registry to store and retrieve implementations by name
 */
export const GRID_GENERATORS: Record<string, GridGeneratorConstructor> = {};

/**
 * Register a grid generator implementation
 * @param name Generator name
 * @param generatorClass Generator class (must be a concrete class, not abstract)
 */
export function registerGridGenerator(name: string, generatorClass: GridGeneratorConstructor) {
  GRID_GENERATORS[name] = generatorClass;
}

/**
 * Get a grid generator by name
 * @param name Generator name
 * @returns Generator instance or undefined if not found
 */
export function getGridGenerator(name: string): GridGenerator | undefined {
  if (!name || !GRID_GENERATORS[name]) return undefined;
  
  try {
    const GeneratorClass = GRID_GENERATORS[name];
    // Only attempt to instantiate if it's in our registry (and thus a concrete class)
    return new GeneratorClass();
  } catch (error) {
    console.error(`Error creating generator ${name}:`, error);
    return undefined;
  }
}
