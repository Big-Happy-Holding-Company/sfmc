/**
 * Script to fix emoji sets and category formats in diagonal reflection task files
 * 
 * This script repairs all previously generated diagonal reflection task files,
 * updating the emojiSet and category fields to match the required format.
 * 
 * @author Cascade
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping with proper full names and emoji sets
const categoryMapping = {
  'OS': {
    fullName: '🛡️ O₂ Sensor Check',
    emojiSet: 'tech_set2'
  },
  'PL': {
    fullName: '🚀 Pre-Launch Ops',
    emojiSet: 'celestial_set1'
  },
  'FS': {
    fullName: '⚡ Fuel Systems',
    emojiSet: 'tech_set1'
  },
  'NAV': {
    fullName: '🧭 Navigation',
    emojiSet: 'weather_climate' // Avoiding nav_alerts as instructed
  },
  'COM': {
    fullName: '📡 Communications',
    emojiSet: 'tech_set2'
  },
  'PWR': {
    fullName: '⚡ Power Systems',
    emojiSet: 'tech_set1'
  },
  'SEC': {
    fullName: '🔒 Security',
    emojiSet: 'celestial_set2' // Avoiding status_alerts as instructed
  }
};

// Function to fix a single task file
function fixTaskFile(filePath) {
  try {
    // Read the task file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const task = JSON.parse(fileContent);
    
    // Extract category code from task ID
    const categoryCode = task.id.split('-')[0];
    
    if (categoryMapping[categoryCode]) {
      // Update the category name and emoji set
      const mapping = categoryMapping[categoryCode];
      task.category = mapping.fullName;
      task.emojiSet = mapping.emojiSet;
      
      // Write the updated task back to the file
      fs.writeFileSync(filePath, JSON.stringify(task, null, 2));
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️ Skipped: ${filePath} - Unknown category code: ${categoryCode}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
    return false;
  }
}

// Main function to find and fix all diagonal reflection task files
async function fixAllDiagonalTasks() {
  console.log('Fixing diagonal reflection task files...');
  
  const tasksDir = path.join(__dirname, '..', 'data', 'tasks');
  const files = fs.readdirSync(tasksDir);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  // Process all JSON files in the tasks directory
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(tasksDir, file);
      
      try {
        // Read the file to check if it's a diagonal reflection task
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const task = JSON.parse(fileContent);
        
        // Look for diagonal reflection tasks
        if (task.transformationType === 'primary_diagonal_reflection' || 
            task.transformationType === 'secondary_diagonal_reflection') {
          // Fix the file
          const result = fixTaskFile(filePath);
          if (result) {
            fixedCount++;
          } else {
            errorCount++;
          }
        }
      } catch (error) {
        console.error(`Error reading ${file}:`, error);
        errorCount++;
      }
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`  Total diagonal reflection tasks fixed: ${fixedCount}`);
  console.log(`  Errors: ${errorCount}`);
}

// Run the fix
fixAllDiagonalTasks().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
});
