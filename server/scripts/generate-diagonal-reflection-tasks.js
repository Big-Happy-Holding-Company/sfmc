/**
 * Script to generate test tasks for diagonal reflections
 * https://www.twitch.tv/videos/2498367976?t=00h02m42s Full Video of process
 * This script generates sample tasks for both primary and secondary diagonal reflections
 * using a 4x4 grid size to test the new transformations.
 * 
 * @author Cascade  
 */

/**
 * Helper function to create a grid of given size filled with random numbers (0-9)
 */
function createRandomGrid(size) {
  const grid = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      // Generate random number between 0 and 9
      row.push(Math.floor(Math.random() * 10));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Apply primary diagonal reflection transformation to a grid
 */
function applyPrimaryDiagonalReflection(grid) {
  const size = grid.length;
  const result = grid.map(row => [...row]); // Create a copy
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result[i][j] = grid[j][i];
    }
  }
  
  return result;
}

/**
 * Apply secondary diagonal reflection transformation to a grid
 */
function applySecondaryDiagonalReflection(grid) {
  const size = grid.length;
  const result = grid.map(row => [...row]); // Create a copy
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result[i][j] = grid[size - 1 - j][size - 1 - i];
    }
  }
  
  return result;
}

/**
 * Format the grid nicely for console display
 */
function formatGrid(grid) {
  return grid.map(row => row.join(' ')).join('\n');
}

/**
 * Generate and display a test task for primary diagonal reflection
 */
function generatePrimaryDiagonalReflectionTask(gridSize) {
  console.log('\n=== Primary Diagonal Reflection Test Task ===');
  console.log('Description: Reflect the input grid across the primary diagonal (top-left to bottom-right)');
  
  // Generate a test case
  const input = createRandomGrid(gridSize);
  const output = applyPrimaryDiagonalReflection(input);
  
  console.log('\nInput Grid:');
  console.log(formatGrid(input));
  console.log('\nExpected Output Grid:');
  console.log(formatGrid(output));
  console.log('\nHints:');
  console.log('1. Imagine a line going from the top-left corner to the bottom-right corner of the grid ↘️. Flip the grid over this line.');
  console.log('2. This is like swapping rows and columns - the first row becomes the first column, the second row becomes the second column, and so on.');
  console.log('3. The number in the top-right corner will move to the bottom-left corner, like looking at the grid in a mirror along the diagonal.');
  
  console.log('\n' + '='.repeat(50));
}

/**
 * Generate and display a test task for secondary diagonal reflection
 */
function generateSecondaryDiagonalReflectionTask(gridSize) {
  console.log('\n=== Secondary Diagonal Reflection Test Task ===');
  console.log('Description: Reflect the input grid across the secondary diagonal (top-right to bottom-left)');
  
  // Generate a test case
  const input = createRandomGrid(gridSize);
  const output = applySecondaryDiagonalReflection(input);
  
  console.log('\nInput Grid:');
  console.log(formatGrid(input));
  console.log('\nExpected Output Grid:');
  console.log(formatGrid(output));
  console.log('\nHints:');
  console.log('1. Imagine a line going from the top-right corner to the bottom-left corner of the grid ↙️. Flip the grid over this line.');
  console.log('2. The top-left corner will swap with the bottom-right corner, like a different kind of mirror.');
  console.log('3. Think of this as "flipping the grid upside down" and then "flipping it left to right" all at once.');
  
  console.log('\n' + '='.repeat(50));
}

// Generate test tasks for both diagonal reflection types with 4x4 grids
console.log('Generating test tasks for diagonal reflections...');
generatePrimaryDiagonalReflectionTask(4);
generateSecondaryDiagonalReflectionTask(4);
