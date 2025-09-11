# PlayFab Data Management Scripts - Comprehensive Guide

## Overview

This directory contains scripts for managing two distinct data systems:

1. **Regular SFMC Tasks** - 155 Space Force themed puzzle tasks
2. **ARC Officer Track Puzzles** - 1,920 Abstract Reasoning Corpus puzzles

## 🎯 ARC Officer Track System (Primary)

### Current Status: ✅ Data Uploaded, ⚠️ Frontend Access Issue

**Data Upload**: ✅ **VERIFIED COMPLETE**
- **1,920 puzzles successfully uploaded** to PlayFab Title Data
- **20 batch files created** with proper size limits (<976KB each)
- **All datasets processed**: training (400), training2 (1000), evaluation (400), evaluation2 (120)

**Frontend Access**: ⚠️ **STILL BROKEN**
- Web app cannot access uploaded data despite successful E2E test verification
- Issue appears to be in PlayFab core service authentication/API differences

### Data Upload Verification Evidence

#### Upload Script Results
```bash
node scripts/upload-officer-tasks.cjs

✅ SUCCESS: Officer Track data uploaded to PlayFab!
📊 1920 officer track puzzles uploaded across 20 batches
📏 All batch sizes within PlayFab limits (largest: 705KB)
```

#### PlayFab Title Data Structure Created
```
officer-tasks-training-batch1.json     → 100 puzzles (308 KB)
officer-tasks-training-batch2.json     → 100 puzzles (308 KB) 
officer-tasks-training-batch3.json     → 100 puzzles (256 KB)
officer-tasks-training-batch4.json     → 100 puzzles (242 KB)
officer-tasks-training2-batch1.json    → 100 puzzles (368 KB)
officer-tasks-training2-batch2.json    → 100 puzzles (351 KB)
...continuing through batch10
officer-tasks-evaluation-batch1.json   → 100 puzzles (446 KB)
...continuing through batch4  
officer-tasks-evaluation2-batch1.json  → 100 puzzles (705 KB)
officer-tasks-evaluation2-batch2.json  → 20 puzzles (131 KB)

Total: 20 batch files containing 1,920 puzzles
```

### ARC Puzzle ID Format Explanation

#### Raw ARC Files → PlayFab Storage → Frontend Search

**Example 1: Puzzle e8686506**
```
Source File:    data/training/e8686506.json
PlayFab ID:     ARC-TR-e8686506  
Batch:          officer-tasks-training-batch[1-4].json
Frontend:       Searches for puzzle ID ending with "-e8686506"
```

**Example 2: Puzzle be03b35f**  
```
Source File:    data/evaluation/be03b35f.json
PlayFab ID:     ARC-EV-be03b35f
Batch:          officer-tasks-evaluation-batch[1-4].json  
Frontend:       Searches for puzzle ID ending with "-be03b35f"
```

#### Dataset Prefix Mapping
```
data/training/     → ARC-TR- prefix → officer-tasks-training-batch*.json
data/training2/    → ARC-T2- prefix → officer-tasks-training2-batch*.json  
data/evaluation/   → ARC-EV- prefix → officer-tasks-evaluation-batch*.json
data/evaluation2/  → ARC-E2- prefix → officer-tasks-evaluation2-batch*.json
```

### Frontend Integration Flow (When Fixed)

1. **ARC-Explainer API Request**
   ```javascript
   // User searches for "e8686506"
   GET https://arc-explainer-production.up.railway.app/api/puzzle/task/e8686506
   // Returns metadata: difficulty, performance stats, etc.
   ```

2. **PlayFab Batch Search**
   ```javascript
   // Frontend searches all batches for puzzle with ID ending "-e8686506"
   // Loads officer-tasks-training-batch1.json
   // Finds puzzle with id: "ARC-TR-e8686506"
   ```

3. **Data Merging**
   ```javascript
   // Combine ARC-Explainer metadata + PlayFab puzzle data
   const mergedPuzzle = {
     ...playfabPuzzleData,           // Full puzzle with train/test cases
     aiPerformance: explainerData,   // AI difficulty metrics
     difficultyCategory: "impossible" // Based on AI accuracy
   }
   ```

### ⚠️ Current Frontend Issue

**Problem**: Web app shows "No title data found" despite successful data upload

**Evidence**:
```
✅ E2E Test: Successfully finds data using direct HTTPS + secret key
❌ Web App: Cannot access same data using playFabCore.makeHttpRequest()
```

**Root Cause Analysis Needed**:
- PlayFab core service authentication configuration
- Admin API vs Client API endpoint differences  
- Secret key propagation in web environment
- Request format/header differences

## 🚀 Regular SFMC Tasks System (Secondary)

### Status: ✅ Working

```bash
# Upload regular Space Force tasks (155 puzzles)
node scripts/sync-tasks-to-playfab.cjs

# Test regular task retrieval  
node scripts/test-playfab-tasks.cjs
```

**Data Structure**: Single PlayFab key `"AllTasks"` containing 155 tasks

## 📁 Production Scripts Reference

### Critical Scripts (DO NOT DELETE)
- **`upload-officer-tasks.cjs`** - Main ARC puzzle upload (verified working)
- **`sync-tasks-to-playfab.cjs`** - Regular SFMC task upload  
- **`test-playfab-tasks.cjs`** - Regular SFMC task testing
- **`migrate-tasks-to-playfab.ts`** - Alternative SFMC task migration

### Utility Scripts
- **`check-playfab-data.cjs`** - Data verification
- **`configure-statistics.cjs`** - PlayFab statistics setup  
- **`upload-cloudscript.ts`** - CloudScript deployment

### Reference Documentation
- **`playfab-endpoint-reference.ts`** - API endpoint documentation
- **`playfab-endpoints-deep-dive.ts`** - Advanced API exploration

### Recently Removed (Obsolete/Dangerous)
```bash
# DELETED - These scripts contained mock/debug code
test-officer-track-e2e.cjs          # DANGEROUS: Mock data
debug-playfab-*.js                  # Debug scripts
test-id-logic.js                    # Test code
enhance-tasks.js                    # Completed
explore-playfab-api.ts             # Completed  
investigate-cloudscript.ts         # Completed
```

## 🔧 Environment Setup

### Required Environment Variables
```bash
# Get from PlayFab Game Manager > Settings > API Features > Secret Keys
PLAYFAB_SECRET_KEY="your-admin-secret-key"
VITE_PLAYFAB_TITLE_ID="19FACB"
VITE_PLAYFAB_SECRET_KEY="your-admin-secret-key"  # For client-side admin calls
```

### PlayFab Title Configuration
- **Title ID**: 19FACB
- **Admin API**: Used for data upload/management
- **Client API**: Used for data retrieval (when auth configured correctly)

## 🐛 Troubleshooting Guide

### Issue: "No title data found for key: officer-tasks-*-batch*.json"

**Status**: Currently occurring despite successful upload

**Debugging Steps**:
1. Verify data exists in PlayFab Game Manager
2. Check PlayFab core service authentication
3. Compare E2E test vs web app request formats
4. Validate Admin API secret key usage
5. Inspect network requests for API endpoint differences

**Temporary Workaround**: 
```bash
# Verify data exists using E2E test approach
node -e "
const https = require('https');
const options = {
  hostname: '19FACB.playfabapi.com',
  path: '/Admin/GetTitleData',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-SecretKey': process.env.PLAYFAB_SECRET_KEY
  }
};
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(JSON.parse(data)));
});
req.write(JSON.stringify({Keys: ['officer-tasks-training-batch1.json']}));
req.end();
"
```

### Issue: Upload Script Fails

**Common Causes**:
- Missing PLAYFAB_SECRET_KEY environment variable
- Invalid secret key
- Network connectivity issues
- Data directory missing (data/training/, data/evaluation/, etc.)

### Issue: Batch Size Exceeded

**PlayFab Limit**: 976KB per Title Data key  
**Current Status**: All batches well under limit (largest: 705KB)

## 📊 Data Specifications

### ARC Puzzle Data Format
```javascript
{
  "id": "ARC-TR-e8686506",           // PlayFab prefixed ID
  "filename": "e8686506",            // Raw ARC ID for search
  "dataset": "training",             // Dataset classification  
  "difficulty": "LIEUTENANT",        // Officer rank requirement
  "gridSize": {                      // Grid dimension analysis
    "minWidth": 3, "maxWidth": 10,
    "minHeight": 3, "maxHeight": 10
  },
  "complexity": {                    // Complexity metrics
    "trainingExamples": 3,
    "uniqueColors": 4,
    "transformationComplexity": "moderate"
  },
  "train": [...],                    // ARC training examples
  "test": [...],                     // ARC test cases
  "loadedAt": "2025-01-10T..."       // Upload timestamp
}
```

### Regular SFMC Task Format
```javascript
{
  "id": "COM-001",                   // Category-number format
  "title": "Stellar Communications Array",
  "description": "Configure deep space communications...",
  "category": "📡 Communications",
  "difficulty": "Basic",
  "gridSize": 3,
  "basePoints": 1500,
  "emojiSet": "tech_set1",
  "examples": [...],
  "testInput": [...],
  "testOutput": [...]
}
```

## 🔮 Next Steps

1. **HIGH PRIORITY**: Debug frontend PlayFab access issue
   - Compare E2E test vs web app request methods
   - Fix PlayFab core service authentication
   - Verify Admin API endpoint usage

2. **MEDIUM PRIORITY**: Implement key discovery system  
   - Dynamic batch detection instead of hardcoded counts
   - Robust error handling for missing batches

3. **LOW PRIORITY**: Create additional utility scripts
   - Data integrity verification
   - Puzzle inventory management  
   - Performance monitoring

## 🎯 Success Criteria

**ARC System Working When**:
- [ ] Frontend can load puzzle "e8686506" from PlayFab
- [ ] ARC-Explainer API metadata merges correctly  
- [ ] Search works for all 1,920 uploaded puzzles
- [ ] No more "No title data found" errors

**System Fully Optimized When**:
- [ ] Key discovery system replaces hardcoded batch counts
- [ ] Error handling provides clear actionable messages
- [ ] Performance monitoring tracks data access health
- [ ] Documentation covers all edge cases