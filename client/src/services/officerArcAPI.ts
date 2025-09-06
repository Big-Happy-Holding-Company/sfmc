/**
 * Simple Officer Track API Service
 * 
 * Focused service for getting puzzle difficulty data from arc-explainer API
 * No overengineering - just the basics needed for the new Officer Track
 */

export interface OfficerPuzzle {
  id: string;                    // ARC ID (e.g., "007bbfb7")
  playFabId: string;            // PlayFab format (e.g., "ARC-TR-007bbfb7")
  avgAccuracy: number;          // 0.0 to 1.0
  difficulty: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging';
  totalExplanations: number;
  compositeScore: number;
}

export interface DifficultyStats {
  impossible: number;
  extremely_hard: number;
  very_hard: number;
  challenging: number;
  total: number;
}

export interface OfficerPuzzleResponse {
  puzzles: OfficerPuzzle[];
  total: number; // Total in database, not just loaded
}

// Simple cache - 5 minute TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCached(key: string): boolean {
  const cached = cache.get(key);
  if (!cached) return false;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(key);
    return false;
  }
  
  return true;
}

function getFromCache<T>(key: string): T {
  return cache.get(key)!.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get arc-explainer base URL
 */
function getBaseURL(): string {
  const envUrl = import.meta.env.VITE_ARC_EXPLAINER_URL;
  return envUrl || 'https://arc-explainer-production.up.railway.app';
}

/**
 * Make API call to arc-explainer
 */
async function makeAPICall(endpoint: string): Promise<any> {
  const url = `${getBaseURL()}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${url}`, error);
    throw error;
  }
}

/**
 * Convert arc-ID to PlayFab format
 * 007bbfb7 -> ARC-TR-007bbfb7 (assumes training by default)
 */
export function arcIdToPlayFab(arcId: string, dataset: 'training' | 'evaluation' | 'training2' | 'evaluation2' = 'training'): string {
  if (arcId.startsWith('ARC-')) return arcId; // Already in PlayFab format
  
  const prefixMap = {
    'training': 'ARC-TR-',
    'evaluation': 'ARC-EV-',
    'training2': 'ARC-TR2-',
    'evaluation2': 'ARC-EV2-'
  };
  
  return prefixMap[dataset] + arcId;
}

/**
 * Convert PlayFab ID to arc-ID
 * ARC-TR-007bbfb7 -> 007bbfb7
 */
export function playFabToArcId(playFabId: string): string {
  return playFabId.replace(/^ARC-[A-Z0-9]+-/, '');
}

/**
 * Categorize puzzle difficulty based on AI accuracy
 */
export function categorizeDifficulty(accuracy: number): 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' {
  if (accuracy === 0) return 'impossible';
  if (accuracy <= 0.25) return 'extremely_hard';
  if (accuracy <= 0.50) return 'very_hard';
  return 'challenging';
}

/**
 * Get worst performing puzzles with total count (our primary data source)
 */
export async function getOfficerPuzzles(limit: number = 50): Promise<OfficerPuzzleResponse> {
  const cacheKey = `officer-puzzles-${limit}`;
  
  if (isCached(cacheKey)) {
    return getFromCache<OfficerPuzzleResponse>(cacheKey);
  }

  try {
    console.log(`🔄 Fetching ${limit} puzzles from arc-explainer API...`);
    
    // Add limit parameter like arc-explainer does
    const data = await makeAPICall(`/api/puzzle/worst-performing?limit=${limit}&sortBy=composite`);
    
    // Extract puzzles and total following arc-explainer pattern
    let rawPuzzles: any[] = [];
    let total = 0;
    
    if (data.success && data.data?.puzzles) {
      // Arc-explainer format: { success: true, data: { puzzles: [...], total: number } }
      rawPuzzles = data.data.puzzles;
      total = data.data.total || 0;
    } else if (Array.isArray(data)) {
      // Fallback: direct array
      rawPuzzles = data;
      total = data.length;
    } else if (data.data && Array.isArray(data.data)) {
      // Fallback: data is array
      rawPuzzles = data.data;
      total = data.data.length;
    } else {
      console.warn('Unexpected API response structure:', data);
      return { puzzles: [], total: 0 };
    }

    // Transform to our simplified format
    const puzzles: OfficerPuzzle[] = rawPuzzles.map(p => {
      const perf = p.performanceData || {};
      const accuracy = perf.avgAccuracy || 0;
      
      return {
        id: p.id || p.puzzleId || '',
        playFabId: arcIdToPlayFab(p.id || p.puzzleId || ''),
        avgAccuracy: accuracy,
        difficulty: categorizeDifficulty(accuracy),
        totalExplanations: perf.totalExplanations || 0,
        compositeScore: perf.compositeScore || 0
      };
    }).filter(p => p.id); // Remove any without valid IDs

    const result: OfficerPuzzleResponse = { puzzles, total };
    setCache(cacheKey, result);
    console.log(`✅ Loaded ${puzzles.length} puzzles out of ${total} total analyzed`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to fetch officer puzzles:', error);
    throw error;
  }
}

/**
 * Get difficulty statistics
 */
export async function getDifficultyStats(): Promise<DifficultyStats> {
  const response = await getOfficerPuzzles(200); // Get larger sample for better stats
  
  const stats: DifficultyStats = {
    impossible: 0,
    extremely_hard: 0,
    very_hard: 0,
    challenging: 0,
    total: response.total // Use real database total
  };
  
  response.puzzles.forEach(puzzle => {
    stats[puzzle.difficulty]++;
  });
  
  return stats;
}

/**
 * Filter puzzles by difficulty
 */
export async function getPuzzlesByDifficulty(difficulty: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging'): Promise<OfficerPuzzle[]> {
  const response = await getOfficerPuzzles(200);
  return response.puzzles.filter(p => p.difficulty === difficulty);
}

/**
 * Search for specific puzzle by ID using arc-explainer task endpoint
 * This searches the full database, not just loaded puzzles
 */
export async function searchPuzzleById(searchId: string): Promise<OfficerPuzzle | null> {
  try {
    const cleanId = searchId.trim().toLowerCase().replace(/^arc-[a-z0-9]+-/, '');
    console.log(`🔍 Searching for puzzle: ${searchId} (cleaned: ${cleanId})`);
    console.log(`🌐 Making API call to: /api/puzzle/task/${cleanId}`);
    
    // Use arc-explainer's specific puzzle endpoint - NO LOCAL FALLBACKS
    const data = await makeAPICall(`/api/puzzle/task/${cleanId}`);
    console.log(`📡 API response:`, data);
    
    if (data.success && data.data) {
      console.log(`✅ Puzzle found in arc-explainer database: ${cleanId}`);
      console.log(`📊 Full API response data:`, data.data);
      
      // Extract performance data from the arc-explainer response
      const puzzleData = data.data;
      const performanceData = puzzleData.performanceData || {};
      
      // Calculate accuracy and other metrics from the rich data
      const avgAccuracy = performanceData.avgAccuracy || 0;
      const totalExplanations = performanceData.totalExplanations || 0;
      const compositeScore = performanceData.compositeScore || 0;
      
      const puzzle: OfficerPuzzle = {
        id: cleanId,
        playFabId: arcIdToPlayFab(cleanId),
        avgAccuracy,
        difficulty: categorizeDifficulty(avgAccuracy),
        totalExplanations,
        compositeScore
      };
      
      console.log(`✅ Created puzzle object with real data for ${cleanId}:`, puzzle);
      return puzzle;
    } else {
      console.warn(`❌ Puzzle not found or invalid response for ${cleanId}:`, data);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Failed to search for puzzle ${searchId}:`, error);
    console.error(`❌ Error details:`, error);
    return null;
  }
}

/**
 * Legacy search within loaded puzzles (for backward compatibility)
 */
export async function searchWithinLoadedPuzzles(searchId: string, puzzles: OfficerPuzzle[]): Promise<OfficerPuzzle | null> {
  // Try exact match first
  let found = puzzles.find(p => p.id === searchId || p.playFabId === searchId);
  
  // If not found, try partial match
  if (!found) {
    const cleanSearch = searchId.toLowerCase().replace(/^arc-[a-z0-9]+-/, '');
    found = puzzles.find(p => p.id.toLowerCase().includes(cleanSearch));
  }
  
  return found || null;
}

/**
 * Load full puzzle data from PlayFab using PlayFab ID
 * This bridges the gap between arc-explainer search and actual puzzle solving
 */
export async function loadPuzzleFromPlayFab(playFabId: string): Promise<any | null> {
  try {
    console.log(`🎯 Loading full puzzle data from PlayFab: ${playFabId}`);
    
    // Import PlayFab core dynamically to avoid circular dependencies
    const { playFabCore } = await import('@/services/playfab/core');
    
    // Extract the arc ID from the PlayFab ID
    const arcId = playFabToArcId(playFabId);
    console.log(`🔍 Extracted ARC ID: ${arcId} from PlayFab ID: ${playFabId}`);
    
    // Define all possible datasets and their batch counts
    const allDatasets = [
      { prefix: 'ARC-TR-', name: 'training', batches: 4 },
      { prefix: 'ARC-EV-', name: 'evaluation', batches: 4 },
      { prefix: 'ARC-TR2-', name: 'training2', batches: 10 },
      { prefix: 'ARC-EV2-', name: 'evaluation2', batches: 2 }
    ];
    
    // Try the assumed dataset first (based on PlayFab ID prefix)
    let batchKeys: string[];
    let datasetName: string;
    
    if (playFabId.startsWith('ARC-TR2-')) {
      batchKeys = Array.from({length: 10}, (_, i) => `officer-tasks-training2-batch${i + 1}.json`);
      datasetName = 'training2';
    } else if (playFabId.startsWith('ARC-EV2-')) {
      batchKeys = Array.from({length: 2}, (_, i) => `officer-tasks-evaluation2-batch${i + 1}.json`);
      datasetName = 'evaluation2';
    } else if (playFabId.startsWith('ARC-EV-')) {
      batchKeys = Array.from({length: 4}, (_, i) => `officer-tasks-evaluation-batch${i + 1}.json`);
      datasetName = 'evaluation';
    } else {
      batchKeys = Array.from({length: 4}, (_, i) => `officer-tasks-training-batch${i + 1}.json`);
      datasetName = 'training';
    }
    
    console.log(`🔍 First trying ${datasetName} dataset (${batchKeys.length} batches) for puzzle: ${playFabId}`);
    
    // First, search through the assumed dataset
    const result = await searchDatasetBatches(playFabCore, batchKeys, playFabId, arcId, datasetName);
    if (result) {
      return result;
    }
    
    // If not found in assumed dataset, search ALL other datasets
    console.log(`❌ Puzzle ${playFabId} not found in ${datasetName} dataset. Searching ALL datasets...`);
    
    for (const dataset of allDatasets) {
      if (dataset.name === datasetName) continue; // Skip the one we already tried
      
      const otherBatchKeys = Array.from({length: dataset.batches}, (_, i) => 
        `officer-tasks-${dataset.name}-batch${i + 1}.json`
      );
      
      console.log(`🔍 Trying ${dataset.name} dataset (${otherBatchKeys.length} batches)...`);
      const otherResult = await searchDatasetBatches(playFabCore, otherBatchKeys, playFabId, arcId, dataset.name);
      if (otherResult) {
        return otherResult;
      }
    }
    
    console.log(`❌ Puzzle ${playFabId} (ARC ID: ${arcId}) not found in ANY dataset`);
    return null;
    
  } catch (error) {
    console.error(`❌ Failed to load puzzle from PlayFab: ${playFabId}`, error);
    return null;
  }
}

/**
 * Search through a set of dataset batches for a puzzle
 */
async function searchDatasetBatches(
  playFabCore: any, 
  batchKeys: string[], 
  playFabId: string, 
  arcId: string, 
  datasetName: string
): Promise<any | null> {
  for (const datasetKey of batchKeys) {
    try {
      console.log(`🔍 Checking batch: ${datasetKey}`);
      
      const result = await playFabCore.makeHttpRequest<
        { Keys: string[] }, 
        { Data?: Record<string, string> }
      >(
        '/Client/GetTitleData',
        { Keys: [datasetKey] },
        true // requiresAuth = true
      );
      
      if (result.success && result.data?.Data?.[datasetKey]) {
        const puzzleDataStr = result.data.Data[datasetKey];
        
        if (puzzleDataStr && puzzleDataStr !== "undefined") {
          const puzzleArray = JSON.parse(puzzleDataStr);
          console.log(`🔍 Checking batch ${datasetKey} with ${puzzleArray.length} puzzles`);
          
          // Search by both PlayFab ID AND ARC ID (in case the prefix is wrong)
          let puzzle = puzzleArray.find((p: any) => p.id === playFabId);
          
          if (!puzzle) {
            // Also try searching by just the ARC ID part
            puzzle = puzzleArray.find((p: any) => {
              const pArcId = playFabToArcId(p.id);
              return pArcId === arcId;
            });
          }
          
          if (puzzle) {
            console.log(`✅ Found puzzle in ${datasetName} batch ${datasetKey}: ${puzzle.id}`);
            return puzzle;
          } else {
            // Show sample IDs for debugging
            if (puzzleArray.length > 0) {
              const sampleIds = puzzleArray.slice(0, 3).map((p: any) => p.id);
              console.log(`❌ Not in batch ${datasetKey}. Sample IDs:`, sampleIds);
            }
          }
        }
      }
      
    } catch (batchError) {
      console.warn(`⚠️ Failed to check batch ${datasetKey}:`, batchError);
      // Continue to next batch
    }
  }
  
  return null; // Not found in this dataset
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}