/**
 * Main generation engine for SFMC puzzles
 * 
 * This file implements the TaskFactory class, which combines category templates
 * and transformation templates to generate fully-formed task definitions.
 * 
 * @author Cascade
 */

import { 
  TaskDefinition, 
  ExamplePair 
} from "../templates/task.interface";
import { 
  CategoryTemplate, 
  CATEGORY_TEMPLATES
} from "../templates/categories";
import { 
  TransformationTemplate,
  getTransformationByType,
  getDomainContext 
} from "../templates/transformations";
import { getNextTaskId } from "../templates/categories";
import { applyStory } from "./story-factory";
import { getGridGenerator } from "../templates/generators";

/**
 * TaskFactory is the main engine for generating tasks
 * It combines category templates and transformation templates to create
 * fully-formed task definitions ready for use in the game.
 */
export class TaskFactory {
  private categoryTemplates: Record<string, CategoryTemplate>;
  private transformationTemplates: TransformationTemplate[];

  /**
   * Create a new TaskFactory instance
   * @param categoryTemplates Record of category templates
   * @param transformationTemplates Array of transformation templates
   */
  constructor(
    categoryTemplates: Record<string, CategoryTemplate> = CATEGORY_TEMPLATES,
    transformationTemplates: TransformationTemplate[] = []
  ) {
    this.categoryTemplates = categoryTemplates;
    this.transformationTemplates = transformationTemplates;
  }

  /**
   * Generate a complete task definition
   * @param categoryCode Category code (e.g., "COM", "NAV")
   * @param transformationType Transformation type (e.g., "horizontal_reflection")
   * @param options Optional configuration for task generation
   * @returns Complete task definition or null if generation failed
   */
  generateTask(
    categoryCode: string, 
    transformationType: string, 
    options: any = {}
  ): TaskDefinition | null {
    // Validate inputs
    const category = this.categoryTemplates[categoryCode];
    if (!category) {
      console.error(`Category ${categoryCode} not found`);
      return null;
    }

    const transformation = getTransformationByType(transformationType);
    if (!transformation) {
      console.error(`Transformation ${transformationType} not found`);
      return null;
    }

    // Get grid generator for this transformation
    const generator = getGridGenerator(transformation.gridGenerator);
    if (!generator) {
      console.error(`Grid generator ${transformation.gridGenerator} not found`);
      return null;
    }

    // Set defaults from options
    const difficulty = options.difficulty || transformation.difficulty;
    const gridSize = options.gridSize || this.getGridSizeForDifficulty(difficulty);
    
    // Generate examples and test case
    const examples = generator.generateExamples(gridSize, 2);
    const { input: testInput, output: testOutput } = generator.generateTestCase(gridSize);
    
    // Use custom hints if provided, otherwise use the transformation's hints
    // Ensure we always have exactly 3 hints as required by the puzzle_tasks_plan document
    let hints = options.customHints || transformation.hintPatterns;
    
    // If we have fewer than 3 hints, add generic ones to make it exactly 3
    while (hints.length < 3) {
      if (hints.length === 0) {
        hints.push(`Apply the ${transformation.name.toLowerCase()} transformation to solve the puzzle.`);
      } else if (hints.length === 1) {
        hints.push(`Look for how each cell changes according to the ${transformation.category} pattern.`);
      } else if (hints.length === 2) {
        hints.push(`⬛ cells follow the same transformation rules as any other cells.`);
      }
    }
    
    // Limit to exactly 3 hints if we have more
    hints = hints.slice(0, 3);

    // Generate domain context for title and description
    const domainContext = options.domainContext || 
      this.getRandomItem(getDomainContext(categoryCode));

    // Generate the title and description using the templates
    const contextVariation = transformation.contextVariations ? 
      this.getRandomItem(transformation.contextVariations) : domainContext;
    
    const title = this.generateTitle(transformation, contextVariation);
    const description = this.generateDescription(transformation, domainContext);

    // Generate a sequential ID for the task starting from 100
    const id = getNextTaskId(categoryCode);

    // Build the base task definition
    const baseTask = {
      id,
      title,
      description,
      category: category.categoryName,
      difficulty,
      gridSize,
      timeLimit: null, // Always null per requirements
      basePoints: category.basePoints,
      requiredRankLevel: category.requiredRankLevel,
      emojiSet: category.emojiSet,
      examples,
      testInput,
      testOutput,
      hints: hints.slice(0, 3), // Ensure exactly 3 hints
      transformationType: transformationType,
      generated: true // Mark as template-generated
    };

    // Apply AI failure content wrapper
    return applyStory(baseTask);
  }

  /**
   * Generate a creative title based on the transformation pattern and domain context
   * @param transformation Transformation template
   * @param context Domain-specific context string
   * @returns Formatted title string
   */
  private generateTitle(
    transformation: TransformationTemplate, 
    context: string
  ): string {
    return transformation.titlePattern.replace("{context}", context);
  }

  /**
   * Generate a description based on the transformation pattern and domain context
   * @param transformation Transformation template
   * @param domain Domain-specific context string
   * @returns Formatted description string
   */
  private generateDescription(
    transformation: TransformationTemplate, 
    domain: string
  ): string {
    return transformation.descriptionPattern.replace("{domain}", domain);
  }

  /**
   * Determine appropriate grid size based on difficulty level
   * @param difficulty Difficulty level
   * @returns Recommended grid size
   */
  private getGridSizeForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case "Basic": return 2;
      case "Intermediate": return 3;
      case "Advanced": return 4;
      default: return 3;
    }
  }

  /**
   * Get a random item from an array
   * @param items Array of items
   * @returns Random item from the array
   */
  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }
}
