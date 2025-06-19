"use strict";
/**
 * Pattern Completion grid generator for SFMC puzzles
 *
 * This generator creates grid pairs where the output completes a pattern
 * from the input grid by filling in logically deduced values.
 *
 * @author Cascade
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternCompletionGenerator = void 0;
var base_generator_1 = require("./base-generator");
/**
 * Generates and validates pattern completion transformations
 * The output grid completes logical patterns from the input grid
 */
var PatternCompletionGenerator = /** @class */ (function (_super) {
    __extends(PatternCompletionGenerator, _super);
    function PatternCompletionGenerator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Generate example pairs for pattern completion
     * @param size Grid size (2-4)
     * @param count Number of examples to generate
     * @returns Array of input/output grid pairs
     */
    PatternCompletionGenerator.prototype.generateExamples = function (size, count) {
        var examples = [];
        for (var i = 0; i < count; i++) {
            // For pattern completion, we'll create the output first with a clear pattern
            // Then derive an input that has some values missing
            var _a = this.generatePatternPair(size), input = _a.input, output = _a.output;
            examples.push({ input: input, output: output });
        }
        return examples;
    };
    /**
     * Generate a test case for pattern completion
     * @param size Grid size (2-4)
     * @returns Single input/output grid pair
     */
    PatternCompletionGenerator.prototype.generateTestCase = function (size) {
        return this.generatePatternPair(size);
    };
    /**
     * Validate that the output grid correctly completes the pattern from the input
     * @param input Input grid
     * @param output Output grid
     * @returns true if transformation is valid, false otherwise
     */
    PatternCompletionGenerator.prototype.validateTransformation = function (input, output) {
        if (!input || !output)
            return false;
        if (input.length !== output.length)
            return false;
        var size = input.length;
        // First check that all non-zero values in input match in output
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
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
        for (var i = 0; i < size; i++) {
            if (!this.isArithmeticProgression(output[i])) {
                return false;
            }
        }
        var _loop_1 = function (j) {
            var column = Array(size).fill(0).map(function (_, i) { return output[i][j]; });
            if (!this_1.isArithmeticProgression(column)) {
                return { value: false };
            }
        };
        var this_1 = this;
        // Check if each column follows an arithmetic progression
        for (var j = 0; j < size; j++) {
            var state_1 = _loop_1(j);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return true;
    };
    /**
     * Generate a pattern completion input/output pair
     * @param size Grid size
     * @returns Input and output grids
     */
    PatternCompletionGenerator.prototype.generatePatternPair = function (size) {
        // Create a grid with a clear pattern: increasing values in each row
        var output = Array(size).fill(0).map(function (_, i) {
            return Array(size).fill(0).map(function (_, j) {
                // Create a simple arithmetic sequence
                return (i + j) % 10; // Modulo to keep values 0-9
            });
        });
        // Create input by removing some values (replacing with 0)
        var input = this.copyGrid(output);
        var numToRemove = Math.ceil(size * size / 3); // Remove about 1/3 of the values
        var removed = 0;
        while (removed < numToRemove) {
            var i = Math.floor(Math.random() * size);
            var j = Math.floor(Math.random() * size);
            if (input[i][j] !== 0) {
                input[i][j] = 0; // Replace with 0 to indicate "missing" value
                removed++;
            }
        }
        return { input: input, output: output };
    };
    /**
     * Check if an array follows an arithmetic progression (or constant sequence)
     * @param arr Array to check
     * @returns true if the array follows an arithmetic progression
     */
    PatternCompletionGenerator.prototype.isArithmeticProgression = function (arr) {
        if (arr.length <= 2)
            return true;
        // If all elements are the same, it's a valid constant sequence
        var allSame = arr.every(function (val) { return val === arr[0]; });
        if (allSame)
            return true;
        // Check for arithmetic progression
        var diff = arr[1] - arr[0];
        for (var i = 2; i < arr.length; i++) {
            if (arr[i] - arr[i - 1] !== diff) {
                return false;
            }
        }
        return true;
    };
    return PatternCompletionGenerator;
}(base_generator_1.GridGenerator));
exports.PatternCompletionGenerator = PatternCompletionGenerator;
