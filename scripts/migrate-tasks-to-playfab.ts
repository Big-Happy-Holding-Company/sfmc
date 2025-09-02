/**
 * PlayFab Task Migration Script
 * 
 * This script migrates all 155 task files from the local server storage 
 * to PlayFab Title Data, making PlayFab the single source of truth.
 */

import { taskLoader } from '../server/services/taskLoader.js';
import type { Task } from '../shared/schema';

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
    
    // Step 2: Prepare data for PlayFab Title Data
    console.log('🔄 Preparing data for PlayFab Title Data...');
    
    // Convert tasks to PlayFab Title Data format
    const playfabData: PlayFabTaskData = {
      AllTasks: JSON.stringify(allTasks)
    };
    
    // Step 3: Show preview of data structure
    console.log('\n📊 Migration Data Preview:');
    console.log(`- Total tasks: ${allTasks.length}`);
    console.log(`- Data size: ${(playfabData.AllTasks.length / 1024).toFixed(2)} KB`);
    console.log(`- First task: ${allTasks[0]?.id} - ${allTasks[0]?.title}`);
    console.log(`- Last task: ${allTasks[allTasks.length - 1]?.id} - ${allTasks[allTasks.length - 1]?.title}`);
    
    // Step 4: Validate task categories
    const categories = new Set(allTasks.map(task => task.category));
    console.log(`\n🏷️  Task Categories (${categories.size}):`);
    categories.forEach(category => {
      const count = allTasks.filter(task => task.category === category).length;
      console.log(`  - ${category}: ${count} tasks`);
    });
    
    // Step 5: Save prepared data to JSON file for manual upload
    const outputPath = './playfab-task-data.json';
    const fs = await import('fs');
    await fs.promises.writeFile(outputPath, JSON.stringify(playfabData, null, 2));
    
    console.log(`\n💾 Prepared data saved to: ${outputPath}`);
    console.log('\n📋 Next Steps:');
    console.log('1. Upload this data to PlayFab Title Data with key "AllTasks"');
    console.log('2. Use PlayFab Game Manager or Admin API');
    console.log('3. Test React app can retrieve tasks via GetTitleData()');
    console.log('4. Update Unity to use PlayFab instead of server API');
    
    // Step 6: Show sample task structure
    console.log('\n🔍 Sample Task Structure:');
    console.log(JSON.stringify(allTasks[0], null, 2));
    
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

// Manual PlayFab Upload Instructions
function showManualUploadInstructions() {
  console.log('\n📖 Manual PlayFab Upload Instructions:');
  console.log('1. Go to PlayFab Game Manager (https://developer.playfab.com/)');
  console.log('2. Select your title (19FACB)');
  console.log('3. Navigate to: Content > Title Data');
  console.log('4. Click "New Title Data"');
  console.log('5. Set Key: "AllTasks"');
  console.log('6. Copy the JSON content from playfab-task-data.json');
  console.log('7. Paste into Value field');
  console.log('8. Click "Save Title Data"');
  console.log('9. Test with GetTitleData API call');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateTasksToPlayFab()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Migration preparation completed successfully!');
        showManualUploadInstructions();
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