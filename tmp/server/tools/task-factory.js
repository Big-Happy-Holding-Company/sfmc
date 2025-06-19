"use strict";
/**
 * Main generation engine for SFMC puzzles
 *
 * This file implements the TaskFactory class, which combines category templates
 * and transformation templates to generate fully-formed task definitions.
 *
 * @author Cascade
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskFactory = void 0;
var categories_1 = require("../templates/categories");
var transformations_1 = require("../templates/transformations");
var generators_1 = require("../templates/generators");
/**
 * TaskFactory is the main engine for generating tasks
 * It combines category templates and transformation templates to create
 * fully-formed task definitions ready for use in the game.
 */
var TaskFactory = /** @class */ (function () {
    /**
     * Create a new TaskFactory instance
     * @param categoryTemplates Record of category templates
     * @param transformationTemplates Array of transformation templates
     */
    function TaskFactory(categoryTemplates, transformationTemplates) {
        if (categoryTemplates === void 0) { categoryTemplates = categories_1.CATEGORY_TEMPLATES; }
        if (transformationTemplates === void 0) { transformationTemplates = []; }
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
    TaskFactory.prototype.generateTask = function (categoryCode, transformationType, options) {
        if (options === void 0) { options = {}; }
        // Validate inputs
        var category = this.categoryTemplates[categoryCode];
        if (!category) {
            console.error("Category ".concat(categoryCode, " not found"));
            return null;
        }
        var transformation = (0, transformations_1.getTransformationByType)(transformationType);
        if (!transformation) {
            console.error("Transformation ".concat(transformationType, " not found"));
            return null;
        }
        // Get grid generator for this transformation
        var generator = (0, generators_1.getGridGenerator)(transformation.gridGenerator);
        if (!generator) {
            console.error("Grid generator ".concat(transformation.gridGenerator, " not found"));
            return null;
        }
        // Set defaults from options
        var difficulty = options.difficulty || transformation.difficulty;
        var gridSize = options.gridSize || this.getGridSizeForDifficulty(difficulty);
        // Generate examples and test case
        var examples = generator.generateExamples(gridSize, 2);
        var _a = generator.generateTestCase(gridSize), testInput = _a.input, testOutput = _a.output;
        // Use custom hints if provided, otherwise use the transformation's hints
        // Ensure we always have exactly 3 hints as required by the puzzle_tasks_plan document
        var hints = options.customHints || transformation.hintPatterns;
        // If we have fewer than 3 hints, add generic ones to make it exactly 3
        while (hints.length < 3) {
            if (hints.length === 0) {
                hints.push("Apply the ".concat(transformation.name.toLowerCase(), " transformation to solve the puzzle."));
            }
            else if (hints.length === 1) {
                hints.push("Look for how each cell changes according to the ".concat(transformation.category, " pattern."));
            }
            else if (hints.length === 2) {
                hints.push("\u2B1B cells follow the same transformation rules as any other cells.");
            }
        }
        // Limit to exactly 3 hints if we have more
        hints = hints.slice(0, 3);
        // Generate domain context for title and description
        var domainContext = options.domainContext ||
            this.getRandomItem((0, transformations_1.getDomainContext)(categoryCode));
        // Generate the title and description using the templates
        var contextVariation = transformation.contextVariations ?
            this.getRandomItem(transformation.contextVariations) : domainContext;
        var title = this.generateTitle(transformation, contextVariation);
        var description = this.generateDescription(transformation, domainContext);
        // Generate a sequential ID for the task starting from 100
        var id = (0, categories_1.getNextTaskId)(categoryCode);
        // Build the complete task definition
        return {
            id: id,
            title: title,
            description: description,
            category: category.categoryName,
            difficulty: difficulty,
            gridSize: gridSize,
            timeLimit: null, // Always null per requirements
            basePoints: category.basePoints,
            requiredRankLevel: category.requiredRankLevel,
            emojiSet: category.emojiSet,
            examples: examples,
            testInput: testInput,
            testOutput: testOutput,
            hints: hints.slice(0, 3), // Ensure exactly 3 hints
            generated: true // Mark as template-generated
        };
    };
    /**
     * Generate a creative title based on the transformation pattern and domain context
     * @param transformation Transformation template
     * @param context Domain-specific context string
     * @returns Formatted title string
     */
    TaskFactory.prototype.generateTitle = function (transformation, context) {
        return transformation.titlePattern.replace("{context}", context);
    };
    /**
     * Generate a description based on the transformation pattern and domain context
     * @param transformation Transformation template
     * @param domain Domain-specific context string
     * @returns Formatted description string
     */
    TaskFactory.prototype.generateDescription = function (transformation, domain) {
        return transformation.descriptionPattern.replace("{domain}", domain);
    };
    /**
     * Determine appropriate grid size based on difficulty level
     * @param difficulty Difficulty level
     * @returns Recommended grid size
     */
    TaskFactory.prototype.getGridSizeForDifficulty = function (difficulty) {
        switch (difficulty) {
            case "Basic": return 2;
            case "Intermediate": return 3;
            case "Advanced": return 4;
            default: return 3;
        }
    };
    /**
     * Get a random item from an array
     * @param items Array of items
     * @returns Random item from the array
     */
    TaskFactory.prototype.getRandomItem = function (items) {
        return items[Math.floor(Math.random() * items.length)];
    };
    return TaskFactory;
}());
exports.TaskFactory = TaskFactory;
