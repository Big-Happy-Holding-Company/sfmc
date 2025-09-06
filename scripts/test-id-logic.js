// Test our ID conversion logic to see if there's an issue

function playFabToArcId(playFabId) {
  return playFabId.replace(/^ARC-(TR|T2|EV|E2)-/, '');
}

console.log('Testing ID conversion logic:');
console.log('');

const testCases = [
  'ARC-TR-11852cab',
  '11852cab', 
  'ARC-T2-11852cab',
  'ARC-EV-11852cab',
  'ARC-E2-11852cab'
];

testCases.forEach(input => {
  const result = playFabToArcId(input);
  console.log(`playFabToArcId('${input}') = '${result}'`);
  console.log(`  Matches '11852cab': ${result === '11852cab'}`);
  console.log('');
});

console.log('Simulating puzzle search:');
const puzzleId = '11852cab';
const puzzlesInBatch = [
  { id: 'ARC-TR-11852cab', filename: '11852cab' },
  { id: 'ARC-TR-007bbfb7', filename: '007bbfb7' },
  { id: 'ARC-TR-00d62c1b', filename: '00d62c1b' }
];

console.log(`Looking for puzzle with ID: ${puzzleId}`);
const found = puzzlesInBatch.find(p => {
  if (!p.id) return false;
  const pArcId = playFabToArcId(p.id);
  console.log(`  Checking ${p.id} -> ${pArcId} (match: ${pArcId === puzzleId})`);
  return pArcId === puzzleId;
});

console.log(`Result: ${found ? 'FOUND' : 'NOT FOUND'}`);
if (found) {
  console.log(`Found puzzle:`, found);
}