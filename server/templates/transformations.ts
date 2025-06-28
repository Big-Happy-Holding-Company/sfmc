/**
 * Core transformation patterns for SFMC puzzles
 * 
 * This file defines the 5 core transformation types that can be applied to task grids.
 * Each transformation includes metadata about how to generate and validate tasks.
 * 
 * @author Cascade
 */

import { TaskDefinition, ExamplePair } from "./task.interface";

/**
 * Function type for grid generation
 */
type GridGeneratorFunction = {
  generateExamples: (size: number, count: number) => ExamplePair[];
  generateTestCase: (size: number) => ExamplePair;
};

/**
 * TransformationTemplate defines the properties of a transformation pattern
 * that can be applied across different categories
 */
export interface TransformationTemplate {
  type: string;                // Unique ID for the transformation
  name: string;                // Display name
  category: string;            // Transformation category based on README.md
  titlePattern: string;        // Template for generating titles
  descriptionPattern: string;  // Template for descriptions
  gridGenerator: string;       // Reference to grid generator implementation
  hintPatterns: string[];      // Templates for standard hints
  difficulty: "Basic" | "Intermediate" | "Advanced";
  contextVariations?: string[]; // Optional context variations for title/description
}

/**
 * Context variations for different domains to make tasks more interesting
 * These will be used to populate placeholders in title and description patterns
 */
const DOMAIN_CONTEXTS = {
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
export const TRANSFORMATION_TEMPLATES: TransformationTemplate[] = [
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
      "Rotate the entire grid 90 degrees clockwise 🔃 (¼ turn to the right).",
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
  
  // 4. Vertical reflection (geometric)
  {
    type: "vertical_reflection",
    name: "Vertical Reflection",
    category: "geometric",
    titlePattern: "{context} Vertical Analysis",
    descriptionPattern: "Analyze the {domain} by flipping the input grid vertically (top-to-bottom).",
    gridGenerator: "VerticalReflectionGenerator",
    hintPatterns: [
      "Flip the entire grid vertically (top ↔ bottom) 🔼🔽.",
      "The top row becomes the bottom row, the second row from the top becomes the second row from the bottom, and so on.",
      "Each row maintains its order from left to right, but rows swap positions vertically."
    ],
    difficulty: "Intermediate"
  },
  
  // 5. 270° rotation (geometric)
  {
    type: "rotation_270deg",
    name: "270° Rotation",
    category: "geometric",
    titlePattern: "{context} Rotation Analysis",
    descriptionPattern: "Analyze the {domain} by rotating the input grid 270 degrees clockwise (or 90 degrees counter-clockwise).",
    gridGenerator: "Rotation270DegGenerator",
    hintPatterns: [
      "Rotate the entire grid 270 degrees clockwise (¾ turn to the right).",
      "The leftmost column becomes the top row, reading from left to right.",
      "Each row in the original becomes a column in the result, with order shifted accordingly."
    ],
    difficulty: "Intermediate"
  },
  
  // 6. Primary diagonal reflection (geometric)
  {
    type: "primary_diagonal_reflection",
    name: "Primary Diagonal Reflection",
    category: "geometric",
    titlePattern: "{context} Diagonal Analysis",
    descriptionPattern: "Analyze the {domain} by reflecting the input grid across the primary diagonal (top-left to bottom-right).",
    gridGenerator: "PrimaryDiagonalReflectionGenerator",
    hintPatterns: [
      "Imagine a line going from the top-left corner to the bottom-right corner of the grid ↘️. Flip the grid over this line.",
      "This is like swapping rows and columns - the first row becomes the first column, the second row becomes the second column, and so on.",
      "The number in the top-right corner will move to the bottom-left corner, like looking at the grid in a mirror along the diagonal."
    ],
    difficulty: "Intermediate"
  },
  
  // 7. Secondary diagonal reflection (geometric)
  {
    type: "secondary_diagonal_reflection",
    name: "Secondary Diagonal Reflection",
    category: "geometric",
    titlePattern: "{context} Diagonal Mirror Analysis",
    descriptionPattern: "Analyze the {domain} by reflecting the input grid across the secondary diagonal (top-right to bottom-left).",
    gridGenerator: "SecondaryDiagonalReflectionGenerator",
    hintPatterns: [
      "Imagine a line going from the top-right corner to the bottom-left corner of the grid ↙️. Flip the grid over this line.",
      "The top-left corner will swap with the bottom-right corner, like a different kind of mirror.",
      "Think of this as 'flipping the grid upside down' and then 'flipping it left to right' all at once."
    ],
    difficulty: "Advanced"
  }
];

/**
 * Helper function to get a transformation template by type
 */
export function getTransformationByType(type: string): TransformationTemplate | undefined {
  return TRANSFORMATION_TEMPLATES.find(t => t.type === type);
}

/**
 * Helper function to get domain-specific context for a category
 */
export function getDomainContext(categoryCode: string): string[] {
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
