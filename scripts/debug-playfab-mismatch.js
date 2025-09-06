// Comprehensive debug script to investigate PlayFab puzzle loading mismatch
// This will help us understand why loadPuzzleFromPlayFab() fails to find puzzle 11852cab

// import { playFabCore } from '../client/src/services/playfab/core.js';

const PUZZLE_ID = '11852cab';

async function debugPlayFabMismatch() {
  console.log('🔍 DEBUGGING PLAYFAB PUZZLE MISMATCH');
  console.log('=====================================');
  console.log(`Target puzzle: ${PUZZLE_ID}`);
  console.log('');

  try {
    // Step 1: Initialize PlayFab
    console.log('1️⃣ Initializing PlayFab...');
    
    // Import and setup PlayFab core
    const titleId = process.env.VITE_PLAYFAB_TITLE_ID || '19FACB';
    console.log(`Using title ID: ${titleId}`);
    
    // Login anonymously to get session
    const loginResult = await fetch('https://19FACB.playfabapi.com/Client/LoginWithCustomID', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        TitleId: titleId,
        CustomId: 'debug-session-' + Date.now(),
        CreateAccount: true
      })
    });

    const loginData = await loginResult.json();
    if (!loginData.data?.SessionTicket) {
      throw new Error('Failed to get PlayFab session ticket');
    }
    
    const sessionTicket = loginData.data.SessionTicket;
    console.log('✅ PlayFab session obtained');
    console.log('');

    // Step 2: Check all batch keys in PlayFab Title Data
    console.log('2️⃣ Checking PlayFab Title Data structure...');
    
    const datasets = [
      { name: 'training', batches: 4 },
      { name: 'evaluation', batches: 4 }, 
      { name: 'training2', batches: 10 },
      { name: 'evaluation2', batches: 2 }
    ];
    
    const allBatchKeys = [];
    for (const dataset of datasets) {
      for (let i = 1; i <= dataset.batches; i++) {
        allBatchKeys.push(`officer-tasks-${dataset.name}-batch${i}.json`);
      }
    }
    
    console.log(`Generated ${allBatchKeys.length} batch keys to check:`);
    allBatchKeys.forEach(key => console.log(`  - ${key}`));
    console.log('');

    // Step 3: Get Title Data and check what keys actually exist
    console.log('3️⃣ Fetching actual Title Data keys...');
    
    const titleDataResult = await fetch('https://19FACB.playfabapi.com/Client/GetTitleData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PlayFabSDK': 'JavaScriptSDK-2.0.0',
        'X-Authorization': sessionTicket
      },
      body: JSON.stringify({
        Keys: allBatchKeys
      })
    });

    const titleData = await titleDataResult.json();
    console.log('Title Data response structure:', {
      success: titleData.code === 200,
      hasData: !!titleData.data?.Data,
      keyCount: titleData.data?.Data ? Object.keys(titleData.data.Data).length : 0
    });

    if (!titleData.data?.Data) {
      console.log('❌ No Title Data returned!');
      return;
    }

    const existingKeys = Object.keys(titleData.data.Data);
    console.log(`✅ Found ${existingKeys.length} existing keys in PlayFab:`);
    existingKeys.forEach(key => console.log(`  ✓ ${key}`));
    console.log('');

    // Step 4: Search for our target puzzle in each existing batch
    console.log(`4️⃣ Searching for puzzle "${PUZZLE_ID}" in each batch...`);
    
    let foundPuzzle = null;
    let foundInBatch = null;
    
    for (const key of existingKeys) {
      console.log(`\n🔍 Checking ${key}...`);
      
      const batchData = titleData.data.Data[key];
      if (!batchData || batchData === "undefined") {
        console.log(`  ❌ Batch is empty or undefined`);
        continue;
      }
      
      try {
        const puzzles = JSON.parse(batchData);
        console.log(`  📊 Batch contains ${puzzles.length} puzzles`);
        
        // Show first few puzzle IDs for reference
        const firstFew = puzzles.slice(0, 3).map(p => p.id || 'NO-ID');
        console.log(`  🔸 First few IDs: ${firstFew.join(', ')}`);
        
        // Search for our target puzzle using multiple strategies
        const strategies = [
          { name: 'Exact ID match', test: p => p.id === PUZZLE_ID },
          { name: 'ID without prefix', test: p => p.id && p.id.replace(/^ARC-[A-Z0-9]+-/, '') === PUZZLE_ID },
          { name: 'ID contains target', test: p => p.id && p.id.includes(PUZZLE_ID) },
          { name: 'PlayFab ID exact', test: p => p.playFabId === PUZZLE_ID },
          { name: 'Any field contains', test: p => JSON.stringify(p).includes(PUZZLE_ID) }
        ];
        
        for (const strategy of strategies) {
          const found = puzzles.find(strategy.test);
          if (found) {
            console.log(`  ✅ FOUND via ${strategy.name}:`, {
              id: found.id,
              playFabId: found.playFabId,
              filename: found.filename
            });
            foundPuzzle = found;
            foundInBatch = key;
            break;
          }
        }
        
        if (!foundPuzzle) {
          console.log(`  ❌ Not found in this batch`);
        }
        
      } catch (parseError) {
        console.log(`  ❌ Failed to parse batch data:`, parseError.message);
      }
    }
    
    console.log('\n');
    console.log('5️⃣ FINAL RESULTS');
    console.log('=================');
    
    if (foundPuzzle) {
      console.log(`✅ PUZZLE FOUND in batch: ${foundInBatch}`);
      console.log('Full puzzle data:', JSON.stringify(foundPuzzle, null, 2));
      
      // Step 6: Test our loadPuzzleFromPlayFab function logic
      console.log('\n6️⃣ TESTING OUR FUNCTION LOGIC');
      console.log('==============================');
      
      // Simulate what our function does
      const searchStrategies = [
        `ARC-TR-${PUZZLE_ID}`,
        `ARC-EV-${PUZZLE_ID}`, 
        `ARC-T2-${PUZZLE_ID}`,
        `ARC-E2-${PUZZLE_ID}`,
        PUZZLE_ID
      ];
      
      console.log('Our function would search for these formats:');
      searchStrategies.forEach(format => console.log(`  - ${format}`));
      
      console.log('\nActual puzzle ID format in PlayFab:', foundPuzzle.id);
      
      // Check if our regex would match
      const ourRegex = /^ARC-(TR|T2|EV|E2)-/;
      const wouldMatch = ourRegex.test(foundPuzzle.id);
      console.log(`Our playFabToArcId regex would match: ${wouldMatch}`);
      
      if (wouldMatch) {
        const extractedId = foundPuzzle.id.replace(ourRegex, '');
        console.log(`Would extract ID: ${extractedId}`);
        console.log(`Matches target: ${extractedId === PUZZLE_ID}`);
      }
      
    } else {
      console.log(`❌ PUZZLE NOT FOUND in any batch`);
      
      // Additional debugging - check if puzzle exists in local files
      console.log('\n🔍 Checking if puzzle exists locally...');
      
      const fs = await import('fs/promises');
      const localPaths = [
        `../data/training/${PUZZLE_ID}.json`,
        `../data/evaluation/${PUZZLE_ID}.json`,
        `../data/training2/${PUZZLE_ID}.json`, 
        `../data/evaluation2/${PUZZLE_ID}.json`
      ];
      
      for (const path of localPaths) {
        try {
          await fs.access(path);
          console.log(`✅ Found locally: ${path}`);
        } catch {
          console.log(`❌ Not found locally: ${path}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

debugPlayFabMismatch().catch(console.error);