// Test corrected API data extraction from performanceData
import fetch from 'node-fetch';

const baseURL = 'https://arc-explainer-production.up.railway.app';

console.log('🧪 Testing CORRECTED arc-explainer API extraction...');

async function testAPI() {
  try {
    const url = `${baseURL}/api/puzzle/worst-performing?limit=3`;
    const response = await fetch(url);
    const data = await response.json();
    
    let rawPuzzles = [];
    if (data.success && data.data?.puzzles) {
      rawPuzzles = data.data.puzzles;
      console.log('📋 Found', rawPuzzles.length, 'raw puzzles');
    }

    // Extract using the correct nested performanceData structure  
    const puzzles = rawPuzzles.map(p => {
      const perf = p.performanceData || {};
      return {
        id: p.id || p.puzzleId || '',
        avgAccuracy: perf.avgAccuracy || 0,
        compositeScore: perf.compositeScore || 0,
        wrongCount: perf.wrongCount,
        totalExplanations: perf.totalExplanations
      };
    }).filter(p => p.id);

    console.log('✅ CORRECTED extraction results:');
    console.log(JSON.stringify(puzzles, null, 2));
    console.log(`📊 Successfully extracted performance data for ${puzzles.length} puzzles!`);

    // Show difficulty categories
    puzzles.forEach(p => {
      let category = 'challenging';
      if (p.avgAccuracy === 0) category = 'impossible';
      else if (p.avgAccuracy <= 0.25) category = 'extremely_hard';
      else if (p.avgAccuracy <= 0.50) category = 'very_hard';
      
      console.log(`🎯 Puzzle ${p.id}: ${(p.avgAccuracy * 100).toFixed(1)}% accuracy -> ${category}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();