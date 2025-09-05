// Simple test script to verify arc-explainer API integration
import fetch from 'node-fetch';

const baseURL = 'https://arc-explainer-production.up.railway.app';

console.log('🧪 Testing arc-explainer API integration...');

async function testAPI() {
  try {
    const url = `${baseURL}/api/puzzle/worst-performing?limit=5`;
    console.log('🌐 Making request to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }

    const data = await response.json();
    
    console.log('🔍 Raw API response structure:', {
      hasSuccess: 'success' in data,
      hasData: 'data' in data,
      dataType: typeof data.data,
      isArray: Array.isArray(data),
      keys: Object.keys(data)
    });

    // Handle different response structures
    let puzzles = [];
    if (Array.isArray(data)) {
      puzzles = data;
      console.log('📋 Direct array response:', puzzles.length, 'puzzles');
    } else if (data.success && data.data?.puzzles) {
      puzzles = data.data.puzzles;
      console.log('📋 Wrapped response:', puzzles.length, 'puzzles');
    } else if (data.data && Array.isArray(data.data)) {
      puzzles = data.data;
      console.log('📋 Data array response:', puzzles.length, 'puzzles');
    }

    if (puzzles.length > 0) {
      console.log('✅ API test successful!');
      console.log('Sample puzzle data:', JSON.stringify(puzzles[0], null, 2));
      
      // Extract just the fields we need
      const simplified = puzzles.map(p => ({
        id: p.id || p.puzzleId || '',
        avgAccuracy: p.avgAccuracy || 0,
        compositeScore: p.compositeScore || 0
      })).filter(p => p.id);
      
      console.log('🎯 Simplified puzzle data for SFMC:', simplified.slice(0, 3));
    } else {
      console.warn('⚠️  No puzzles found in response');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();