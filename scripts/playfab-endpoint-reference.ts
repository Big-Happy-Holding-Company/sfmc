#!/usr/bin/env tsx
/**
 * PlayFab Endpoint Reference - Complete list of available endpoints
 * Based on your secret key access level
 */

import dotenv from 'dotenv';
dotenv.config();

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID!;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY!;

console.log('📋 PlayFab API Endpoint Reference');
console.log(`🎮 Title: ${PLAYFAB_TITLE_ID}`);
console.log('='.repeat(60));

// Get the CloudScript to see what custom functions exist
async function getCloudScriptFunctions() {
  try {
    const response = await fetch(`https://${PLAYFAB_TITLE_ID}.playfabapi.com/Admin/GetCloudScriptRevision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY
      },
      body: JSON.stringify({})
    });

    const result = await response.json();
    if (result.data?.Files) {
      return result.data.Files;
    }
  } catch (error) {
    console.log('Could not fetch CloudScript details');
  }
  return [];
}

async function main() {
  console.log('\n🔧 ADMIN API ENDPOINTS (Secret Key Required)');
  console.log('='.repeat(50));
  console.log('These are the endpoints YOU can call with your secret key:');
  
  console.log('\n📊 Title Data Management:');
  console.log('• Admin/GetTitleData - Get all title configuration data');
  console.log('• Admin/SetTitleData - Set title configuration data');
  console.log('• Admin/GetTitleInternalData - Get internal title data');
  console.log('• Admin/SetTitleInternalData - Set internal title data');
  
  console.log('\n👥 Player Management:');
  console.log('• Admin/GetUserAccountInfo - Get player account details');
  console.log('• Admin/GetUserData - Get player custom data');
  console.log('• Admin/UpdateUserData - Update player custom data');
  console.log('• Admin/GetUserInternalData - Get player internal data');
  console.log('• Admin/UpdateUserInternalData - Update player internal data');
  console.log('• Admin/GetUserReadOnlyData - Get player read-only data');
  console.log('• Admin/UpdateUserReadOnlyData - Update player read-only data');
  console.log('• Admin/ResetUserStatistics - Reset player statistics');
  console.log('• Admin/BanUsers - Ban players');
  console.log('• Admin/GetUserBans - Get player ban status');
  console.log('• Admin/RevokeAllBansForUser - Remove all bans for player');
  
  console.log('\n📈 Statistics & Leaderboards:');
  console.log('• Admin/CreatePlayerStatisticDefinition - Create new statistic');
  console.log('• Admin/GetPlayerStatisticDefinitions - Get all statistics');
  console.log('• Admin/GetPlayerStatisticVersions - Get statistic versions');
  console.log('• Admin/IncrementPlayerStatisticVersion - Version a statistic');
  console.log('• Admin/UpdatePlayerStatisticDefinition - Update statistic settings');
  console.log('• Admin/GetLeaderboard - Get leaderboard data');
  console.log('• Admin/GetLeaderboardAroundUser - Get leaderboard around specific player');
  
  console.log('\n🏪 Virtual Economy:');
  console.log('• Admin/GetCatalogItems - Get catalog items');
  console.log('• Admin/SetCatalogItems - Update catalog items');
  console.log('• Admin/GetStoreItems - Get store configuration');
  console.log('• Admin/SetStoreItems - Update store configuration');
  console.log('• Admin/GetUserInventory - Get player inventory');
  console.log('• Admin/GrantItemsToUsers - Give items to players');
  console.log('• Admin/RevokeInventoryItems - Remove items from players');
  
  console.log('\n☁️ CloudScript:');
  const cloudScriptFiles = await getCloudScriptFunctions();
  console.log('• Admin/GetCloudScriptRevision - Get CloudScript details');
  console.log('• Admin/UpdateCloudScript - Update CloudScript functions');
  if (cloudScriptFiles.length > 0) {
    console.log('• Your current CloudScript files:');
    cloudScriptFiles.forEach((file: any) => {
      console.log(`  📄 ${file.Filename}`);
    });
  }
  
  console.log('\n🎯 Segments & Analytics:');
  console.log('• Admin/GetAllSegments - Get player segments');
  console.log('• Admin/CreateSegment - Create new player segment');
  console.log('• Admin/GetPlayersInSegment - Get players in segment');
  
  console.log('\n📱 Push Notifications:');
  console.log('• Admin/SetupPushNotification - Configure push notifications');
  console.log('• Admin/SendPushNotification - Send push to players');
  
  console.log('\n🔧 SERVER API ENDPOINTS (Secret Key Required)');
  console.log('='.repeat(50));
  console.log('Server-authoritative operations:');
  
  console.log('\n🎮 Player Operations:');
  console.log('• Server/GetUserAccountInfo - Get player account info');
  console.log('• Server/GetUserData - Get player data');
  console.log('• Server/UpdateUserData - Update player data');
  console.log('• Server/GetUserInternalData - Get player internal data');
  console.log('• Server/UpdateUserInternalData - Update player internal data');
  console.log('• Server/GetUserReadOnlyData - Get player read-only data');
  console.log('• Server/UpdateUserReadOnlyData - Update player read-only data');
  
  console.log('\n📊 Statistics:');
  console.log('• Server/GetPlayerStatistics - Get player statistics');
  console.log('• Server/UpdatePlayerStatistics - Update player statistics');
  console.log('• Server/GetLeaderboard - Get leaderboard');
  console.log('• Server/GetLeaderboardAroundUser - Get leaderboard around player');
  
  console.log('\n💰 Virtual Economy:');
  console.log('• Server/GetUserInventory - Get player inventory');
  console.log('• Server/GrantItemsToUser - Give items to player');
  console.log('• Server/ConsumeItem - Consume player item');
  console.log('• Server/ModifyItemUses - Modify item usage count');
  
  console.log('\n📱 CLIENT API ENDPOINTS (Used by React App)');
  console.log('='.repeat(50));
  console.log('These are used by your React application:');
  
  console.log('\n🔐 Authentication:');
  console.log('• Client/LoginWithCustomID - Anonymous login (✅ Used)');
  console.log('• Client/LoginWithEmailAddress - Email login');
  console.log('• Client/RegisterPlayFabUser - Register new user');
  
  console.log('\n📊 Title Data:');
  console.log('• Client/GetTitleData - Get title data (✅ Used for tasks)');
  console.log('• Client/GetTitleNews - Get title news');
  
  console.log('\n👤 Player Data:');
  console.log('• Client/GetUserData - Get player data (✅ Used for progress)');
  console.log('• Client/UpdateUserData - Update player data (✅ Used for progress)');
  console.log('• Client/GetUserReadOnlyData - Get read-only player data');
  
  console.log('\n📈 Statistics:');
  console.log('• Client/GetPlayerStatistics - Get player stats');
  console.log('• Client/UpdatePlayerStatistics - Update stats (✅ Used for scores)');
  console.log('• Client/GetLeaderboard - Get leaderboard (✅ Used for rankings)');
  console.log('• Client/GetLeaderboardAroundPlayer - Get leaderboard around player');
  
  console.log('\n📝 Events:');
  console.log('• Client/WritePlayerEvent - Write game event (✅ Used for analytics)');
  console.log('• Client/WriteCharacterEvent - Write character event');
  
  console.log('\n☁️ CloudScript:');
  console.log('• Client/ExecuteCloudScript - Execute CloudScript function');
  
  console.log('\n🎯 YOUR CURRENT USAGE PATTERN:');
  console.log('='.repeat(40));
  console.log('✅ React App → Client API (public endpoints)');
  console.log('✅ Tasks stored in Title Data');
  console.log('✅ Progress stored in User Data'); 
  console.log('✅ Leaderboards via Statistics API');
  console.log('✅ Anonymous authentication working');
  console.log('');
  console.log('🚀 POTENTIAL ENHANCEMENTS:');
  console.log('• Add CloudScript for server-side validation');
  console.log('• Set up virtual economy (items, rewards)');
  console.log('• Create player segments for analytics');
  console.log('• Add push notifications');
  console.log('• Implement A/B testing via segments');
}

main().catch(console.error);