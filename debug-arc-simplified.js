import fetch from 'node-fetch';

async function testArcAPISimple() {
    try {
        console.log('🔍 Testing arc-explainer API response structure...\n');
        
        const response = await fetch('https://arc-explainer-production.up.railway.app/api/puzzle/worst-performing?limit=3', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        
        console.log('📊 Response Structure:');
        console.log(`- success: ${data.success}`);
        console.log(`- data.puzzles length: ${data.data?.puzzles?.length || 'undefined'}`);
        console.log(`- data.total: ${data.data?.total || 'undefined'}`);
        
        if (data.data?.puzzles?.length > 0) {
            const firstPuzzle = data.data.puzzles[0];
            console.log('\n🧩 First Puzzle Structure:');
            console.log(`- Keys: ${Object.keys(firstPuzzle)}`);
            console.log(`- id: ${firstPuzzle.id}`);
            console.log(`- filename: ${firstPuzzle.filename}`);
            
            console.log('\n📈 Performance Data Check:');
            console.log(`- performanceData exists: ${!!firstPuzzle.performanceData}`);
            
            if (firstPuzzle.performanceData) {
                const perf = firstPuzzle.performanceData;
                console.log(`- avgAccuracy: ${perf.avgAccuracy}`);
                console.log(`- totalExplanations: ${perf.totalExplanations}`);
                console.log(`- compositeScore: ${perf.compositeScore}`);
                console.log(`- Performance keys: ${Object.keys(perf)}`);
            } else {
                console.log('❌ No performanceData found!');
                console.log('Available data:', JSON.stringify(firstPuzzle, null, 2));
            }
        }
        
    } catch (error) {
        console.error('❌ API Test Failed:', error);
    }
}

testArcAPISimple();