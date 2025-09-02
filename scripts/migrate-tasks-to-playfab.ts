/**
 * PlayFab Task Migration Script
 * 
 * This script migrates all 155 task files from the local server storage 
 * to PlayFab Title Data, making PlayFab the single source of truth.
 */

import path from 'path';
import { taskLoader } from '../server/services/taskLoader.js';
import type { Task } from '../shared/schema.js';

// PlayFab Admin SDK (would need to be installed)
// For now, we'll prepare the data and show what needs to be uploaded

interface PlayFabTaskData {
  AllTasks: string; // JSON string of all tasks
}

async function migrateTasksToPlayFab() {
  console.log('🚀 Starting PlayFab Task Migration...');
  
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
    
    // Step 3: Save prepared data to JSON file for manual upload
    const outputPath = path.resolve(process.cwd(), 'playfab-task-data.json');
    console.log(`📝 Attempting to write ${playfabData.AllTasks.length} characters to ${outputPath}`);
    
    try {
      const fs = await import('fs');
      await fs.promises.writeFile(outputPath, JSON.stringify(playfabData, null, 2));
      console.log(`\n💾 Successfully wrote data to: ${outputPath}`);
    } catch (writeError) {
      console.error(`❌ Failed to write file to ${outputPath}`, writeError);
      return {
        success: false,
        error: `File write error: ${(writeError as Error).message}`
      };
    }
    
    return {
      success: true,
      tasksCount: allTasks.length,
      dataSize: playfabData.AllTasks.length,
      outputPath
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
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateTasksToPlayFab()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Migration preparation completed successfully!');
      } else {
        console.error('\n💥 Migration failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

export { migrateTasksToPlayFab };