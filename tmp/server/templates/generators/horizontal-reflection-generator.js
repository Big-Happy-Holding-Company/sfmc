"use strict";
/**
 * Horizontal Reflection grid generator for SFMC puzzles
 *
 * This generator creates grid pairs where the output is a horizontal (left-to-right)
 * reflection of the input grid.
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
exports.HorizontalReflectionGenerator = void 0;
var base_generator_1 = require("./base-generator");
/**
 * Generates and validates horizontal reflection transformations
 * The output grid is a horizontal reflection (left-to-right mirror) of the input grid
 */
var HorizontalReflectionGenerator = /** @class */ (function (_super) {
    __extends(HorizontalReflectionGenerator, _super);
    function HorizontalReflectionGenerator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Generate example pairs for horizontal reflection
     * @param size Grid size (2-4)
     * @param count Number of examples to generate
     * @returns Array of input/output grid pairs
     */
    HorizontalReflectionGenerator.prototype.generateExamples = function (size, count) {
        var examples = [];
        for (var i = 0; i < count; i++) {
            var input = this.createRandomGrid(size);
            var output = this.applyHorizontalReflection(input);
            examples.push({ input: input, output: output });
        }
        return examples;
    };
    /**
     * Generate a test case for horizontal reflection
     * @param size Grid size (2-4)
     * @returns Single input/output grid pair
     */
    HorizontalReflectionGenerator.prototype.generateTestCase = function (size) {
        var input = this.createRandomGrid(size);
        var output = this.applyHorizontalReflection(input);
        return { input: input, output: output };
    };
    /**
     * Validate that the output grid is a correct horizontal reflection of the input
     * @param input Input grid
     * @param output Output grid
     * @returns true if transformation is valid, false otherwise
     */
    HorizontalReflectionGenerator.prototype.validateTransformation = function (input, output) {
        if (!input || !output)
            return false;
        if (input.length !== output.length)
            return false;
        var size = input.length;
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                // For horizontal reflection, output[i][j] should equal input[i][size-1-j]
                if (output[i][j] !== input[i][size - 1 - j]) {
                    return false;
                }
            }
        }
        return true;
    };
    /**
     * Apply horizontal reflection transformation to a grid
     * @param grid Input grid
     * @returns New grid with horizontal reflection applied
     */
    HorizontalReflectionGenerator.prototype.applyHorizontalReflection = function (grid) {
        var size = grid.length;
        var result = this.copyGrid(grid);
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                result[i][j] = grid[i][size - 1 - j];
            }
        }
        return result;
    };
    return HorizontalReflectionGenerator;
}(base_generator_1.GridGenerator));
exports.HorizontalReflectionGenerator = HorizontalReflectionGenerator;
