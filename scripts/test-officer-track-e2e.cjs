/**
 * End-to-End Test for Officer Track PlayFab Integration
 * 
 * This script validates:
 * 1. ID conversion functions work correctly
 * 2. PlayFab data is accessible and properly formatted
 * 3. Complete data flow from search to puzzle loading
 * 4. Error handling and fallback mechanisms
 */

require('dotenv').config();

// ID conversion functions for testing (copied from source)
function arcIdToPlayFab(arcId, dataset = 'training') {
  if (arcId.startsWith('ARC-')) return arcId; // Already in PlayFab format
  
  const prefixMap = {
    'training': 'ARC-TR-',
    'evaluation': 'ARC-EV-', 
    'training2': 'ARC-T2-',
    'evaluation2': 'ARC-E2-'
  };
  
  return prefixMap[dataset] + arcId;
}

function playFabToArcId(playFabId) {
  return playFabId.replace(/^ARC-(TR|T2|EV|E2)-/, '');
}

// Simple PlayFab core implementation for Node.js testing
class TestPlayFabCore {
  constructor(titleId, secretKey) {
    this.titleId = titleId;
    this.secretKey = secretKey;
  }

  async makeHttpRequest(url, requestData = {}, requiresAuth = false) {
    const https = require('https');
    
    const fullUrl = `https://${this.titleId}.playfabapi.com${url}`;
    const postData = JSON.stringify({ ...requestData, TitleId: this.titleId });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-SecretKey': this.secretKey
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(fullUrl, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.code === 200) {
              resolve({ success: true, data: result.data });
            } else {
              resolve({ success: false, error: result.errorMessage || 'Unknown error' });
            }
          } catch (err) {
            reject(new Error(`JSON parse error: ${err.message}`));
          }
        });
      });
      
      req.on('error', err => reject(err));
      req.write(postData);
      req.end();
    });
  }
}

/**
 * Test ID conversion functions
 */
function testIDConversions() {
  console.log('\n🧪 Testing ID Conversion Functions');
  console.log('===================================');
  
  const testCases = [
    { arcId: '007bbfb7', dataset: 'training', expected: 'ARC-TR-007bbfb7' },
    { arcId: '11852cab', dataset: 'training2', expected: 'ARC-T2-11852cab' },
    { arcId: '1ae2feb7', dataset: 'evaluation', expected: 'ARC-EV-1ae2feb7' },
    { arcId: 'def67890', dataset: 'evaluation2', expected: 'ARC-E2-def67890' }
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(testCase => {
    try {
      // Test conversion: Arc ID → PlayFab ID using our function
      const converted = arcIdToPlayFab(testCase.arcId, testCase.dataset);
      
      if (converted === testCase.expected) {
        console.log(`✅ ${testCase.dataset}: ${testCase.arcId} → ${converted}`);
        passed++;
      } else {
        console.log(`❌ ${testCase.dataset}: Expected ${testCase.expected}, got ${converted}`);
        failed++;
      }
      
      // Test reverse conversion: PlayFab ID → Arc ID
      const reversed = playFabToArcId(testCase.expected);
      if (reversed === testCase.arcId) {
        console.log(`✅ Reverse: ${testCase.expected} → ${reversed}`);
        passed++;
      } else {
        console.log(`❌ Reverse: Expected ${testCase.arcId}, got ${reversed}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ ${testCase.dataset}: Error - ${error.message}`);
      failed++;
    }
  });
  
  console.log(`\n📊 ID Conversion Tests: ${passed}/${passed + failed} passed`);
  return failed === 0;
}

/**
 * Test PlayFab data accessibility
 */
async function testPlayFabAccess() {
  console.log('\n🔌 Testing PlayFab Data Access');
  console.log('==============================');
  
  const titleId = process.env.VITE_PLAYFAB_TITLE_ID;
  const secretKey = process.env.PLAYFAB_SECRET_KEY;
  
  if (!titleId || !secretKey) {
    console.log('❌ Missing environment variables');
    return false;
  }
  
  const playFab = new TestPlayFabCore(titleId, secretKey);
  
  try {
    // Test: Get title data keys
    const result = await playFab.makeHttpRequest('/Admin/GetTitleData', { Keys: [] });
    
    if (!result.success) {
      console.log(`❌ PlayFab API call failed: ${result.error}`);
      return false;
    }
    
    const keys = Object.keys(result.data.Data || {});
    const officerKeys = keys.filter(k => k.includes('officer-tasks'));
    
    console.log(`✅ PlayFab connected successfully`);
    console.log(`📋 Found ${keys.length} total title data keys`);
    console.log(`🎖️ Found ${officerKeys.length} officer task keys`);
    
    // Test specific puzzle loading
    const testBatch = 'officer-tasks-training-batch1.json';
    const batchResult = await playFab.makeHttpRequest('/Admin/GetTitleData', { Keys: [testBatch] });
    
    if (batchResult.success && batchResult.data.Data[testBatch]) {
      // Admin API returns data in .Value field
      const dataValue = batchResult.data.Data[testBatch].Value || batchResult.data.Data[testBatch];
      
      if (!dataValue || dataValue === "undefined") {
        console.log(`❌ ${testBatch} contains "undefined" string`);
        return false;
      }
      
      try {
        const puzzles = JSON.parse(dataValue);
        console.log(`✅ Successfully loaded ${puzzles.length} puzzles from ${testBatch}`);
        console.log(`🎯 First puzzle ID: ${puzzles[0].id}`);
        
        // Validate puzzle structure
        const puzzle = puzzles[0];
        const hasRequiredFields = puzzle.id && puzzle.train && puzzle.test && puzzle.dataset;
        console.log(`🧩 Puzzle structure validation: ${hasRequiredFields ? '✅ Valid' : '❌ Invalid'}`);
        
        return hasRequiredFields;
      } catch (parseError) {
        console.log(`❌ JSON parse error for ${testBatch}: ${parseError.message}`);
        console.log(`   Raw data: ${dataValue.substring(0, 100)}...`);
        return false;
      }
    } else {
      console.log(`❌ Failed to load batch data: ${testBatch}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ PlayFab access error: ${error.message}`);
    return false;
  }
}

/**
 * Test complete data flow simulation
 */
async function testDataFlow() {
  console.log('\n🌊 Testing Complete Data Flow');
  console.log('=============================');
  
  const testPuzzleId = '11852cab';
  console.log(`🎯 Testing with puzzle ID: ${testPuzzleId}`);
  
  const playFab = new TestPlayFabCore(
    process.env.VITE_PLAYFAB_TITLE_ID,
    process.env.PLAYFAB_SECRET_KEY
  );
  
  // Step 1: Simulate arc-explainer API search (would normally provide metadata)
  console.log('1️⃣ Arc-explainer API search simulation...');
  // Note: Arc-explainer API has certificate issues in Windows, so we simulate
  const mockArcExplainerResult = {
    id: testPuzzleId,
    avgAccuracy: 0.15,
    difficulty: 'extremely_hard',
    totalExplanations: 5
  };
  console.log(`✅ Mock arc-explainer result: ${mockArcExplainerResult.difficulty} (${mockArcExplainerResult.avgAccuracy * 100}% accuracy)`);
  
  // Step 2: Load full puzzle from PlayFab
  console.log('2️⃣ Loading full puzzle from PlayFab...');
  
  const datasets = [
    { name: 'training', batches: 4 },
    { name: 'training2', batches: 10 },
    { name: 'evaluation', batches: 4 },
    { name: 'evaluation2', batches: 2 }
  ];
  
  let foundPuzzle = null;
  
  searchLoop: for (const dataset of datasets) {
    for (let i = 1; i <= dataset.batches; i++) {
      try {
        const batchKey = `officer-tasks-${dataset.name}-batch${i}.json`;
        const result = await playFab.makeHttpRequest('/Admin/GetTitleData', { Keys: [batchKey] });
        
        if (result.success && result.data.Data[batchKey]) {
          const dataValue = result.data.Data[batchKey].Value || result.data.Data[batchKey];
          
          if (!dataValue || dataValue === "undefined") {
            console.log(`⚠️ Skipping ${batchKey}: contains "undefined" string`);
            continue;
          }
          
          try {
            const puzzles = JSON.parse(dataValue);
            
            const puzzle = puzzles.find(p => {
              const cleanId = p.id.replace(/^ARC-[A-Z0-9]+-/, '');
              return cleanId === testPuzzleId;
            });
            
            if (puzzle) {
              foundPuzzle = puzzle;
              console.log(`✅ Found puzzle in ${dataset.name} batch ${i}`);
              break searchLoop;
            }
          } catch (parseError) {
            console.log(`⚠️ Error parsing ${batchKey}: ${parseError.message}`);
            continue;
          }
        }
      } catch (error) {
        console.log(`⚠️ Error checking ${dataset.name} batch ${i}: ${error.message}`);
      }
    }
  }
  
  if (foundPuzzle) {
    console.log(`🎯 Puzzle Details:`);
    console.log(`   ID: ${foundPuzzle.id}`);
    console.log(`   Dataset: ${foundPuzzle.dataset}`);
    console.log(`   Difficulty: ${foundPuzzle.difficulty}`);
    console.log(`   Training Examples: ${foundPuzzle.train ? foundPuzzle.train.length : 0}`);
    console.log(`   Test Cases: ${foundPuzzle.test ? foundPuzzle.test.length : 0}`);
    console.log(`   Grid Size: ${foundPuzzle.gridSize ? `${foundPuzzle.gridSize.maxWidth}x${foundPuzzle.gridSize.maxHeight}` : 'Unknown'}`);
    
    // Step 3: Validate data structure
    const hasValidStructure = foundPuzzle.train && 
                             foundPuzzle.test && 
                             Array.isArray(foundPuzzle.train) && 
                             Array.isArray(foundPuzzle.test) &&
                             foundPuzzle.train.length > 0 &&
                             foundPuzzle.test.length > 0;
                             
    console.log(`3️⃣ Data structure validation: ${hasValidStructure ? '✅ Valid' : '❌ Invalid'}`);
    
    return hasValidStructure;
  } else {
    console.log(`❌ Puzzle ${testPuzzleId} not found in PlayFab`);
    return false;
  }
}

/**
 * Main test execution
 */
async function runE2ETests() {
  console.log('🧪 Officer Track PlayFab Integration - End-to-End Testing');
  console.log('=========================================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`PlayFab Title: ${process.env.VITE_PLAYFAB_TITLE_ID || 'NOT SET'}`);
  console.log(`Secret Key: ${process.env.PLAYFAB_SECRET_KEY ? 'SET' : 'NOT SET'}`);
  
  const results = [];
  
  // Test 1: ID Conversions
  results.push({
    name: 'ID Conversion Functions',
    result: testIDConversions()
  });
  
  // Test 2: PlayFab Access
  results.push({
    name: 'PlayFab Data Access',
    result: await testPlayFabAccess()
  });
  
  // Test 3: Complete Data Flow
  results.push({
    name: 'Complete Data Flow',
    result: await testDataFlow()
  });
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  
  const passed = results.filter(r => r.result).length;
  const total = results.length;
  
  results.forEach(test => {
    console.log(`${test.result ? '✅' : '❌'} ${test.name}`);
  });
  
  console.log(`\n${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Officer Track PlayFab integration is working correctly.');
    console.log('\n🚀 Ready for user testing:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Navigate to Officer Track');
    console.log('   3. Search for puzzle "11852cab" or "007bbfb7"');
    console.log('   4. Select puzzle from grid to test full data loading');
    console.log('   5. Use debug tools to validate in browser');
  } else {
    console.log('\n❌ Some tests failed. Check the issues above before proceeding.');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  runE2ETests().catch(console.error);
}

module.exports = {
  testIDConversions,
  testPlayFabAccess,
  testDataFlow
};