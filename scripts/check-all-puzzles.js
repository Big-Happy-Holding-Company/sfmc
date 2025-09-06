// Check if we can find puzzles with 0 accuracy from the general stats endpoint

async function checkAllPuzzleStats() {
  try {
    console.log('Checking different endpoints for zero accuracy puzzles...\n');

    // Try accuracy stats endpoint
    const accuracyResponse = await fetch('https://arc-explainer-production.up.railway.app/api/puzzle/accuracy-stats');
    const accuracyData = await accuracyResponse.json();
    console.log('Accuracy stats endpoint:', accuracyData);

    // Try general stats
    const generalResponse = await fetch('https://arc-explainer-production.up.railway.app/api/puzzle/general-stats');  
    const generalData = await generalResponse.json();
    console.log('\nGeneral stats endpoint:', generalData);

    // Try getting more puzzles from worst-performing
    const worstResponse = await fetch('https://arc-explainer-production.up.railway.app/api/puzzle/worst-performing?limit=1000&sortBy=composite');
    const worstData = await worstResponse.json();
    
    if (worstData.success && worstData.data?.puzzles) {
      const puzzles = worstData.data.puzzles;
      const zeroAccuracy = puzzles.filter(p => (p.performanceData?.avgAccuracy || 0) === 0);
      console.log(`\nChecked ${puzzles.length} worst performing puzzles:`);
      console.log(`Puzzles with exactly 0 accuracy: ${zeroAccuracy.length}`);
      
      // Check very low accuracy range
      const veryLowAccuracy = puzzles.filter(p => {
        const acc = p.performanceData?.avgAccuracy || 0;
        return acc > 0 && acc <= 0.05; // Between 0 and 5%
      });
      console.log(`Puzzles with 0-5% accuracy: ${veryLowAccuracy.length}`);
      
      if (veryLowAccuracy.length > 0) {
        console.log('Examples of very low accuracy puzzles:');
        veryLowAccuracy.slice(0, 3).forEach(p => {
          console.log(`- ${p.id}: ${(p.performanceData?.avgAccuracy || 0) * 100}%`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllPuzzleStats();