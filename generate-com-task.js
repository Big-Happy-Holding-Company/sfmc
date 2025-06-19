/**
 * Simple task generator script
 * 
 * This script creates a sample COM task using horizontal reflection
 * for demonstration purposes.
 * 
 * @author Cascade
 */

// Basic task template matching our schema
const task = {
  id: "COM-100",
  title: "Communications Signal Mirroring",
  description: "Identify the correct output by applying horizontal reflection to the input grid.",
  category: "COM",
  difficulty: "Basic",
  gridSize: 3,
  timeLimit: 60,
  basePoints: 100,
  requiredRankLevel: 1,
  emojiSet: "telecommunication",
  
  // Input/output examples following the task schema
  examples: [
    {
      input: [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8]
      ],
      output: [
        [0, 1, 2],
        [3, 4, 5],
        [8, 7, 6]
      ],
      explanation: "The bottom row is horizontally flipped."
    },
    {
      input: [
        [8, 7, 6],
        [5, 4, 3], 
        [2, 1, 0]
      ],
      output: [
        [8, 7, 6],
        [5, 4, 3],
        [0, 1, 2] 
      ],
      explanation: "The bottom row is horizontally flipped."
    }
  ],
  
  // Test cases
  tests: [
    {
      input: [
        [1, 3, 5],
        [7, 9, 2],
        [4, 6, 8]
      ],
      output: [
        [1, 3, 5],
        [7, 9, 2],
        [8, 6, 4]
      ]
    }
  ],
  
  // Exactly three hints as required
  hints: [
    "Focus on how the bottom row changes compared to the input grid.",
    "In horizontal reflection, elements are mirrored from left to right.",
    "Only the bottom row is affected by the transformation."
  ]
};

// Output the task as formatted JSON
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'server', 'data', 'tasks', 'COM-100.json');

// Create directory if it doesn't exist
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write the task to file
fs.writeFileSync(outputPath, JSON.stringify(task, null, 2));
console.log(`Task generated and saved to ${outputPath}`);

// Also display the task in the console
console.log('\nTask Content:');
console.log(JSON.stringify(task, null, 2));
