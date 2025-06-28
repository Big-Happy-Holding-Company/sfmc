/**
 * Batch script to generate diagonal reflection tasks for all categories and grid sizes
 *
 * This script generates both primary and secondary diagonal reflection tasks for every category
 * and grid size (2x2, 3x3, 4x4), saving each as a JSON file in the proper location.
 *
 * @author Cascade
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping with proper full names and emoji sets
const categories = [
  { code: 'OS', fullName: '🛡️ O₂ Sensor Check', emojiSet: 'tech_set2' },
  { code: 'PL', fullName: '🚀 Pre-Launch Ops', emojiSet: 'celestial_set1' },
  { code: 'FS', fullName: '⚡ Fuel Systems', emojiSet: 'tech_set1' },
  { code: 'NAV', fullName: '🧭 Navigation', emojiSet: 'weather_climate' },  // Avoiding nav_alerts
  { code: 'COM', fullName: '📡 Communications', emojiSet: 'tech_set2' },
  { code: 'PWR', fullName: '⚡ Power Systems', emojiSet: 'tech_set1' },
  { code: 'SEC', fullName: '🔒 Security', emojiSet: 'weather_climate' }  // Avoiding status_alerts
];

const gridSizes = [2, 3, 4];

function createRandomGrid(size) {
  const grid = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(Math.floor(Math.random() * 10));
    }
    grid.push(row);
  }
  return grid;
}

function applyPrimaryDiagonalReflection(grid) {
  const size = grid.length;
  const result = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(grid[j][i]);
    }
    result.push(row);
  }
  return result;
}

function applySecondaryDiagonalReflection(grid) {
  const size = grid.length;
  const result = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(grid[size - 1 - j][size - 1 - i]);
    }
    result.push(row);
  }
  return result;
}

function createTaskDefinition(category, transformationType, gridSize, input, output, hints, id) {
  return {
    id: id,
    title: `${transformationType === 'primary_diagonal_reflection' ? 'Primary' : 'Secondary'} Diagonal Reflection Task`,
    description: `${transformationType === 'primary_diagonal_reflection' ?
      'Reflect the grid across the primary diagonal (top-left to bottom-right)' :
      'Reflect the grid across the secondary diagonal (top-right to bottom-left)'}`,
    category: category.fullName,
    difficulty: gridSize === 2 ? 'Basic' : gridSize === 3 ? 'Intermediate' : 'Advanced',
    gridSize: gridSize,
    timeLimit: null,
    basePoints: 100,
    requiredRankLevel: 1,
    emojiSet: category.emojiSet,
    examples: [
      {
        input: createRandomGrid(gridSize),
        output: transformationType === 'primary_diagonal_reflection' ?
          applyPrimaryDiagonalReflection(createRandomGrid(gridSize)) :
          applySecondaryDiagonalReflection(createRandomGrid(gridSize))
      },
      {
        input: createRandomGrid(gridSize),
        output: transformationType === 'primary_diagonal_reflection' ?
          applyPrimaryDiagonalReflection(createRandomGrid(gridSize)) :
          applySecondaryDiagonalReflection(createRandomGrid(gridSize))
      }
    ],
    testInput: input,
    testOutput: output,
    hints: hints,
    transformationType: transformationType,
    generated: true
  };
}

async function saveTask(category, transformationType, gridSize, id) {
  const input = createRandomGrid(gridSize);
  const output = transformationType === 'primary_diagonal_reflection'
    ? applyPrimaryDiagonalReflection(input)
    : applySecondaryDiagonalReflection(input);

  const hints = transformationType === 'primary_diagonal_reflection'
    ? [
      "Imagine a line going from the top-left corner to the bottom-right corner of the grid ↘️. Flip the grid over this line.",
      "This is like swapping rows and columns - the first row becomes the first column, the second row becomes the second column, and so on.",
      "The number in the top-right corner will move to the bottom-left corner, like looking at the grid in a mirror along the diagonal."
    ] : [
      "Imagine a line going from the top-right corner to the bottom-left corner of the grid ↙️. Flip the grid over this line.",
      "The top-left corner will swap with the bottom-right corner, like a different kind of mirror.",
      "Think of this as \"flipping the grid upside down\" and then \"flipping it left to right\" all at once."
    ];

  const task = createTaskDefinition(
    category.code,
    transformationType,
    gridSize,
    input,
    output,
    hints,
    `${category.code}-${id}`
  );

  const outputDir = path.join(__dirname, '..', 'data', 'tasks');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filePath = path.join(outputDir, `${category.code}-${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(task, null, 2));
  console.log(`Saved: ${filePath}`);
}

async function main() {
  let idCounter = 200; // Start IDs at 200 to avoid collision
  for (const category of categories) {
    for (const gridSize of gridSizes) {
      await saveTask(category, 'primary_diagonal_reflection', gridSize, idCounter++);
      await saveTask(category, 'secondary_diagonal_reflection', gridSize, idCounter++);
    }
  }
  console.log('All diagonal reflection tasks generated!');
}

main().catch(e => { console.error(e); process.exit(1); });
