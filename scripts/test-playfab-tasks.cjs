/*
 * PlayFab Task Retrieval Test
 * 
 * Tests that tasks can be retrieved from PlayFab after sync
 * Run this after sync-tasks-to-playfab.cjs to verify data
 */

const PlayFabClient = require('playfab-sdk').PlayFabClient;

PlayFabClient.settings.titleId = "19FACB";

console.log("=== PlayFab Task Retrieval Test ===");

// Test function
async function testTaskRetrieval() {
    try {
        // Login first (required for client API calls)
        console.log("1. Logging in...");
        
        await new Promise((resolve, reject) => {
            PlayFabClient.LoginWithCustomID({
                CustomId: "task-test-user",
                CreateAccount: true
            }, function(result, error) {
                if (error) {
                    reject(error);
                } else {
                    console.log("   ✅ Login successful");
                    resolve(result);
                }
            });
        });

        // Retrieve tasks from PlayFab
        console.log("\n2. Retrieving tasks from PlayFab...");
        
        const tasks = await new Promise((resolve, reject) => {
            PlayFabClient.GetTitleData({
                Keys: ["AllTasks"]
            }, function(result, error) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });

        // Parse and display results
        if (tasks.data.Data && tasks.data.Data.AllTasks) {
            const taskArray = JSON.parse(tasks.data.Data.AllTasks);
            
            console.log("   ✅ Tasks retrieved successfully!");
            console.log(`   Total tasks: ${taskArray.length}`);
            
            console.log("\n3. Sample tasks:");
            taskArray.slice(0, 5).forEach((task, index) => {
                console.log(`   ${index + 1}. ${task.id} - ${task.title} (${task.category})`);
            });

            // Verify task structure
            console.log("\n4. Task structure validation:");
            const sampleTask = taskArray[0];
            const requiredFields = ['id', 'title', 'description', 'category', 'difficulty', 'gridSize', 'examples', 'testInput', 'testOutput'];
            
            const missingFields = requiredFields.filter(field => !(field in sampleTask));
            if (missingFields.length === 0) {
                console.log("   ✅ All required fields present");
            } else {
                console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
            }

            console.log("\n🎉 Test completed successfully!");
            console.log("✅ PlayFab task retrieval is working");
            
        } else {
            console.error("❌ No task data found in PlayFab");
            console.error("   Make sure to run sync-tasks-to-playfab.cjs first");
        }

    } catch (error) {
        console.error("❌ Test failed:", error);
        throw error;
    }
}

// Run the test
testTaskRetrieval()
    .then(() => {
        console.log("\n✅ Ready for Unity and React integration!");
    })
    .catch((error) => {
        console.error("\n💥 Test failed:", error);
        process.exit(1);
    });