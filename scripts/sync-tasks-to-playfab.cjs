/*
 * PlayFab Task Sync Script
 * 
 * Uploads all JSON task files from data/tasks/ to PlayFab Title Data
 * Run this once to migrate all tasks to PlayFab
 */

const fs = require('fs');
const path = require('path');
const PlayFabAdmin = require('playfab-sdk').PlayFabAdmin;

// PlayFab Configuration
const TITLE_ID = "19FACB";
const TASKS_DIRECTORY = path.join(__dirname, '../data/tasks');

// You'll need to get your Developer Secret Key from PlayFab Game Manager
// Go to: Settings > API Features > Secret Keys
const DEVELOPER_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;

if (!DEVELOPER_SECRET_KEY) {
    console.error("❌ PLAYFAB_SECRET_KEY environment variable not set");
    console.error("   Get your secret key from PlayFab Game Manager > Settings > API Features > Secret Keys");
    process.exit(1);
}

// Configure PlayFab Admin API
PlayFabAdmin.settings.titleId = TITLE_ID;
PlayFabAdmin.settings.developerSecretKey = DEVELOPER_SECRET_KEY;

console.log("=== PlayFab Task Sync ===");
console.log(`Title ID: ${TITLE_ID}`);
console.log(`Tasks Directory: ${TASKS_DIRECTORY}`);

async function syncTasksToPlayFab() {
    try {
        // Read all JSON files from tasks directory
        console.log("\n1. Reading task files...");
        const taskFiles = fs.readdirSync(TASKS_DIRECTORY).filter(file => file.endsWith('.json'));
        console.log(`Found ${taskFiles.length} task files`);

        if (taskFiles.length === 0) {
            console.error("❌ No task files found in directory");
            return;
        }

        // Load and consolidate all tasks
        console.log("\n2. Loading task data...");
        const allTasks = [];
        
        for (const filename of taskFiles) {
            const filePath = path.join(TASKS_DIRECTORY, filename);
            try {
                const taskData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                allTasks.push(taskData);
                console.log(`   ✅ Loaded: ${taskData.id} - ${taskData.title}`);
            } catch (error) {
                console.error(`   ❌ Failed to load ${filename}: ${error.message}`);
            }
        }

        console.log(`\nTotal tasks loaded: ${allTasks.length}`);

        // Upload to PlayFab Title Data
        console.log("\n3. Uploading to PlayFab...");
        
        return new Promise((resolve, reject) => {
            PlayFabAdmin.SetTitleData({
                Key: "AllTasks",
                Value: JSON.stringify(allTasks)
            }, function(result, error) {
                if (error) {
                    console.error("❌ PlayFab upload failed:", error);
                    reject(error);
                } else {
                    console.log("✅ Tasks successfully uploaded to PlayFab!");
                    console.log(`   Key: AllTasks`);
                    console.log(`   Tasks: ${allTasks.length}`);
                    resolve(result);
                }
            });
        });

    } catch (error) {
        console.error("❌ Sync failed:", error);
        throw error;
    }
}

// Run the sync
syncTasksToPlayFab()
    .then(() => {
        console.log("\n🎉 Sync completed successfully!");
        console.log("\nNext steps:");
        console.log("1. Test data retrieval with test script");
        console.log("2. Update Unity to use PlayFab GetTitleData()");
        console.log("3. Update React to use PlayFab GetTitleData()");
    })
    .catch((error) => {
        console.error("\n💥 Sync failed:", error);
        process.exit(1);
    });