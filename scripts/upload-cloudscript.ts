#!/usr/bin/env tsx
/**
 * Upload CloudScript to PlayFab via Admin API
 * Uses PLAYFAB_SECRET_KEY from .env to upload cloudscript.js
 */

import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLAYFAB_TITLE_ID = process.env.VITE_PLAYFAB_TITLE_ID!;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY!;

async function uploadCloudScript() {
  console.log('☁️ Uploading CloudScript to PlayFab');
  console.log(`🎮 Title ID: ${PLAYFAB_TITLE_ID}`);
  console.log('='.repeat(50));

  // Read the CloudScript file
  const cloudScriptPath = path.resolve(process.cwd(), 'cloudscript.js');
  console.log(`📂 Reading: ${cloudScriptPath}`);
  
  let cloudScriptContent: string;
  try {
    cloudScriptContent = readFileSync(cloudScriptPath, 'utf8');
    console.log(`📄 File size: ${cloudScriptContent.length} characters`);
  } catch (error) {
    console.error('❌ Failed to read cloudscript.js:', error);
    process.exit(1);
  }

  // Prepare the request
  const requestData = {
    Files: [
      {
        Filename: 'cloudscript.js',
        FileContents: cloudScriptContent
      }
    ],
    Publish: true, // Automatically publish after upload
    DeveloperPlayFabId: null // Optional, can be omitted
  };

  const url = `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Admin/UpdateCloudScript`;

  try {
    console.log('📤 Uploading to PlayFab...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();

    if (response.ok && result.code === 200) {
      console.log('✅ CloudScript uploaded successfully!');
      console.log(`📄 Revision: ${result.data?.Revision || 'Unknown'}`);
      console.log(`📅 Uploaded: ${new Date().toISOString()}`);
      
      // List the functions that were uploaded
      console.log('\n🔍 CloudScript Functions Available:');
      if (cloudScriptContent.includes('handlers.ValidateTaskSolution')) {
        console.log('✅ ValidateTaskSolution - Server-side puzzle validation');
      }
      if (cloudScriptContent.includes('handlers.GenerateAnonymousName')) {
        console.log('✅ GenerateAnonymousName - Anonymous name generation');
      }
      if (cloudScriptContent.includes('handlers.GetServerInfo')) {
        console.log('✅ GetServerInfo - Debugging function');
      }
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Test your React app validation functionality');
      console.log('2. Verify that "CloudScriptNotFound" errors are resolved');
      console.log('3. Check console for successful task validation');
      
    } else {
      console.error('❌ Failed to upload CloudScript:');
      console.error('Response:', result);
      
      if (result.error) {
        console.error(`Error: ${result.error}`);
      }
      if (result.errorMessage) {
        console.error(`Message: ${result.errorMessage}`);
      }
      
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Network error uploading CloudScript:', error);
    process.exit(1);
  }
}

// Check environment variables
if (!PLAYFAB_TITLE_ID) {
  console.error('❌ VITE_PLAYFAB_TITLE_ID not found in .env');
  process.exit(1);
}

if (!PLAYFAB_SECRET_KEY) {
  console.error('❌ PLAYFAB_SECRET_KEY not found in .env');
  process.exit(1);
}

uploadCloudScript().catch(console.error);
