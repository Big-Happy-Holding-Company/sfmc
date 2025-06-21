/**
 * Task interface definitions for SFMC puzzles
 * 
 * This file provides the TypeScript interfaces that match the existing database schema.
 * These interfaces are used throughout the templatization system to ensure consistency.
 * 
 * @author Cascade
 */

import { EmojiSet } from "../../client/src/constants/spaceEmojis";

/**
 * Defines a pair of input and output grids used for examples and test cases
 */
export interface ExamplePair {
  input: number[][];
  output: number[][];
}

/**
 * Main task definition interface
 * This matches the structure in the database schema and is used for both
 * manually created and template-generated tasks
 */
export interface TaskDefinition {
  id: string;                    // Format: "COM-101"
  title: string;
  description: string;
  category: string;              // Full category name with emoji
  difficulty: "Basic" | "Intermediate" | "Advanced";
  gridSize: number;              // Usually 2-4
  timeLimit: null;               // Always null per requirements
  basePoints: number;
  requiredRankLevel: number;     // Always 1 per requirements
  emojiSet: EmojiSet;            // Must exist as a set key in spaceEmojis.ts
  examples: ExamplePair[];       // At least 2 examples
  testInput: number[][];         // Test case input grid
  testOutput: number[][];        // Expected output grid
  hints: string[];               // 3 hints as per guidelines
  transformationType?: string;  // Transformation type used for validation
  // Optional metadata flag for generated vs manual
  generated?: boolean;           // true for template-generated tasks
}

/**
 * Options for task generation
 */
export interface TaskOptions {
  difficulty?: "Basic" | "Intermediate" | "Advanced";
  gridSize?: number;
  customHints?: string[];
  domainContext?: string;        // Custom context for description generation
}
