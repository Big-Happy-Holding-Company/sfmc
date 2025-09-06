// Debug script to check if arc-explainer API returns puzzles with avgAccuracy === 0

async function checkImpossiblePuzzles() {
  try {
    const response = await fetch('https://arc-explainer-production.up.railway.app/api/puzzle/worst-performing?limit=200&sortBy=composite');
    const data = await response.json();
    
    console.log('API Response structure:', {
      success: data.success,
      hasData: !!data.data,
      hasPuzzles: !!(data.data?.puzzles),
      totalPuzzles: data.data?.puzzles?.length || 0,
      totalInDB: data.data?.total || 0
    });

    if (data.success && data.data?.puzzles) {
      const puzzles = data.data.puzzles;
      
      // Check accuracy distribution
      const accuracyBuckets = {
        zero: 0,        // exactly 0
        veryLow: 0,     // 0.01-0.25  
        low: 0,         // 0.26-0.50
        medium: 0       // 0.51+
      };
      
      puzzles.forEach(puzzle => {
        const acc = puzzle.performanceData?.avgAccuracy || 0;
        if (acc === 0) accuracyBuckets.zero++;
        else if (acc <= 0.25) accuracyBuckets.veryLow++;
        else if (acc <= 0.50) accuracyBuckets.low++;
        else accuracyBuckets.medium++;
      });
      
      console.log('Accuracy distribution:', accuracyBuckets);
      
      // Show first few puzzles with their accuracy
      console.log('\nFirst 5 puzzles:');
      puzzles.slice(0, 5).forEach((p, i) => {
        const acc = p.performanceData?.avgAccuracy || 0;
        console.log(`${i+1}. ${p.id}: ${acc}`);
      });
      
      // If no zero accuracy puzzles, check what's the minimum
      if (accuracyBuckets.zero === 0) {
        const minAccuracy = Math.min(...puzzles.map(p => p.performanceData?.avgAccuracy || 1));
        console.log(`\nNo puzzles with exactly 0 accuracy. Minimum accuracy: ${minAccuracy}`);
      }
    }
    
  } catch (error) {
    console.error('Error checking puzzles:', error);
  }
}

checkImpossiblePuzzles();