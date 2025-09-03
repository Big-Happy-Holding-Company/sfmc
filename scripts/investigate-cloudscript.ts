#!/usr/bin/env tsx
/**
 * Investigate existing CloudScript functions
 * Check what validation and server-side logic already exists
 */

import dotenv from 'dotenv';
dotenv.config();

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID!;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY!;

async function callPlayFabAdmin(endpoint: string, data: any = {}) {
  const url = `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Admin/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return null;
  }
}

async function main() {
  console.log('🔍 CloudScript Investigation');
  console.log('='.repeat(50));
  
  // Get CloudScript details
  console.log('\n📄 Getting CloudScript Information...');
  const cloudScript = await callPlayFabAdmin('GetCloudScriptRevision');
  
  if (!cloudScript?.data) {
    console.log('❌ No CloudScript found');
    return;
  }
  
  console.log(`✅ CloudScript Version: ${cloudScript.data.Version}`);
  console.log(`📅 Created: ${cloudScript.data.CreatedAt}`);
  console.log(`📏 Size: ${cloudScript.data.Files?.[0]?.FileContents?.length || 0} characters`);
  
  if (cloudScript.data.Files && cloudScript.data.Files.length > 0) {
    console.log('\n📂 CloudScript Files:');
    
    cloudScript.data.Files.forEach((file: any, index: number) => {
      console.log(`\n📄 File ${index + 1}: ${file.Filename}`);
      console.log('-'.repeat(30));
      
      if (file.FileContents) {
        console.log('📝 Contents:');
        console.log(file.FileContents);
        
        // Look for specific functions
        console.log('\n🔍 Function Analysis:');
        if (file.FileContents.includes('ValidateTaskSolution')) {
          console.log('✅ Found ValidateTaskSolution function');
        }
        if (file.FileContents.includes('GenerateAnonymousName')) {
          console.log('✅ Found GenerateAnonymousName function');
        }
        if (file.FileContents.includes('handlers.')) {
          const handlerMatches = file.FileContents.match(/handlers\.(\w+)/g);
          if (handlerMatches) {
            console.log(`✅ Found handlers: ${[...new Set(handlerMatches)].join(', ')}`);
          }
        }
        
        // Check for validation logic
        if (file.FileContents.includes('solution') && file.FileContents.includes('correct')) {
          console.log('✅ Contains validation logic');
        }
        if (file.FileContents.includes('leaderboard') || file.FileContents.includes('Statistics')) {
          console.log('✅ Contains leaderboard/statistics logic');
        }
        if (file.FileContents.includes('UserData')) {
          console.log('✅ Contains user data management');
        }
      }
    });
  }
  
  // Check what client calls might exist
  console.log('\n🔍 Checking Client Integration...');
  console.log('Looking for ExecuteCloudScript calls in client code...');
  
  // This would normally check the client code, but let's document what we know
  console.log('\n📋 Current Client Validation Pattern:');
  console.log('• Client calls playFabService.validateSolution()');
  console.log('• Validation happens in browser JavaScript');  
  console.log('• Client directly updates PlayFab User Data');
  console.log('• Client directly updates Statistics/Leaderboard');
  
  console.log('\n🎯 CloudScript Usage Analysis:');
  if (cloudScript.data.Files?.[0]?.FileContents?.includes('ValidateTaskSolution')) {
    console.log('✅ Server-side validation EXISTS in CloudScript');
    console.log('❓ Need to check if client is using it or bypassing it');
  } else {
    console.log('❌ No server-side validation found in CloudScript');
    console.log('⚠️ Current client-side validation is insecure');
  }
  
  console.log('\n📊 Recommended Next Steps:');
  console.log('1. Verify if client calls ExecuteCloudScript for validation');
  console.log('2. If not, update client to use server-side validation');
  console.log('3. Document the correct API flow');
  console.log('4. Update README with security architecture');
}

main().catch(console.error);