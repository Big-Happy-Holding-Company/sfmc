/**
 * Debug script to investigate PlayFab puzzle data structure
 * and find why puzzle "11852cab" cannot be found
 */

require('dotenv').config();

// Simple PlayFab core implementation for Node.js
class PlayFabCore {
  constructor(titleId, secretKey) {
    this.titleId = titleId;
    this.secretKey = secretKey;
    this.sessionTicket = null;
  }

  async makeHttpRequest(url, requestData = {}, requiresAuth = false) {
    const fullUrl = `https://${this.titleId}.playfabapi.com${url}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'X-PlayFabSDK': 'NodeJS'
    };

    if (requiresAuth && !this.sessionTicket) {
      throw new Error('Authentication required but no session ticket available');
    }

    if (requiresAuth) {
      headers['X-Authorization'] = this.sessionTicket;
    }

    if (this.secretKey && (url.includes('/Server/') || url.includes('/Admin/'))) {
      headers['X-SecretKey'] = this.secretKey;
    }

    const body = JSON.stringify(requestData);
    
    try {
      // Use dynamic import for node-fetch ESM module
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body
      });

      const result = await response.json();
      
      if (result.code === 200) {
        return { success: true, data: result.data };
      } else {
        console.log('PlayFab API Response:', result);
        return { success: false, error: result.errorMessage || result.error || 'Unknown error', code: result.code };
      }
    } catch (error) {
      console.error('Request failed:', error);
      return { success: false, error: error.message };
    }
  }

  async loginWithCustomId(customId) {
    const result = await this.makeHttpRequest('/Client/LoginWithCustomID', {
      CustomId: customId,
      CreateAccount: true,
      TitleId: this.titleId
    });
    
    if (result.success && result.data?.SessionTicket) {
      this.sessionTicket = result.data.SessionTicket;
      console.log('✅ PlayFab authentication successful');
      return true;
    } else {
      console.error('❌ PlayFab authentication failed:', result.error);
      return false;
    }
  }
}

async function debugPlayFabPuzzleSearch() {
  const titleId = process.env.VITE_PLAYFAB_TITLE_ID;
  const secretKey = process.env.PLAYFAB_SECRET_KEY;
  
  if (!titleId || !secretKey) {
    console.error('❌ Missing VITE_PLAYFAB_TITLE_ID or PLAYFAB_SECRET_KEY in .env');
    return;
  }

  console.log('🔍 Starting PlayFab puzzle data investigation...');
  console.log(`📋 Title ID: ${titleId}`);
  console.log(`🎯 Target puzzle: "11852cab"`);
  console.log('');

  const playFab = new PlayFabCore(titleId, secretKey);
  
  // Login first
  if (!await playFab.loginWithCustomId('debug-user-' + Date.now())) {
    return;
  }

  // All datasets to search
  const datasets = [
    { name: 'training', batches: 4 },
    { name: 'evaluation', batches: 4 },
    { name: 'training2', batches: 10 },
    { name: 'evaluation2', batches: 2 }
  ];

  let totalPuzzlesFound = 0;
  const puzzleIdSamples = {};
  let targetPuzzleFound = null;

  console.log('🔄 Searching through all PlayFab Title Data batches...\n');

  for (const dataset of datasets) {
    console.log(`📂 Dataset: ${dataset.name} (${dataset.batches} batches)`);
    
    for (let i = 1; i <= dataset.batches; i++) {
      try {
        const batchKey = `officer-tasks-${dataset.name}-batch${i}.json`;
        
        const result = await playFab.makeHttpRequest(
          '/Client/GetTitleData',
          { Keys: [batchKey] },
          true
        );
        
        if (result.success && result.data?.Data?.[batchKey]) {
          const puzzleDataStr = result.data.Data[batchKey];
          
          if (puzzleDataStr && puzzleDataStr !== "undefined") {
            try {
              const puzzleArray = JSON.parse(puzzleDataStr);
              
              if (Array.isArray(puzzleArray)) {
                console.log(`  ✅ Batch ${i}: ${puzzleArray.length} puzzles`);
                totalPuzzlesFound += puzzleArray.length;
                
                // Sample first 3 puzzle IDs to understand format
                const sampleIds = puzzleArray.slice(0, 3).map(p => p.id || 'NO-ID').join(', ');
                console.log(`     Sample IDs: ${sampleIds}`);
                
                // Store samples for later analysis
                if (!puzzleIdSamples[dataset.name]) {
                  puzzleIdSamples[dataset.name] = [];
                }
                puzzleIdSamples[dataset.name].push(...puzzleArray.slice(0, 5).map(p => p.id || 'NO-ID'));
                
                // Search for target puzzle
                const targetPuzzle = puzzleArray.find(p => {
                  if (!p.id) return false;
                  
                  // Check various formats
                  const rawId = p.id;
                  const cleanId = rawId.replace(/^ARC-[A-Z0-9]+-/, '');
                  
                  return rawId === '11852cab' || 
                         cleanId === '11852cab' ||
                         rawId.includes('11852cab') ||
                         cleanId.includes('11852cab');
                });
                
                if (targetPuzzle) {
                  targetPuzzleFound = {
                    dataset: dataset.name,
                    batch: i,
                    puzzle: targetPuzzle,
                    batchKey
                  };
                  console.log(`  🎯 TARGET FOUND! Puzzle "11852cab" found in ${dataset.name} batch ${i}`);
                  console.log(`     Full ID in PlayFab: "${targetPuzzle.id}"`);
                }
                
              } else {
                console.log(`  ❌ Batch ${i}: Invalid data structure (not array)`);
              }
            } catch (parseError) {
              console.log(`  ❌ Batch ${i}: JSON parse error: ${parseError.message}`);
            }
          } else {
            console.log(`  ❌ Batch ${i}: No data or "undefined" value`);
          }
        } else {
          console.log(`  ❌ Batch ${i}: No data returned from PlayFab`);
          if (result.error) {
            console.log(`     Error: ${result.error}`);
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`  ❌ Batch ${i}: Exception: ${error.message}`);
      }
    }
    console.log('');
  }

  // Summary
  console.log('📊 INVESTIGATION SUMMARY');
  console.log('========================');
  console.log(`Total puzzles found: ${totalPuzzlesFound}`);
  console.log('');

  console.log('🆔 Puzzle ID Format Analysis:');
  for (const [dataset, samples] of Object.entries(puzzleIdSamples)) {
    console.log(`  ${dataset}: ${samples.slice(0, 5).join(', ')}`);
  }
  console.log('');

  if (targetPuzzleFound) {
    console.log('🎯 TARGET PUZZLE ANALYSIS');
    console.log('=========================');
    console.log(`Found in: ${targetPuzzleFound.dataset} batch ${targetPuzzleFound.batch}`);
    console.log(`PlayFab key: ${targetPuzzleFound.batchKey}`);
    console.log(`Full puzzle ID: "${targetPuzzleFound.puzzle.id}"`);
    console.log(`Puzzle data structure:`, JSON.stringify(targetPuzzleFound.puzzle, null, 2));
  } else {
    console.log('❌ TARGET PUZZLE NOT FOUND');
    console.log('==========================');
    console.log('Puzzle "11852cab" was not found in any PlayFab dataset.');
    console.log('This suggests:');
    console.log('1. The puzzle ID might be formatted differently');
    console.log('2. The puzzle might not be uploaded to PlayFab yet');
    console.log('3. The puzzle might be in a different batch key format');
    console.log('');
    console.log('🔍 Performing partial match search...');
    
    // Try partial matches
    for (const dataset of datasets) {
      for (let i = 1; i <= dataset.batches; i++) {
        try {
          const batchKey = `officer-tasks-${dataset.name}-batch${i}.json`;
          
          const result = await playFab.makeHttpRequest(
            '/Client/GetTitleData',
            { Keys: [batchKey] },
            true
          );
          
          if (result.success && result.data?.Data?.[batchKey]) {
            const puzzleDataStr = result.data.Data[batchKey];
            
            if (puzzleDataStr && puzzleDataStr !== "undefined") {
              const puzzleArray = JSON.parse(puzzleDataStr);
              
              const partialMatches = puzzleArray.filter(p => {
                if (!p.id) return false;
                const id = p.id.toLowerCase();
                return id.includes('11852') || id.includes('852cab') || id.includes('1185');
              });
              
              if (partialMatches.length > 0) {
                console.log(`  Partial matches in ${dataset.name} batch ${i}:`);
                partialMatches.forEach(p => {
                  console.log(`    - "${p.id}"`);
                });
              }
            }
          }
        } catch (error) {
          // Continue searching
        }
      }
    }
  }

  console.log('\n✅ Debug investigation complete');
}

// Helper function to extract ARC ID like the actual code does
function playFabToArcId(playFabId) {
  return playFabId.replace(/^ARC-[A-Z0-9]+-/, '');
}

if (require.main === module) {
  debugPlayFabPuzzleSearch().catch(console.error);
}

module.exports = { debugPlayFabPuzzleSearch };