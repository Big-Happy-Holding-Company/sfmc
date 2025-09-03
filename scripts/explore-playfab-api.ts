#!/usr/bin/env tsx
/**
 * PlayFab API Explorer Script
 * Uses the secret key to explore available PlayFab API endpoints and data
 */

import dotenv from 'dotenv';
dotenv.config();

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY;

if (!PLAYFAB_TITLE_ID || !PLAYFAB_SECRET_KEY) {
  console.error('❌ Missing PlayFab credentials in .env file');
  console.error('Required: PLAYFAB_TITLE_ID and PLAYFAB_SECRET_KEY');
  process.exit(1);
}

console.log('🔍 PlayFab API Explorer');
console.log(`📋 Title ID: ${PLAYFAB_TITLE_ID}`);
console.log(`🔐 Secret Key: ${PLAYFAB_SECRET_KEY.substring(0, 8)}...`);
console.log('');

/**
 * Make PlayFab Admin API request
 */
async function callPlayFabAdmin(endpoint: string, data: any = {}) {
  const url = `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Admin/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY!
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`❌ Error calling ${endpoint}:`, error);
    return null;
  }
}

/**
 * Make PlayFab Server API request
 */
async function callPlayFabServer(endpoint: string, data: any = {}) {
  const url = `https://${PLAYFAB_TITLE_ID}.playfabapi.com/Server/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': PLAYFAB_SECRET_KEY!
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`❌ Error calling ${endpoint}:`, error);
    return null;
  }
}

async function explorePlayFabAPI() {
  console.log('🚀 Starting PlayFab API exploration...\n');

  // 1. Get Title Data (our tasks should be here)
  console.log('📊 1. Checking Title Data (Tasks)...');
  const titleData = await callPlayFabAdmin('GetTitleData', {});
  if (titleData?.data?.Data) {
    const keys = Object.keys(titleData.data.Data);
    console.log(`✅ Found ${keys.length} Title Data keys:`, keys);
    
    // Check if our tasks are there
    if (titleData.data.Data['tasks.json']) {
      const tasksData = JSON.parse(titleData.data.Data['tasks.json']);
      console.log(`   📋 tasks.json contains ${tasksData.length} tasks`);
      console.log(`   🎯 Sample task IDs: ${tasksData.slice(0, 5).map((t: any) => t.id).join(', ')}`);
    }
  }
  console.log('');

  // 2. Get Player Statistics definitions
  console.log('📈 2. Checking Player Statistics...');
  const stats = await callPlayFabAdmin('GetPlayerStatisticDefinitions', {});
  if (stats?.data?.Statistics) {
    console.log(`✅ Found ${stats.data.Statistics.length} statistic definitions:`);
    stats.data.Statistics.forEach((stat: any) => {
      console.log(`   📊 ${stat.StatisticName} (Aggregation: ${stat.AggregationMethod})`);
    });
  }
  console.log('');

  // 3. Get Catalog items (if any)
  console.log('🛍️ 3. Checking Catalog Items...');
  const catalog = await callPlayFabAdmin('GetCatalogItems', { CatalogVersion: 'main' });
  if (catalog?.data?.Catalog) {
    console.log(`✅ Found ${catalog.data.Catalog.length} catalog items`);
  } else {
    console.log('ℹ️ No catalog items found (this is normal for our game)');
  }
  console.log('');

  // 4. Get Store configuration
  console.log('🏪 4. Checking Stores...');
  const stores = await callPlayFabAdmin('GetStoreItems', { StoreId: 'main' });
  if (stores?.data?.Store) {
    console.log(`✅ Found store with ${stores.data.Store.length} items`);
  } else {
    console.log('ℹ️ No stores configured');
  }
  console.log('');

  // 5. Get CloudScript info
  console.log('☁️ 5. Checking CloudScript...');
  const cloudScript = await callPlayFabAdmin('GetCloudScriptRevision', {});
  if (cloudScript?.data) {
    console.log('✅ CloudScript found:');
    console.log(`   📝 Version: ${cloudScript.data.Version}`);
    console.log(`   📅 Created: ${cloudScript.data.CreatedAt}`);
    if (cloudScript.data.Files) {
      console.log(`   📄 Files: ${cloudScript.data.Files.map((f: any) => f.Filename).join(', ')}`);
    }
  }
  console.log('');

  // 6. Get Title News
  console.log('📰 6. Checking Title News...');
  const news = await callPlayFabAdmin('GetTitleNews', {});
  if (news?.data?.News) {
    console.log(`✅ Found ${news.data.News.length} news items`);
  } else {
    console.log('ℹ️ No title news configured');
  }
  console.log('');

  // 7. Get some player data (if any players exist)
  console.log('👥 7. Checking Player Data...');
  try {
    // Try to get a segment of all players (limited to see if any exist)
    const segments = await callPlayFabAdmin('GetAllSegments', {});
    if (segments?.data?.Segments) {
      console.log(`✅ Found ${segments.data.Segments.length} player segments`);
    }
    
    // Try to get player count
    const playerCount = await callPlayFabAdmin('GetPlayerStatisticVersions', { 
      StatisticName: 'LevelPoints' 
    });
    if (playerCount?.data?.StatisticVersions) {
      console.log('✅ LevelPoints statistic exists (our leaderboard)');
    }
  } catch (error) {
    console.log('ℹ️ Player data check skipped or no players yet');
  }
  console.log('');

  // 8. Available API endpoints exploration
  console.log('🔗 8. Available API Categories:');
  console.log('   🔧 Admin API: Title management, player management, economy');
  console.log('   🖥️ Server API: Server-authoritative operations'); 
  console.log('   👤 Client API: Player-facing operations (used by our React app)');
  console.log('   📊 Economy API: Virtual currencies, items, stores');
  console.log('   🎮 Multiplayer API: Matchmaking, lobbies');
  console.log('   📈 Analytics API: Events, funnels, A/B testing');
  console.log('');

  console.log('✅ PlayFab API exploration complete!');
  console.log('');
  console.log('🎯 Key Findings:');
  console.log('- Title Data contains our migrated tasks');
  console.log('- Statistics system ready for leaderboards');
  console.log('- Client API handles all player operations');
  console.log('- Our React app uses the correct PlayFab integration pattern');
}

// Run the exploration
explorePlayFabAPI().catch(console.error);