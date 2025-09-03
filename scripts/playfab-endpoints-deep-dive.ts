#!/usr/bin/env tsx
/**
 * PlayFab API Deep Dive - Comprehensive endpoint exploration
 * Explores all available PlayFab APIs with your secret key
 */

import dotenv from 'dotenv';
dotenv.config();

const PLAYFAB_TITLE_ID = process.env.PLAYFAB_TITLE_ID!;
const PLAYFAB_SECRET_KEY = process.env.PLAYFAB_SECRET_KEY!;

console.log('🔍 PlayFab API Deep Dive');
console.log(`📋 Title ID: ${PLAYFAB_TITLE_ID}`);
console.log('='.repeat(50));

async function callPlayFabAPI(apiType: string, endpoint: string, data: any = {}) {
  const url = `https://${PLAYFAB_TITLE_ID}.playfabapi.com/${apiType}/${endpoint}`;
  
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
    
    if (!response.ok) {
      return { 
        success: false, 
        error: result.errorMessage || `HTTP ${response.status}`,
        code: result.error
      };
    }
    
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function exploreEndpoint(apiType: string, endpoint: string, data?: any, description?: string) {
  const result = await callPlayFabAPI(apiType, endpoint, data);
  
  if (result.success) {
    console.log(`✅ ${apiType}/${endpoint} ${description ? `(${description})` : ''}`);
    return result.data;
  } else {
    console.log(`❌ ${apiType}/${endpoint} - ${result.error}`);
    return null;
  }
}

async function main() {
  console.log('\n📊 ADMIN API ENDPOINTS:');
  console.log('-'.repeat(30));
  
  // Title Data Management
  const titleData = await exploreEndpoint('Admin', 'GetTitleData', {}, 'Get all title data');
  
  // Player Statistics
  await exploreEndpoint('Admin', 'GetPlayerStatisticDefinitions', {}, 'Get stat definitions');
  
  // Title Configuration  
  await exploreEndpoint('Admin', 'GetTitleInternalData', {}, 'Get internal title data');
  
  // Policy & Settings
  await exploreEndpoint('Admin', 'GetPolicy', { PolicyName: 'ApiPolicy' }, 'Get API policy');
  
  // Player Management
  await exploreEndpoint('Admin', 'GetAllSegments', {}, 'Get player segments');
  
  // CloudScript
  await exploreEndpoint('Admin', 'GetCloudScriptRevision', {}, 'Get CloudScript details');
  
  console.log('\n🖥️ SERVER API ENDPOINTS:');
  console.log('-'.repeat(30));
  
  // Authentication & Players
  await exploreEndpoint('Server', 'GetTitleData', {}, 'Server: Get title data');
  
  // Player Data (need player ID, so this will likely fail)
  await exploreEndpoint('Server', 'GetLeaderboard', { 
    StatisticName: 'LevelPoints', 
    StartPosition: 0, 
    MaxResultsCount: 10 
  }, 'Get leaderboard');
  
  console.log('\n📊 ECONOMY API ENDPOINTS:');
  console.log('-'.repeat(30));
  
  await exploreEndpoint('Economy', 'GetItems', {}, 'Get economy items');
  
  console.log('\n🎯 EVENTS API ENDPOINTS:');
  console.log('-'.repeat(30));
  
  await exploreEndpoint('Events', 'GetTelemetryKey', {}, 'Get telemetry key');
  
  console.log('\n📱 CLIENT API (What our React app uses):');
  console.log('-'.repeat(40));
  console.log('Our React app uses these endpoints:');
  console.log('✓ Client/LoginWithCustomID - Anonymous login');
  console.log('✓ Client/GetTitleData - Load tasks');
  console.log('✓ Client/UpdateUserData - Save progress'); 
  console.log('✓ Client/GetUserData - Load progress');
  console.log('✓ Client/UpdatePlayerStatistics - Submit scores');
  console.log('✓ Client/GetLeaderboard - Show rankings');
  console.log('✓ Client/WritePlayerEvent - Log game events');
  
  console.log('\n🔧 AVAILABLE OPERATIONS:');
  console.log('-'.repeat(30));
  
  if (titleData) {
    console.log('\n📋 Your Title Data:');
    Object.entries(titleData).forEach(([key, value]: [string, any]) => {
      if (key === 'tasks.json') {
        const tasks = JSON.parse(value);
        console.log(`  📄 ${key}: ${tasks.length} tasks`);
        // Show task categories
        const categories = [...new Set(tasks.map((t: any) => t.id.split('-')[0]))];
        console.log(`     Categories: ${categories.join(', ')}`);
      } else {
        console.log(`  📄 ${key}: ${typeof value === 'string' ? value.substring(0, 50) + '...' : value}`);
      }
    });
  }
  
  console.log('\n🚀 NEXT STEPS YOU CAN DO:');
  console.log('-'.repeat(30));
  console.log('With your secret key, you can:');
  console.log('• ✅ Manage Title Data (add/update tasks)');
  console.log('• ✅ Create custom player statistics');
  console.log('• ✅ Set up virtual economy (items, currencies)');
  console.log('• ✅ Configure CloudScript functions');
  console.log('• ✅ Manage player segments');
  console.log('• ✅ Set up A/B testing');
  console.log('• ✅ Export player data');
  console.log('• ✅ Configure push notifications');
  
  console.log('\n📚 PLAYFAB API DOCUMENTATION:');
  console.log('-'.repeat(35));
  console.log('Admin API: https://docs.microsoft.com/en-us/rest/api/playfab/admin/');
  console.log('Server API: https://docs.microsoft.com/en-us/rest/api/playfab/server/');
  console.log('Client API: https://docs.microsoft.com/en-us/rest/api/playfab/client/');
  
}

main().catch(console.error);