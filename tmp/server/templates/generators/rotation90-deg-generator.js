"use strict";
/**
 * 90-Degree Rotation grid generator for SFMC puzzles
 *
 * This generator creates grid pairs where the output is a 90-degree clockwise
 * rotation of the input grid.
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
exports.Rotation90DegGenerator = void 0;
var base_generator_1 = require("./base-generator");
/**
 * Generates and validates 90-degree clockwise rotation transformations
 * The output grid is the input grid rotated 90 degrees clockwise
 */
var Rotation90DegGenerator = /** @class */ (function (_super) {
    __extends(Rotation90DegGenerator, _super);
    function Rotation90DegGenerator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Generate example pairs for 90-degree rotation
     * @param size Grid size (2-4)
     * @param count Number of examples to generate
     * @returns Array of input/output grid pairs
     */
    Rotation90DegGenerator.prototype.generateExamples = function (size, count) {
        var examples = [];
        for (var i = 0; i < count; i++) {
            var input = this.createRandomGrid(size);
            var output = this.applyRotation90Deg(input);
            examples.push({ input: input, output: output });
        }
        return examples;
    };
    /**
     * Generate a test case for 90-degree rotation
     * @param size Grid size (2-4)
     * @returns Single input/output grid pair
     */
    Rotation90DegGenerator.prototype.generateTestCase = function (size) {
        var input = this.createRandomGrid(size);
        var output = this.applyRotation90Deg(input);
        return { input: input, output: output };
    };
    /**
     * Validate that the output grid is a correct 90-degree clockwise rotation of the input
     * @param input Input grid
     * @param output Output grid
     * @returns true if transformation is valid, false otherwise
     */
    Rotation90DegGenerator.prototype.validateTransformation = function (input, output) {
        if (!input || !output)
            return false;
        if (input.length !== output.length)
            return false;
        var size = input.length;
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                // For 90-degree clockwise rotation: output[j][size-1-i] should equal input[i][j]
                // or alternatively: output[i][j] should equal input[size-1-j][i]
                if (output[i][j] !== input[size - 1 - j][i]) {
                    return false;
                }
            }
        }
        return true;
    };
    /**
     * Apply 90-degree clockwise rotation transformation to a grid
     * @param grid Input grid
     * @returns New grid with 90-degree rotation applied
     */
    Rotation90DegGenerator.prototype.applyRotation90Deg = function (grid) {
        var size = grid.length;
        var result = Array(size).fill(0).map(function () { return Array(size).fill(0); });
        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                // In a 90-degree clockwise rotation:
                // - The first row becomes the last column (reading top to bottom)
                // - The second row becomes the second-to-last column
                // - And so on...
                result[j][size - 1 - i] = grid[i][j];
            }
        }
        return result;
    };
    return Rotation90DegGenerator;
}(base_generator_1.GridGenerator));
exports.Rotation90DegGenerator = Rotation90DegGenerator;
