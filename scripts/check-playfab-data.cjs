/**
 * PlayFab Data Investigation Script
 * 
 * Purpose: Check what Title Data keys actually exist in PlayFab
 * and inspect their contents to understand the current state
 */

const https = require('https');
require('dotenv').config();

const PLAYFAB_TITLE_ID = process.env.VITE_PLAYFAB_TITLE_ID || '19FACB';
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;

if (!PLAYFAB_SECRET_KEY) {
  console.error('❌ ERROR: PLAYFAB_SECRET_KEY not set in .env file');
  process.exit(1);
}

console.log('🔍 PlayFab Data Investigation');
console.log('============================');
console.log(`Title ID: ${PLAYFAB_TITLE_ID}`);

async function checkPlayFabData() {
  try {
    console.log('\n📋 Step 1: Getting all Title Data keys...');
    
    // Use Admin API to get all Title Data keys
    const allData = await makePlayFabRequest('/Admin/GetTitleData', {});
    
    if (allData && allData.Data) {
      const keys = Object.keys(allData.Data);
      console.log(`✅ Found ${keys.length} Title Data keys:`);
      
      keys.forEach(key => {
        const valueLength = allData.Data[key]?.length || 0;
        console.log(`   📝 ${key} (${valueLength} characters)`);
      });
      
      console.log('\n🔍 Step 2: Inspecting officer-related keys...');
      
      // Look for officer-related keys
      const officerKeys = keys.filter(key => key.includes('officer'));
      if (officerKeys.length > 0) {
        console.log(`📦 Found ${officerKeys.length} officer-related keys:`);
        
        for (const key of officerKeys) {
          const data = allData.Data[key];
          console.log(`\n   🔍 ${key}:`);
          console.log(`      Length: ${data.length} characters`);
          
          if (data === "undefined") {
            console.log(`      ❌ Contains "undefined" string`);
          } else if (data.length < 100) {
            console.log(`      📄 Content: ${data}`);
          } else {
            try {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed)) {
                console.log(`      📊 JSON Array with ${parsed.length} items`);
                if (parsed.length > 0 && parsed[0].id) {
                  console.log(`      🎯 First item ID: ${parsed[0].id}`);
                }
              } else {
                console.log(`      📦 JSON Object with keys: ${Object.keys(parsed).join(', ')}`);
              }
            } catch (e) {
              console.log(`      ⚠️  Not valid JSON: ${data.substring(0, 50)}...`);
            }
          }
        }
      } else {
        console.log('❌ No officer-related keys found');
      }
      
      console.log('\n📊 Step 3: Summary of all keys:');
      keys.forEach(key => {
        const data = allData.Data[key];
        let status = 'Unknown';
        
        if (data === "undefined") {
          status = '❌ "undefined" string';
        } else {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              status = `✅ Array[${parsed.length}]`;
            } else {
              status = `✅ Object`;
            }
          } catch (e) {
            status = '⚠️ Not JSON';
          }
        }
        
        console.log(`   ${key}: ${status}`);
      });
      
    } else {
      console.log('❌ No Title Data found');
    }
    
  } catch (error) {
    console.error('💥 Investigation failed:', error.message);
  }
}

async function makePlayFabRequest(endpoint, requestData) {
  const url = `https://${PLAYFAB_TITLE_ID}.playfabapi.com${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-SecretKey': PLAYFAB_SECRET_KEY
  };
  
  const requestBody = JSON.stringify(requestData);
  
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.code === 200) {
            resolve(response.data);
          } else {
            reject(new Error(`PlayFab API Error: ${response.error || 'Unknown error'}`));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(requestBody);
    req.end();
  });
}

// Run the investigation
checkPlayFabData();