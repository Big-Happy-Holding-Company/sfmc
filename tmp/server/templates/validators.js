"use strict";
/**
 * Validation logic for task definitions
 *
 * This file provides validation utilities to ensure generated tasks meet all
 * requirements and contain valid transformations.
 *
 * @author Cascade
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskValidator = void 0;
var generators_1 = require("./generators");
var transformations_1 = require("./transformations");
var spaceEmojis_1 = require("../../client/src/constants/spaceEmojis");
/**
 * TaskValidator provides methods to validate task definitions
 * to ensure they meet all requirements before being used in the game
 */
var TaskValidator = /** @class */ (function () {
    function TaskValidator() {
    }
    /**
     * Validate a complete task definition
     * @param task Task definition to validate
     * @returns Validation result with status and any error messages
     */
    TaskValidator.prototype.validateTask = function (task) {
        var schemaErrors = this.getSchemaErrors(task);
        var logicErrors = this.getLogicErrors(task);
        var errors = __spreadArray(__spreadArray([], schemaErrors, true), logicErrors, true);
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };
    /**
     * Check if a task passes schema validation
     * @param task Task to validate
     * @returns true if the task schema is valid
     */
    TaskValidator.prototype.validateSchema = function (task) {
        return this.getSchemaErrors(task).length === 0;
    };
    /**
     * Check if a task passes logical validation
     * @param task Task to validate
     * @returns true if the task logic is valid
     */
    TaskValidator.prototype.validateLogic = function (task) {
        return this.getLogicErrors(task).length === 0;
    };
    /**
     * Get all schema-related errors for a task
     * @param task Task to validate
     * @returns Array of error messages
     */
    TaskValidator.prototype.getSchemaErrors = function (task) {
        var errors = [];
        // Check required fields
        if (!task.id)
            errors.push("Task ID is required");
        if (!task.title)
            errors.push("Title is required");
        if (!task.description)
            errors.push("Description is required");
        if (!task.category)
            errors.push("Category is required");
        if (!task.difficulty)
            errors.push("Difficulty is required");
        if (task.gridSize === undefined)
            errors.push("Grid size is required");
        if (task.basePoints === undefined)
            errors.push("Base points are required");
        if (task.requiredRankLevel === undefined)
            errors.push("Required rank level is required");
        if (!task.emojiSet)
            errors.push("Emoji set is required");
        if (!task.examples)
            errors.push("Examples are required");
        if (!task.testInput)
            errors.push("Test input is required");
        if (!task.testOutput)
            errors.push("Test output is required");
        if (!task.hints)
            errors.push("Hints are required");
        // Check ID format (e.g., "COM-123")
        if (task.id && !/^[A-Z]{2,3}-\d{3}$/.test(task.id)) {
            errors.push("Task ID format invalid: ".concat(task.id, " (should be like \"COM-123\")"));
        }
        // Check difficulty values
        if (task.difficulty && !["Basic", "Intermediate", "Advanced"].includes(task.difficulty)) {
            errors.push("Invalid difficulty: ".concat(task.difficulty));
        }
        // Check grid size (2-4)
        if (task.gridSize !== undefined && (task.gridSize < 2 || task.gridSize > 4)) {
            errors.push("Invalid grid size: ".concat(task.gridSize, " (should be 2-4)"));
        }
        // Check emoji set exists
        if (task.emojiSet && !this.isValidEmojiSet(task.emojiSet)) {
            errors.push("Invalid emoji set: ".concat(task.emojiSet));
        }
        // Check examples (at least 2)
        if (task.examples && task.examples.length < 2) {
            errors.push("Not enough examples: ".concat(task.examples.length, " (minimum 2)"));
        }
        // Check hints (exactly 3)
        if (task.hints && task.hints.length !== 3) {
            errors.push("Invalid number of hints: ".concat(task.hints.length, " (should be 3)"));
        }
        return errors;
    };
    /**
     * Get all logic-related errors for a task
     * @param task Task to validate
     * @returns Array of error messages
     */
    TaskValidator.prototype.getLogicErrors = function (task) {
        var _this = this;
        var errors = [];
        // Check grid values are within valid range (0-9)
        this.validateGridValues(task.testInput, "Test input", errors);
        this.validateGridValues(task.testOutput, "Test output", errors);
        if (task.examples) {
            task.examples.forEach(function (example, i) {
                _this.validateGridValues(example.input, "Example ".concat(i + 1, " input"), errors);
                _this.validateGridValues(example.output, "Example ".concat(i + 1, " output"), errors);
            });
        }
        // Check grid dimensions match the specified size
        if (task.gridSize) {
            this.validateGridSize(task.testInput, task.gridSize, "Test input", errors);
            // For Object Counting, the output grid can have different dimensions
            if (!task.id.startsWith("OBJ-")) {
                this.validateGridSize(task.testOutput, task.gridSize, "Test output", errors);
            }
            if (task.examples) {
                task.examples.forEach(function (example, i) {
                    _this.validateGridSize(example.input, task.gridSize, "Example ".concat(i + 1, " input"), errors);
                    // For Object Counting, the output grid can have different dimensions
                    if (!task.id.startsWith("OBJ-")) {
                        _this.validateGridSize(example.output, task.gridSize, "Example ".concat(i + 1, " output"), errors);
                    }
                });
            }
        }
        // Validate that the transformation logic is correct
        this.validateTransformationLogic(task, errors);
        return errors;
    };
    /**
     * Validate that a grid's values are within the valid range (0-9)
     * @param grid Grid to validate
     * @param label Label for error messages
     * @param errors Array to add error messages to
     */
    TaskValidator.prototype.validateGridValues = function (grid, label, errors) {
        if (!grid)
            return;
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid[i].length; j++) {
                var value = grid[i][j];
                if (value < 0 || value > 9 || !Number.isInteger(value)) {
                    errors.push("".concat(label, " contains invalid value at [").concat(i, ",").concat(j, "]: ").concat(value, " (should be integer 0-9)"));
                }
            }
        }
    };
    /**
     * Validate that a grid's dimensions match the expected size
     * @param grid Grid to validate
     * @param expectedSize Expected grid size
     * @param label Label for error messages
     * @param errors Array to add error messages to
     */
    TaskValidator.prototype.validateGridSize = function (grid, expectedSize, label, errors) {
        if (!grid)
            return;
        if (grid.length !== expectedSize) {
            errors.push("".concat(label, " has wrong number of rows: ").concat(grid.length, " (expected ").concat(expectedSize, ")"));
        }
        else {
            for (var i = 0; i < grid.length; i++) {
                if (grid[i].length !== expectedSize) {
                    errors.push("".concat(label, " row ").concat(i, " has wrong length: ").concat(grid[i].length, " (expected ").concat(expectedSize, ")"));
                }
            }
        }
    };
    /**
     * Validate that the transformation logic is correctly applied
     * @param task Task to validate
     * @param errors Array to add error messages to
     */
    TaskValidator.prototype.validateTransformationLogic = function (task, errors) {
        // Extract transformation type from the task ID (e.g., HOR from HOR-123)
        var transformationType = this.inferTransformationType(task.id);
        if (!transformationType) {
            errors.push("Could not infer transformation type from task ID: ".concat(task.id));
            return;
        }
        // Get the corresponding grid generator
        var transformation = (0, transformations_1.getTransformationByType)(transformationType);
        if (!transformation) {
            errors.push("Unknown transformation type: ".concat(transformationType));
            return;
        }
        var generator = (0, generators_1.getGridGenerator)(transformation.gridGenerator);
        if (!generator) {
            errors.push("Grid generator not found for transformation: ".concat(transformation.gridGenerator));
            return;
        }
        // Validate test case
        if (!generator.validateTransformation(task.testInput, task.testOutput)) {
            errors.push("Test case does not follow the ".concat(transformationType, " transformation pattern"));
        }
        // Validate examples
        if (task.examples) {
            task.examples.forEach(function (example, i) {
                if (!generator.validateTransformation(example.input, example.output)) {
                    errors.push("Example ".concat(i + 1, " does not follow the ").concat(transformationType, " transformation pattern"));
                }
            });
        }
    };
    /**
     * Infer the transformation type from a task ID
     * @param taskId Task ID (e.g., "HOR-123")
     * @returns Transformation type or undefined if not found
     */
    TaskValidator.prototype.inferTransformationType = function (taskId) {
        // This is a placeholder implementation
        // In a real implementation, we would have a mapping from task ID prefixes to transformation types
        // For now, we'll just return a default transformation for each category
        if (taskId.startsWith("COM-"))
            return "horizontal_reflection";
        if (taskId.startsWith("NAV-"))
            return "rotation_90deg";
        if (taskId.startsWith("SEC-"))
            return "xor_operation";
        if (taskId.startsWith("PL-"))
            return "pattern_completion";
        if (taskId.startsWith("OS-"))
            return "object_counting";
        return undefined;
    };
    /**
     * Check if an emoji set is valid
     * @param emojiSet Emoji set name
     * @returns true if the emoji set exists
     */
    TaskValidator.prototype.isValidEmojiSet = function (emojiSet) {
        return emojiSet in spaceEmojis_1.SPACE_EMOJIS;
    };
    return TaskValidator;
}());
exports.TaskValidator = TaskValidator;
