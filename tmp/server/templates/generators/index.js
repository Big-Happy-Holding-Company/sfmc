"use strict";
/**
 * Grid generation classes for SFMC puzzles
 *
 * This directory contains the grid generator base interface and specialized
 * implementations for each transformation type.
 *
 * @author Cascade
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectCountingGenerator = exports.XorOperationGenerator = exports.PatternCompletionGenerator = exports.Rotation90DegGenerator = exports.HorizontalReflectionGenerator = exports.GRID_GENERATORS = exports.registerGridGenerator = exports.getGridGenerator = exports.GridGenerator = void 0;
// Export base generator definitions and registry
var base_generator_1 = require("./base-generator");
Object.defineProperty(exports, "GridGenerator", { enumerable: true, get: function () { return base_generator_1.GridGenerator; } });
Object.defineProperty(exports, "getGridGenerator", { enumerable: true, get: function () { return base_generator_1.getGridGenerator; } });
Object.defineProperty(exports, "registerGridGenerator", { enumerable: true, get: function () { return base_generator_1.registerGridGenerator; } });
Object.defineProperty(exports, "GRID_GENERATORS", { enumerable: true, get: function () { return base_generator_1.GRID_GENERATORS; } });
// Import all generators
var horizontal_reflection_generator_1 = require("./horizontal-reflection-generator");
Object.defineProperty(exports, "HorizontalReflectionGenerator", { enumerable: true, get: function () { return horizontal_reflection_generator_1.HorizontalReflectionGenerator; } });
var rotation90_deg_generator_1 = require("./rotation90-deg-generator");
Object.defineProperty(exports, "Rotation90DegGenerator", { enumerable: true, get: function () { return rotation90_deg_generator_1.Rotation90DegGenerator; } });
var pattern_completion_generator_1 = require("./pattern-completion-generator");
Object.defineProperty(exports, "PatternCompletionGenerator", { enumerable: true, get: function () { return pattern_completion_generator_1.PatternCompletionGenerator; } });
var xor_operation_generator_1 = require("./xor-operation-generator");
Object.defineProperty(exports, "XorOperationGenerator", { enumerable: true, get: function () { return xor_operation_generator_1.XorOperationGenerator; } });
var object_counting_generator_1 = require("./object-counting-generator");
Object.defineProperty(exports, "ObjectCountingGenerator", { enumerable: true, get: function () { return object_counting_generator_1.ObjectCountingGenerator; } });
// Register all generators with the registry
var base_generator_2 = require("./base-generator");
(0, base_generator_2.registerGridGenerator)('HorizontalReflectionGenerator', horizontal_reflection_generator_1.HorizontalReflectionGenerator);
(0, base_generator_2.registerGridGenerator)('Rotation90DegGenerator', rotation90_deg_generator_1.Rotation90DegGenerator);
(0, base_generator_2.registerGridGenerator)('PatternCompletionGenerator', pattern_completion_generator_1.PatternCompletionGenerator);
(0, base_generator_2.registerGridGenerator)('XorOperationGenerator', xor_operation_generator_1.XorOperationGenerator);
(0, base_generator_2.registerGridGenerator)('ObjectCountingGenerator', object_counting_generator_1.ObjectCountingGenerator);
