/**
 * PlayFab Task Migration Script
 * 
 * This script migrates all 155 task files from the local server storage 
 * to PlayFab Title Data, making PlayFab the single source of truth.
 */

import path from 'path';
import { taskLoader } from '../server/services/taskLoader';
import type { Task } from '../shared/schema';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// PlayFab Admin SDK (would need to be installed)
// For now, we'll prepare the data and show what needs to be uploaded

interface PlayFabTaskData {
  AllTasks: string; // JSON string of all tasks
}

async function migrateTasksToPlayFab() {
  console.log('🚀 Starting PlayFab Task Migration...');
  console.log('📋 Environment check:');
  console.log(`   PLAYFAB_SECRET_KEY: ${process.env.PLAYFAB_SECRET_KEY ? 'SET' : 'MISSING'}`);
  console.log(`   PLAYFAB_TITLE_ID: ${process.env.PLAYFAB_TITLE_ID ? 'SET' : 'MISSING'}`);
  
  try {
    // Step 1: Load all tasks from current server storage
    console.log('📂 Loading tasks from server storage...');
    const allTasks = await taskLoader.loadAllTasks();
    
    console.log(`✅ Loaded ${allTasks.length} tasks from server storage`);
    if (allTasks.length === 0) {
      console.log('⚠️  No tasks found. Check task directory path.');
      return { success: false, error: 'No tasks found' };
    }
    
    // Step 2: Prepare data for PlayFab Title Data
    console.log('🔄 Preparing data for PlayFab Title Data...');
    
    // Convert tasks to PlayFab Title Data format
    const playfabData: PlayFabTaskData = {
      AllTasks: JSON.stringify(allTasks)
    };
    
    // Step 3: Save prepared data to JSON file for backup
    const outputPath = path.resolve(process.cwd(), 'playfab-task-data.json');
    console.log(`📝 Attempting to write ${playfabData.AllTasks.length} characters to ${outputPath}`);
    
    try {
      const fs = await import('fs');
      await fs.promises.writeFile(outputPath, JSON.stringify(playfabData, null, 2));
      console.log(`\n💾 Successfully wrote backup to: ${outputPath}`);
    } catch (writeError) {
      console.error(`❌ Failed to write file to ${outputPath}`, writeError);
      return {
        success: false,
        error: `File write error: ${(writeError as Error).message}`
      };
    }
    
    // Step 4: Push to PlayFab SetTitleData API
    console.log('🚀 Pushing tasks to PlayFab Title Data...');
    
    const secretKey = process.env.PLAYFAB_SECRET_KEY;
    const titleId = process.env.PLAYFAB_TITLE_ID;
    
    if (!secretKey) {
      console.error('❌ PLAYFAB_SECRET_KEY not found in environment variables');
      return { success: false, error: 'PLAYFAB_SECRET_KEY not configured' };
    }
    
    if (!titleId) {
      console.error('❌ PLAYFAB_TITLE_ID not found in environment variables');
      return { success: false, error: 'PLAYFAB_TITLE_ID not configured' };
    }
    
    const playfabUrl = `https://${titleId}.playfabapi.com/Admin/SetTitleData`;
    
    const requestBody = {
      Key: 'tasks.json',
      Value: JSON.stringify(allTasks)
    };
    
    try {
      const response = await fetch(playfabUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SecretKey': secretKey
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ PlayFab API error:', result);
        return { 
          success: false, 
          error: `PlayFab API error: ${result.errorMessage || 'Unknown error'}` 
        };
      }
      
      console.log('✅ Successfully uploaded tasks to PlayFab Title Data');
      console.log(`📊 Data pushed: ${requestBody.Value.length} characters`);
      
    } catch (apiError) {
      console.error('❌ Failed to call PlayFab API:', apiError);
      return {
        success: false,
        error: `PlayFab API call failed: ${(apiError as Error).message}`
      };
    }
    
    return {
      success: true,
      tasksCount: allTasks.length,
      dataSize: playfabData.AllTasks.length,
      outputPath,
      playfabUploaded: true
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run if called directly
console.log('🔥 ABOUT TO CALL FUNCTION');
migrateTasksToPlayFab()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.error('\n💥 Migration failed:', result.error);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });

export { migrateTasksToPlayFab };