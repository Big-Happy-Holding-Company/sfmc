/**
 * PlayFab Officer Track Data Upload Script
 * ========================================
 * 
 * CRITICAL: This script uploads ARC puzzle data to PlayFab Title Data
 * Without this, the Officer Track cannot function!
 * 
 * Purpose:
 * - Process all ARC JSON files from data/training, data/evaluation, etc.
 * - Transform them into Officer Track puzzle format
 * - Generate unique IDs and prevent duplicates
 * - Upload to PlayFab Title Data as "officer-tasks.json"
 * 
 * Usage:
 * node scripts/upload-officer-tasks.js
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// PlayFab Configuration - MUST SET THESE!
const PLAYFAB_TITLE_ID = process.env.VITE_PLAYFAB_TITLE_ID || '19FACB';
const PLAYFAB_SECRET_KEY = process.env.SECRET_PLAYFAB_KEY;

if (!PLAYFAB_SECRET_KEY) {
  console.error('❌ ERROR: SECRET_PLAYFAB_KEY environment variable not set!');
  console.error('   Please set it in your .env file or environment');
  process.exit(1);
}

console.log('🎖️  PlayFab Officer Track Data Upload');
console.log('=====================================');
console.log(`Title ID: ${PLAYFAB_TITLE_ID}`);
console.log(`Secret Key: ${PLAYFAB_SECRET_KEY ? '[SET]' : '[NOT SET]'}`);

// ARC Dataset directories
const ARC_DATASETS = [
  { name: 'training', path: 'data/training', prefix: 'ARC-TR' },
  { name: 'training2', path: 'data/training2', prefix: 'ARC-T2' },
  { name: 'evaluation', path: 'data/evaluation', prefix: 'ARC-EV' },
  { name: 'evaluation2', path: 'data/evaluation2', prefix: 'ARC-E2' }
];

// Officer rank difficulty mapping
const DIFFICULTY_MAPPING = {
  simple: 'LIEUTENANT',
  moderate: 'CAPTAIN', 
  complex: 'MAJOR',
  expert: 'COLONEL'
};

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('\n🔍 Step 1: Processing ARC puzzle files...');
    const officerTasks = await processAllARCFiles();
    
    console.log(`\n📊 Step 2: Generated ${officerTasks.length} officer track puzzles`);
    logDatasetStats(officerTasks);
    
    console.log('\n☁️  Step 3: Uploading to PlayFab Title Data...');
    await uploadToPlayFab(officerTasks);
    
    console.log('\n✅ SUCCESS: Officer Track data uploaded to PlayFab!');
    console.log('   The Officer Academy is now ready for use.');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Process all ARC files from all datasets
 */
async function processAllARCFiles() {
  const allOfficerTasks = [];
  const seenIds = new Set(); // Prevent duplicates

  for (const dataset of ARC_DATASETS) {
    console.log(`\n📁 Processing ${dataset.name} dataset...`);
    
    try {
      const files = await fs.readdir(dataset.path);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      console.log(`   Found ${jsonFiles.length} JSON files`);
      
      let processedCount = 0;
      for (const filename of jsonFiles) {
        try {
          const filePath = path.join(dataset.path, filename);
          const rawData = await fs.readFile(filePath, 'utf8');
          const arcPuzzle = JSON.parse(rawData);
          
          const officerTask = transformARCToOfficerTask(arcPuzzle, filename, dataset);
          
          // Check for duplicate IDs
          if (seenIds.has(officerTask.id)) {
            console.warn(`   ⚠️  Duplicate ID detected: ${officerTask.id} - skipping`);
            continue;
          }
          
          seenIds.add(officerTask.id);
          allOfficerTasks.push(officerTask);
          processedCount++;
          
          if (processedCount % 100 === 0) {
            console.log(`   Processed ${processedCount}/${jsonFiles.length} files...`);
          }
          
        } catch (fileError) {
          console.warn(`   ⚠️  Failed to process ${filename}: ${fileError.message}`);
        }
      }
      
      console.log(`   ✅ Successfully processed ${processedCount} files from ${dataset.name}`);
      
    } catch (dirError) {
      console.warn(`   ⚠️  Could not read directory ${dataset.path}: ${dirError.message}`);
    }
  }

  return allOfficerTasks;
}

/**
 * Transform raw ARC puzzle to Officer Track format
 */
function transformARCToOfficerTask(arcPuzzle, filename, dataset) {
  const baseFilename = filename.replace('.json', '');
  const id = `${dataset.prefix}-${baseFilename}`;
  
  // Analyze puzzle complexity
  const complexity = analyzeComplexity(arcPuzzle);
  const gridSize = analyzeGridSize(arcPuzzle);
  
  return {
    id,
    filename: baseFilename,
    dataset: dataset.name,
    difficulty: DIFFICULTY_MAPPING[complexity.transformationComplexity],
    gridSize,
    complexity,
    train: arcPuzzle.train || [],
    test: arcPuzzle.test || [],
    loadedAt: new Date().toISOString()
  };
}

/**
 * Analyze puzzle complexity for difficulty estimation
 */
function analyzeComplexity(puzzle) {
  const trainingExamples = (puzzle.train || []).length;
  
  // Count unique colors across all grids
  const allValues = new Set();
  [...(puzzle.train || []), ...(puzzle.test || [])].forEach(example => {
    [example.input, example.output].forEach(grid => {
      grid.forEach(row => row.forEach(cell => allValues.add(cell)));
    });
  });

  const uniqueColors = allValues.size;
  
  // Estimate transformation complexity
  let transformationComplexity = 'simple';
  
  if (uniqueColors > 6 || trainingExamples > 3) {
    transformationComplexity = 'moderate';
  }
  if (uniqueColors > 8 || trainingExamples > 4) {
    transformationComplexity = 'complex';  
  }
  if (uniqueColors === 10 && trainingExamples > 5) {
    transformationComplexity = 'expert';
  }

  return {
    trainingExamples,
    uniqueColors,
    transformationComplexity
  };
}

/**
 * Analyze grid dimensions across all examples
 */
function analyzeGridSize(puzzle) {
  const allGrids = [];
  [...(puzzle.train || []), ...(puzzle.test || [])].forEach(example => {
    allGrids.push(example.input, example.output);
  });
  
  let minWidth = Infinity, maxWidth = 0;
  let minHeight = Infinity, maxHeight = 0;

  allGrids.forEach(grid => {
    const height = grid.length;
    const width = grid[0]?.length || 0;
    
    minHeight = Math.min(minHeight, height);
    maxHeight = Math.max(maxHeight, height);
    minWidth = Math.min(minWidth, width);
    maxWidth = Math.max(maxWidth, width);
  });

  return {
    minWidth: minWidth === Infinity ? 0 : minWidth,
    maxWidth,
    minHeight: minHeight === Infinity ? 0 : minHeight,
    maxHeight
  };
}

/**
 * Upload officer tasks to PlayFab Title Data
 */
async function uploadToPlayFab(officerTasks) {
  const titleDataPayload = {
    Key: 'officer-tasks.json',
    Value: JSON.stringify(officerTasks)
  };

  const requestData = JSON.stringify(titleDataPayload);
  
  const options = {
    hostname: `${PLAYFAB_TITLE_ID}.playfabapi.com`,
    path: '/Admin/SetTitleData',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestData),
      'X-SecretKey': PLAYFAB_SECRET_KEY
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.code === 200) {
            console.log('   ✅ Title Data upload successful!');
            console.log(`   📏 Data size: ${Math.round(Buffer.byteLength(requestData) / 1024)} KB`);
            resolve(response);
          } else {
            console.error('   ❌ PlayFab API Error:', response);
            reject(new Error(`PlayFab API Error: ${response.error || 'Unknown error'}`));
          }
        } catch (parseError) {
          console.error('   ❌ Failed to parse PlayFab response:', data);
          reject(parseError);
        }
      });
    });

    req.on('error', (error) => {
      console.error('   ❌ HTTPS Request Error:', error.message);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Log statistics about processed data
 */
function logDatasetStats(officerTasks) {
  console.log('\n📊 Dataset Statistics:');
  
  // Count by dataset
  const datasetCounts = {};
  const difficultyCounts = {};
  
  officerTasks.forEach(task => {
    datasetCounts[task.dataset] = (datasetCounts[task.dataset] || 0) + 1;
    difficultyCounts[task.difficulty] = (difficultyCounts[task.difficulty] || 0) + 1;
  });
  
  console.log('\n   By Dataset:');
  Object.entries(datasetCounts).forEach(([dataset, count]) => {
    console.log(`     ${dataset}: ${count} puzzles`);
  });
  
  console.log('\n   By Difficulty:');
  Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
    console.log(`     ${difficulty}: ${count} puzzles`);
  });
  
  console.log(`\n   Total: ${officerTasks.length} puzzles ready for upload`);
}

// Execute the script
if (require.main === module) {
  main();
}

module.exports = { main, processAllARCFiles, transformARCToOfficerTask };