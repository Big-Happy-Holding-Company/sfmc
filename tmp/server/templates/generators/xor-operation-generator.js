"use strict";
/**
 * XOR Operation grid generator for SFMC puzzles
 *
 * This generator creates grid pairs where the output is the result of applying
 * XOR operations to adjacent cells in each row of the input grid.
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
exports.XorOperationGenerator = void 0;
var base_generator_1 = require("./base-generator");
/**
 * Generates and validates XOR operation transformations
 * The output grid contains the results of XOR operations on adjacent cells
 */
var XorOperationGenerator = /** @class */ (function (_super) {
    __extends(XorOperationGenerator, _super);
    function XorOperationGenerator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Generate example pairs for XOR operations
     * @param size Grid size (2-4)
     * @param count Number of examples to generate
     * @returns Array of input/output grid pairs
     */
    XorOperationGenerator.prototype.generateExamples = function (size, count) {
        var examples = [];
        for (var i = 0; i < count; i++) {
            // Use smaller values for simpler XOR results (0-4)
            var input = Array(size).fill(0).map(function () {
                return Array(size).fill(0).map(function () { return Math.floor(Math.random() * 5); });
            });
            var output = this.applyXorOperation(input);
            examples.push({ input: input, output: output });
        }
        return examples;
    };
    /**
     * Generate a test case for XOR operation
     * @param size Grid size (2-4)
     * @returns Single input/output grid pair
     */
    XorOperationGenerator.prototype.generateTestCase = function (size) {
        // Use smaller values for simpler XOR results (0-4)
        var input = Array(size).fill(0).map(function () {
            return Array(size).fill(0).map(function () { return Math.floor(Math.random() * 5); });
        });
        var output = this.applyXorOperation(input);
        return { input: input, output: output };
    };
    /**
     * Validate that the output grid correctly applies XOR operations to the input
     * @param input Input grid
     * @param output Output grid
     * @returns true if transformation is valid, false otherwise
     */
    XorOperationGenerator.prototype.validateTransformation = function (input, output) {
        if (!input || !output)
            return false;
        if (input.length !== output.length)
            return false;
        var size = input.length;
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size - 1; j++) {
                // For XOR operation, output[i][j] should be input[i][j] XOR input[i][j+1]
                // We use our simplified XOR operation
                var xorResult = this.simpleXor(input[i][j], input[i][j + 1]);
                if (output[i][j] !== xorResult) {
                    return false;
                }
            }
            // Last column in output is determined differently
            if (output[i][size - 1] !== input[i][size - 1]) {
                return false;
            }
        }
        return true;
    };
    /**
     * Apply XOR operation to a grid
     * @param grid Input grid
     * @returns New grid with XOR operations applied
     */
    XorOperationGenerator.prototype.applyXorOperation = function (grid) {
        var size = grid.length;
        var result = Array(size).fill(0).map(function () { return Array(size).fill(0); });
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size - 1; j++) {
                // Each cell is the XOR of current and next cell in the input row
                result[i][j] = this.simpleXor(grid[i][j], grid[i][j + 1]);
            }
            // Last column carries over the value from input
            result[i][size - 1] = grid[i][size - 1];
        }
        return result;
    };
    /**
     * Simplified XOR operation for puzzle generation
     * Makes the result more intuitive for players:
     * - If a and b are the same, result is 0
     * - If a and b are different, result is their sum (bounded to 0-9)
     *
     * @param a First value
     * @param b Second value
     * @returns Simplified XOR result
     */
    XorOperationGenerator.prototype.simpleXor = function (a, b) {
        if (a === b) {
            return 0; // Same values result in 0
        }
        else {
            // Different values result in their sum, bounded to 0-9
            return Math.min(a + b, 9);
        }
    };
    return XorOperationGenerator;
}(base_generator_1.GridGenerator));
exports.XorOperationGenerator = XorOperationGenerator;
