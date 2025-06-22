/**
 * Task Enhancement Script
 * 
 * This script enhances all task JSON files in the server/data/tasks directory by:
 * 1. Identifying the transformation type from the description
 * 2. Adding comic_situation1 and ai_difficulty to the beginning of the description
 * 3. Adding kids_explanation, kids_explanation1, kids_explanation2 to the beginning of the hints array
 * 4. Skipping tasks that don't match the five transformation types
 * 
 * @author Cascade
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const TASKS_DIR = path.join(__dirname, '..', 'server', 'data', 'tasks');
const AI_FAILURE_PATH = path.join(__dirname, '..', 'server', 'data', 'ai_failure.json');

// Transformation type keywords to look for in descriptions
const TRANSFORMATION_KEYWORDS = {
  // Horizontal reflection patterns
  'reflecting the grid horizontally': 'horizontal_reflection',
  'horizontally (left-to-right mirror)': 'horizontal_reflection',
  'left-to-right mirror': 'horizontal_reflection',
  
  // Vertical reflection patterns
  'flipping the input grid vertically': 'vertical_reflection',
  'vertically (top-to-bottom)': 'vertical_reflection',
  'top-to-bottom': 'vertical_reflection',
  
  // 90-degree rotation patterns
  'rotating the input grid 90 degrees clockwise': 'rotation_90deg',
  '90 degrees clockwise': 'rotation_90deg',
  '90° clockwise': 'rotation_90deg',
  'rotate grid 90°': 'rotation_90deg',
  
  // 270-degree rotation patterns
  'rotating the input grid 270 degrees clockwise': 'rotation_270deg',
  '270 degrees clockwise': 'rotation_270deg',
  '270° clockwise': 'rotation_270deg',
  'rotate the indicator grid 270°': 'rotation_270deg',
  '90 degrees counter-clockwise': 'rotation_270deg',
  '90° counter-clockwise': 'rotation_270deg',
  
  // Pattern completion
  'complete the pattern': 'pattern_completion',
  'pattern completion': 'pattern_completion',
  'identifying the logical sequence': 'pattern_completion',
  
  // 180-degree rotation (we're treating this as two 90° rotations)
  'rotate the component matrix 180°': 'rotation_90deg',
  'rotate the indicator grid 180°': 'rotation_90deg'
};

// Function to detect transformation type from description
function detectTransformationType(description) {
  description = description.toLowerCase();
  
  for (const [keyword, type] of Object.entries(TRANSFORMATION_KEYWORDS)) {
    if (description.includes(keyword.toLowerCase())) {
      return type;
    }
  }
  
  return null; // No match found
}

// Function to select random comic situation
function selectComicSituation(transformationData) {
  const situations = [
    transformationData.comic_situation1,
    transformationData.comic_situation2,
    transformationData.comic_situation3
  ];
  
  // Randomly select one of the comic situations
  const randomIndex = Math.floor(Math.random() * situations.length);
  return situations[randomIndex];
}

// Main function to enhance tasks
async function enhanceTasks() {
  try {
    // Load AI failure data
    const aiFailureData = JSON.parse(fs.readFileSync(AI_FAILURE_PATH, 'utf8'));
    
    // Get all JSON files in the tasks directory
    const taskFiles = fs.readdirSync(TASKS_DIR).filter(file => file.endsWith('.json'));
    
    // Statistics
    let stats = {
      total: taskFiles.length,
      enhanced: 0,
      skipped: 0
    };
    
    console.log(`Found ${taskFiles.length} task files to process.`);
    
    // Process each task file
    for (const taskFile of taskFiles) {
      const taskPath = path.join(TASKS_DIR, taskFile);
      const taskData = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
      
      // Detect transformation type
      const transformationType = detectTransformationType(taskData.description);
      
      if (!transformationType || !aiFailureData[transformationType]) {
        console.log(`Skipping ${taskFile}: Transformation type not detected or not supported.`);
        stats.skipped++;
        continue;
      }
      
      // Get the transformation data from AI failure JSON
      const transformationData = aiFailureData[transformationType];
      
      // Select a random comic situation
      const comicSituation = selectComicSituation(transformationData);
      
      // Enhance description
      taskData.description = `${comicSituation} ${transformationData.ai_difficulty} ${taskData.description}`;
      
      // Enhance hints by adding the three kids explanations at the beginning
      const newHints = [
        transformationData.kids_explanation,
        transformationData.kids_explanation1,
        transformationData.kids_explanation2,
        ...taskData.hints
      ];
      
      taskData.hints = newHints;
      
      // Save the enhanced task
      fs.writeFileSync(taskPath, JSON.stringify(taskData, null, 2));
      
      console.log(`Enhanced ${taskFile} with ${transformationType} content.`);
      stats.enhanced++;
    }
    
    // Print statistics
    console.log('\nEnhancement completed:');
    console.log(`Total task files: ${stats.total}`);
    console.log(`Enhanced: ${stats.enhanced}`);
    console.log(`Skipped: ${stats.skipped}`);
    
  } catch (error) {
    console.error('Error enhancing tasks:', error);
  }
}

// Run the enhancement process
enhanceTasks().catch(error => console.error('Error running script:', error));
