"use strict";
/**
 * Core transformation patterns for SFMC puzzles
 *
 * This file defines the 5 core transformation types that can be applied to task grids.
 * Each transformation includes metadata about how to generate and validate tasks.
 *
 * @author Cascade
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSFORMATION_TEMPLATES = void 0;
exports.getTransformationByType = getTransformationByType;
exports.getDomainContext = getDomainContext;
/**
 * Context variations for different domains to make tasks more interesting
 * These will be used to populate placeholders in title and description patterns
 */
var DOMAIN_CONTEXTS = {
    communication: [
        "signal strength",
        "transmission data",
        "broadcast patterns",
        "frequency allocation"
    ],
    navigation: [
        "course plotting",
        "trajectory calculation",
        "orbital paths",
        "stellar mapping"
    ],
    power: [
        "energy distribution",
        "power grid",
        "resource allocation",
        "system efficiency"
    ],
    security: [
        "access protocols",
        "threat analysis",
        "defense matrix",
        "perimeter sensors"
    ],
    sensor: [
        "atmospheric readings",
        "environmental data",
        "system diagnostics",
        "oxygen levels"
    ],
    fuel: [
        "propellant mixture",
        "combustion analysis",
        "fuel efficiency",
        "flow regulation"
    ],
    launch: [
        "countdown sequence",
        "ignition timing",
        "thrust calculation",
        "system readiness"
    ]
};
/**
 * Implementation of the 5 core transformations
 * These can be applied across all categories to generate tasks
 */
exports.TRANSFORMATION_TEMPLATES = [
    // 1. Horizontal reflection (geometric)
    {
        type: "horizontal_reflection",
        name: "Horizontal Reflection",
        category: "geometric",
        titlePattern: "{context} Mirror Analysis",
        descriptionPattern: "Analyze the {domain} by reflecting the input grid horizontally (left-to-right mirror).",
        gridGenerator: "HorizontalReflectionGenerator",
        hintPatterns: [
            "Think of the grid as being reflected in a mirror placed to the right side.",
            "The first column becomes the last column, the second becomes the second-to-last, and so on.",
            "The black square (⬛) reflects just like any other cell value."
        ],
        difficulty: "Basic"
    },
    // 2. 90° rotation (geometric)
    {
        type: "rotation_90deg",
        name: "90° Rotation",
        category: "geometric",
        titlePattern: "{context} Rotation Analysis",
        descriptionPattern: "Analyze the {domain} by rotating the input grid 90 degrees clockwise.",
        gridGenerator: "Rotation90DegGenerator",
        hintPatterns: [
            "Rotate the entire grid 90 degrees clockwise (¼ turn to the right).",
            "The top row becomes the rightmost column, reading from top to bottom.",
            "Each column in the original becomes a row in the result, with order reversed."
        ],
        difficulty: "Intermediate"
    },
    // 3. Pattern completion (pattern)
    {
        type: "pattern_completion",
        name: "Pattern Completion",
        category: "pattern",
        titlePattern: "{context} Pattern Analysis",
        descriptionPattern: "Complete the pattern in the {domain} by identifying the logical sequence and filling in the missing values.",
        gridGenerator: "PatternCompletionGenerator",
        hintPatterns: [
            "Look for repeating sequences or progressions in the grid.",
            "Analyze both rows and columns for patterns that might reveal missing values.",
            "Simple mathematical operations (addition, subtraction) often reveal the pattern."
        ],
        difficulty: "Intermediate"
    },
    // 4. XOR operation (logical)
    {
        type: "xor_operation",
        name: "XOR Operation",
        category: "logical",
        titlePattern: "{context} Boolean Logic",
        descriptionPattern: "Apply XOR (exclusive OR) operations to the {domain} by comparing adjacent cells in each row.",
        gridGenerator: "XorOperationGenerator",
        hintPatterns: [
            "XOR returns 'true' when inputs differ and 'false' when they're the same.",
            "For numbers, think of XOR as: if values are different, the result is their sum; if the same, the result is 0.",
            "Process each row independently, comparing pairs of adjacent cells."
        ],
        difficulty: "Advanced"
    },
    // 5. Object counting (object manipulation)
    {
        type: "object_counting",
        name: "Object Counting",
        category: "object manipulation",
        titlePattern: "{context} Inventory Analysis",
        descriptionPattern: "Count the number of each type of object in the {domain} and represent the counts in the output grid.",
        gridGenerator: "ObjectCountingGenerator",
        hintPatterns: [
            "Count how many times each number (0-9) appears in the input grid.",
            "The output grid shows the count of each value, with position 0 showing count of 0s, position 1 showing count of 1s, etc.",
            "The black square (⬛) represents 0 and should be counted like any other value."
        ],
        difficulty: "Basic",
        contextVariations: ["inventory", "resource count", "object tally", "element census"]
    }
];
/**
 * Helper function to get a transformation template by type
 */
function getTransformationByType(type) {
    return exports.TRANSFORMATION_TEMPLATES.find(function (t) { return t.type === type; });
}
/**
 * Helper function to get domain-specific context for a category
 */
function getDomainContext(categoryCode) {
    switch (categoryCode) {
        case "COM": return DOMAIN_CONTEXTS.communication;
        case "NAV": return DOMAIN_CONTEXTS.navigation;
        case "PWR": return DOMAIN_CONTEXTS.power;
        case "SEC": return DOMAIN_CONTEXTS.security;
        case "OS": return DOMAIN_CONTEXTS.sensor;
        case "FS": return DOMAIN_CONTEXTS.fuel;
        case "PL": return DOMAIN_CONTEXTS.launch;
        default: return DOMAIN_CONTEXTS.communication; // fallback
    }
}
