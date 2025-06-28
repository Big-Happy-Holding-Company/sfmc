/**
 * Script to generate test tasks for diagonal reflections
 * 
 * This script generates sample tasks for both primary and secondary diagonal reflections
 * using a 4x4 grid size to test the new transformations.
 * 
 * @author Cascade
 */

/**
 * Helper function to create a grid of given size filled with random numbers (0-9)
 */
function createRandomGrid(size: number): number[][] {
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
function applyPrimaryDiagonalReflection(grid: number[][]): number[][] {
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
function applySecondaryDiagonalReflection(grid: number[][]): number[][] {
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
function formatGrid(grid: number[][]): string {
  return grid.map(row => row.join(' ')).join('\n');
}

/**
 * Generate and display a test task for primary diagonal reflection
 */
function generatePrimaryDiagonalReflectionTask(gridSize: number) {
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
  console.log('1. Reflect the grid across the primary diagonal (running from top-left to bottom-right) ↘️.');
  console.log('2. Rows become columns and columns become rows in this transformation.');
  console.log('3. The cell at position (i,j) becomes the cell at position (j,i) in the result.');
  
  console.log('\n' + '='.repeat(50));
}

/**
 * Generate and display a test task for secondary diagonal reflection
 */
function generateSecondaryDiagonalReflectionTask(gridSize: number) {
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
  console.log('1. Reflect the grid across the secondary diagonal (running from top-right to bottom-left) ↙️.');
  console.log('2. This transformation flips both the row and column positions relative to the grid size.');
  console.log('3. The cell at position (i,j) becomes the cell at position (size-1-j, size-1-i) in the result.');
  
  console.log('\n' + '='.repeat(50));
}

// Generate test tasks for both diagonal reflection types with 4x4 grids
console.log('Generating test tasks for diagonal reflections...');
generatePrimaryDiagonalReflectionTask(4);
generateSecondaryDiagonalReflectionTask(4);
