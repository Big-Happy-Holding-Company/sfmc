"use strict";
/**
 * Object Counting grid generator for SFMC puzzles
 *
 * This generator creates grid pairs where the output represents counts
 * of each value (0-9) present in the input grid.
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
exports.ObjectCountingGenerator = void 0;
var base_generator_1 = require("./base-generator");
/**
 * Generates and validates object counting transformations
 * The output grid shows the count of each value in the input grid
 */
var ObjectCountingGenerator = /** @class */ (function (_super) {
    __extends(ObjectCountingGenerator, _super);
    function ObjectCountingGenerator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Generate example pairs for object counting
     * @param size Grid size (2-4)
     * @param count Number of examples to generate
     * @returns Array of input/output grid pairs
     */
    ObjectCountingGenerator.prototype.generateExamples = function (size, count) {
        var examples = [];
        for (var i = 0; i < count; i++) {
            var input = this.createRandomGrid(size);
            var output = this.applyObjectCounting(input);
            examples.push({ input: input, output: output });
        }
        return examples;
    };
    /**
     * Generate a test case for object counting
     * @param size Grid size (2-4)
     * @returns Single input/output grid pair
     */
    ObjectCountingGenerator.prototype.generateTestCase = function (size) {
        var input = this.createRandomGrid(size);
        var output = this.applyObjectCounting(input);
        return { input: input, output: output };
    };
    /**
     * Validate that the output grid correctly counts objects in the input
     * @param input Input grid
     * @param output Output grid
     * @returns true if transformation is valid, false otherwise
     */
    ObjectCountingGenerator.prototype.validateTransformation = function (input, output) {
        if (!input || !output)
            return false;
        // Count the occurrences of each value (0-9) in the input grid
        var counts = Array(10).fill(0);
        for (var i = 0; i < input.length; i++) {
            for (var j = 0; j < input[i].length; j++) {
                // Ensure input values are valid
                if (input[i][j] < 0 || input[i][j] > 9)
                    return false;
                counts[input[i][j]]++;
            }
        }
        // Check if the output grid correctly represents these counts
        // Output format depends on the size of the grid:
        // For size 2: Output is a 1x2 grid as [count0, count1]
        // For size 3: Output is a 2x2 grid as [[count0, count1], [count2, count3]]
        // For size 4: Output is a 2x5 grid as [[count0-count4], [count5-count9]]
        var size = input.length;
        if (size === 2) {
            // Check for 1x2 output format
            if (output.length !== 1 || output[0].length !== 2)
                return false;
            if (output[0][0] !== counts[0] || output[0][1] !== counts[1])
                return false;
        }
        else if (size === 3) {
            // Check for 2x2 output format
            if (output.length !== 2 || output[0].length !== 2 || output[1].length !== 2)
                return false;
            if (output[0][0] !== counts[0] ||
                output[0][1] !== counts[1] ||
                output[1][0] !== counts[2] ||
                output[1][1] !== counts[3]) {
                return false;
            }
        }
        else if (size === 4) {
            // Check for 2x5 output format
            if (output.length !== 2 || output[0].length !== 5 || output[1].length !== 5)
                return false;
            for (var i = 0; i < 5; i++) {
                if (output[0][i] !== counts[i] || output[1][i] !== counts[i + 5]) {
                    return false;
                }
            }
        }
        else {
            // Unsupported size
            return false;
        }
        return true;
    };
    /**
     * Apply object counting transformation to a grid
     * @param grid Input grid
     * @returns New grid showing count of each value
     */
    ObjectCountingGenerator.prototype.applyObjectCounting = function (grid) {
        var size = grid.length;
        // Count occurrences of each value (0-9) in the input grid
        var counts = Array(10).fill(0);
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                counts[grid[i][j]]++;
            }
        }
        // Format the output grid based on the input size
        var output;
        if (size === 2) {
            // Output a 1x2 grid for counts of 0-1
            output = [counts.slice(0, 2)];
        }
        else if (size === 3) {
            // Output a 2x2 grid for counts of 0-3
            output = [
                counts.slice(0, 2),
                counts.slice(2, 4)
            ];
        }
        else if (size === 4) {
            // Output a 2x5 grid for counts of 0-9
            output = [
                counts.slice(0, 5),
                counts.slice(5, 10)
            ];
        }
        else {
            // Default: return a row of counts capped at 9
            var cappedCounts = counts.map(function (c) { return Math.min(c, 9); });
            output = [cappedCounts];
        }
        return output;
    };
    return ObjectCountingGenerator;
}(base_generator_1.GridGenerator));
exports.ObjectCountingGenerator = ObjectCountingGenerator;
