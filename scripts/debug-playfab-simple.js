// Simple PlayFab puzzle mismatch debug script (CommonJS)
// Directly calls PlayFab API to investigate puzzle loading issue

const PUZZLE_ID = '11852cab';
const TITLE_ID = '19FACB';

async function debugPlayFabMismatch() {
  console.log('🔍 DEBUGGING PLAYFAB PUZZLE MISMATCH');
  console.log('=====================================');
  console.log(`Target puzzle: ${PUZZLE_ID}`);
  console.log('');

  try {
    // Step 1: Login to get session ticket
    console.log('1️⃣ Getting PlayFab session...');
    
    const loginResponse = await fetch(`https://${TITLE_ID}.playfabapi.com/Client/LoginWithCustomID`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        TitleId: TITLE_ID,
        CustomId: 'debug-session-' + Date.now(),
        CreateAccount: true
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.data?.SessionTicket) {
      throw new Error('Failed to get PlayFab session: ' + JSON.stringify(loginData));
    }
    
    const sessionTicket = loginData.data.SessionTicket;
    console.log('✅ PlayFab session obtained');
    console.log('');

    // Step 2: Get all batch keys
    console.log('2️⃣ Generating batch keys to check...');
    
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
    
    console.log(`Generated ${allBatchKeys.length} batch keys`);

    // Step 3: Get Title Data
    console.log('3️⃣ Fetching Title Data...');
    
    const titleDataResponse = await fetch(`https://${TITLE_ID}.playfabapi.com/Client/GetTitleData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': sessionTicket
      },
      body: JSON.stringify({
        Keys: allBatchKeys
      })
    });

    const titleData = await titleDataResponse.json();
    
    if (!titleData.data?.Data) {
      console.log('❌ No Title Data returned:', titleData);
      return;
    }

    const existingKeys = Object.keys(titleData.data.Data);
    console.log(`✅ Found ${existingKeys.length} existing batches:`);
    existingKeys.forEach(key => console.log(`  ✓ ${key}`));
    console.log('');

    // Step 4: Search for our puzzle
    console.log(`4️⃣ Searching for puzzle "${PUZZLE_ID}"...`);
    
    let foundPuzzle = null;
    let foundInBatch = null;
    
    for (const key of existingKeys) {
      console.log(`\n🔍 Checking ${key}...`);
      
      const batchData = titleData.data.Data[key];
      if (!batchData || batchData === "undefined") {
        console.log(`  ❌ Empty/undefined batch`);
        continue;
      }
      
      try {
        const puzzles = JSON.parse(batchData);
        console.log(`  📊 Contains ${puzzles.length} puzzles`);
        
        // Show sample of puzzle IDs
        const sampleIds = puzzles.slice(0, 5).map(p => p.id || 'NO-ID');
        console.log(`  🔸 Sample IDs: ${sampleIds.join(', ')}`);
        
        // Search strategies
        const found = puzzles.find(p => {
          if (!p.id) return false;
          
          // Test multiple matching strategies
          return p.id === PUZZLE_ID ||                              // Exact match
                 p.id.includes(PUZZLE_ID) ||                        // Contains
                 p.id.replace(/^ARC-[A-Z0-9]+-/, '') === PUZZLE_ID || // Strip prefix
                 (p.playFabId && p.playFabId === PUZZLE_ID);         // PlayFab ID field
        });
        
        if (found) {
          console.log(`  ✅ FOUND PUZZLE:`, {
            id: found.id,
            playFabId: found.playFabId || 'not set',
            dataset: found.dataset || 'not set',
            filename: found.filename || 'not set'
          });
          foundPuzzle = found;
          foundInBatch = key;
          break;
        } else {
          console.log(`  ❌ Not found`);
        }
        
      } catch (parseError) {
        console.log(`  ❌ Parse error:`, parseError.message);
      }
    }
    
    // Step 5: Analysis
    console.log('\n5️⃣ ANALYSIS');
    console.log('=============');
    
    if (foundPuzzle) {
      console.log(`✅ SUCCESS: Puzzle found in ${foundInBatch}`);
      console.log(`Puzzle data:`, JSON.stringify(foundPuzzle, null, 2));
      
      // Analyze why our function might fail
      console.log('\n🔍 Why our loadPuzzleFromPlayFab might fail:');
      console.log(`- Actual ID format: ${foundPuzzle.id}`);
      console.log(`- Expected format: ARC-{TR|EV|T2|E2}-${PUZZLE_ID}`);
      
      const expectedFormats = [`ARC-TR-${PUZZLE_ID}`, `ARC-EV-${PUZZLE_ID}`, `ARC-T2-${PUZZLE_ID}`, `ARC-E2-${PUZZLE_ID}`];
      const matches = expectedFormats.some(format => format === foundPuzzle.id);
      console.log(`- Format matches our expectations: ${matches}`);
      
      if (!matches) {
        console.log(`🔧 SOLUTION: Update search logic to handle "${foundPuzzle.id}" format`);
      }
      
    } else {
      console.log(`❌ PUZZLE NOT FOUND in PlayFab`);
      console.log('Possible reasons:');
      console.log('- Puzzle not uploaded to PlayFab');
      console.log('- Different ID format than expected');
      console.log('- In a batch we\'re not checking');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Use dynamic import for fetch if needed
if (typeof fetch === 'undefined') {
  import('node-fetch').then(({ default: fetch }) => {
    globalThis.fetch = fetch;
    debugPlayFabMismatch();
  }).catch(console.error);
} else {
  debugPlayFabMismatch();
}