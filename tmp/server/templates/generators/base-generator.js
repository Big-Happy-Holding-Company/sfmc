"use strict";
/**
 * Base grid generator for SFMC puzzles
 *
 * This file provides the abstract base class that all grid generators will extend.
 * It defines common functionality and interfaces for grid generation.
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
exports.GRID_GENERATORS = exports.GridGenerator = void 0;
exports.registerGridGenerator = registerGridGenerator;
exports.getGridGenerator = getGridGenerator;
/**
 * Abstract base class for all grid generators
 *
 * Each specific transformation type extends this base class to implement
 * its unique grid generation and validation logic.
 */
var GridGenerator = /** @class */ (function () {
    function GridGenerator() {
    }
    /**
     * Helper method to create a grid of given size filled with random numbers (0-9)
     * @param size Grid size
     * @returns A size x size grid with random values
     */
    GridGenerator.prototype.createRandomGrid = function (size) {
        var grid = [];
        for (var i = 0; i < size; i++) {
            var row = [];
            for (var j = 0; j < size; j++) {
                // Generate random number between 0 and 9
                row.push(Math.floor(Math.random() * 10));
            }
            grid.push(row);
        }
        return grid;
    };
    /**
     * Create a deep copy of a grid
     * @param grid Grid to copy
     * @returns New grid with same values
     */
    GridGenerator.prototype.copyGrid = function (grid) {
        return grid.map(function (row) { return __spreadArray([], row, true); });
    };
    return GridGenerator;
}());
exports.GridGenerator = GridGenerator;
/**
 * Grid generator registry to store and retrieve implementations by name
 */
exports.GRID_GENERATORS = {};
/**
 * Register a grid generator implementation
 * @param name Generator name
 * @param generatorClass Generator class (must be a concrete class, not abstract)
 */
function registerGridGenerator(name, generatorClass) {
    exports.GRID_GENERATORS[name] = generatorClass;
}
/**
 * Get a grid generator by name
 * @param name Generator name
 * @returns Generator instance or undefined if not found
 */
function getGridGenerator(name) {
    if (!name || !exports.GRID_GENERATORS[name])
        return undefined;
    try {
        var GeneratorClass = exports.GRID_GENERATORS[name];
        // Only attempt to instantiate if it's in our registry (and thus a concrete class)
        return new GeneratorClass();
    }
    catch (error) {
        console.error("Error creating generator ".concat(name, ":"), error);
        return undefined;
    }
}
