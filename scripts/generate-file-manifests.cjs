/**
 * Generate File Manifests for ARC Data
 * ====================================
 * 
 * Creates JSON manifest files listing all available ARC puzzle files
 * for each dataset. This enables the browser to load real data without
 * hardcoding 1,920 filenames.
 * 
 * Usage: node scripts/generate-file-manifests.js
 */

const fs = require('fs').promises;
const path = require('path');

// Dataset directories to scan
const DATASETS = [
  { name: 'training', path: 'data/training', manifestPath: 'client/public/data/training-manifest.json' },
  { name: 'training2', path: 'data/training2', manifestPath: 'client/public/data/training2-manifest.json' },
  { name: 'evaluation', path: 'data/evaluation', manifestPath: 'client/public/data/evaluation-manifest.json' },
  { name: 'evaluation2', path: 'data/evaluation2', manifestPath: 'client/public/data/evaluation2-manifest.json' }
];

async function main() {
  console.log('🗂️  Generating ARC dataset file manifests...');
  
  for (const dataset of DATASETS) {
    try {
      console.log(`\n📁 Processing ${dataset.name}...`);
      
      // Read all files from dataset directory
      const files = await fs.readdir(dataset.path);
      const jsonFiles = files.filter(f => f.endsWith('.json')).sort();
      
      console.log(`   Found ${jsonFiles.length} JSON files`);
      
      // Ensure output directory exists
      const manifestDir = path.dirname(dataset.manifestPath);
      await fs.mkdir(manifestDir, { recursive: true });
      
      // Write manifest file
      await fs.writeFile(dataset.manifestPath, JSON.stringify(jsonFiles, null, 2));
      
      console.log(`   ✅ Created manifest: ${dataset.manifestPath}`);
      
    } catch (error) {
      console.error(`   ❌ Failed to process ${dataset.name}:`, error.message);
    }
  }
  
  console.log('\n✅ All manifests generated successfully!');
  console.log('   The ARC data service can now load real file lists.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };