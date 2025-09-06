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
  
  // FIXED: Use actual prefixes from upload script
  const prefixMap = {
    'training': 'ARC-TR-',
    'evaluation': 'ARC-EV-', 
    'training2': 'ARC-T2-',    // Was ARC-TR2-, now matches upload script
    'evaluation2': 'ARC-E2-'   // Was ARC-EV2-, now matches upload script
  };
  
  return prefixMap[dataset] + arcId;
}

/**
 * Convert PlayFab ID to arc-ID
 * ARC-TR-007bbfb7 -> 007bbfb7
 * ARC-T2-11852cab -> 11852cab
 */
export function playFabToArcId(playFabId: string): string {
  // FIXED: Handle all actual uploaded prefixes: ARC-TR-, ARC-T2-, ARC-EV-, ARC-E2-
  return playFabId.replace(/^ARC-(TR|T2|EV|E2)-/, '');
}

/**
 * Categorize puzzle difficulty based on AI accuracy
 */
export function categorizeDifficulty(accuracy: number, hasData: boolean = true): 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' {
  if (!hasData || accuracy === 0) return 'impossible';
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
      const hasData = !!p.performanceData;
      
      const arcId = p.id || p.puzzleId || '';
      return {
        id: arcId,
        playFabId: arcId, // Don't assume dataset - let loadPuzzleFromPlayFab figure it out
        avgAccuracy: accuracy,
        difficulty: categorizeDifficulty(accuracy, hasData),
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
    
    // Use arc-explainer's specific puzzle endpoint
    const data = await makeAPICall(`/api/puzzle/task/${cleanId}`);
    
    if (data.success && data.data) {
      console.log(`✅ Puzzle found in arc-explainer database: ${cleanId}`);
      
      // Extract performance data from the arc-explainer response
      const puzzleData = data.data;
      const performanceData = puzzleData.performanceData || {};
      
      // Calculate accuracy and other metrics from the rich data
      const avgAccuracy = performanceData.avgAccuracy || 0;
      const totalExplanations = performanceData.totalExplanations || 0;
      const compositeScore = performanceData.compositeScore || 0;
      
      const puzzle: OfficerPuzzle = {
        id: cleanId,
        playFabId: cleanId, // Raw ARC ID - let loader figure out the dataset
        avgAccuracy,
        difficulty: categorizeDifficulty(avgAccuracy, !!performanceData),
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
 * Load full puzzle data from PlayFab by searching all datasets for ARC ID
 */
export async function loadPuzzleFromPlayFab(puzzleId: string): Promise<any | null> {
  try {
    const { playFabCore } = await import('@/services/playfab/core');
    
    // Extract ARC ID (remove any existing prefix)
    const arcId = puzzleId.startsWith('ARC-') ? playFabToArcId(puzzleId) : puzzleId;
    
    // All datasets to search
    const datasets = [
      { name: 'training', batches: 4 },
      { name: 'evaluation', batches: 4 },
      { name: 'training2', batches: 10 },
      { name: 'evaluation2', batches: 2 }
    ];
    
    // Search all datasets
    for (const dataset of datasets) {
      for (let i = 1; i <= dataset.batches; i++) {
        try {
          const batchKey = `officer-tasks-${dataset.name}-batch${i}.json`;
          
          const result = await playFabCore.makeHttpRequest(
            '/Client/GetTitleData',
            { Keys: [batchKey] },
            true
          );
          
          if (result.success && result.data?.Data?.[batchKey]) {
            const puzzleDataStr = result.data.Data[batchKey];
            
            if (puzzleDataStr && puzzleDataStr !== "undefined") {
              const puzzleArray = JSON.parse(puzzleDataStr);
              
              // Find puzzle by ARC ID (regardless of prefix)
              const puzzle = puzzleArray.find((p: any) => {
                if (!p.id) return false;
                const pArcId = playFabToArcId(p.id);
                return pArcId === arcId;
              });
              
              if (puzzle) {
                console.log(`Found puzzle ${puzzle.id} in ${dataset.name} batch ${i}`);
                return puzzle;
              }
            }
          }
        } catch (error) {
          // Continue to next batch
        }
      }
    }
    
    console.log(`Puzzle with ARC ID ${arcId} not found in any dataset`);
    return null;
    
  } catch (error) {
    console.error(`Failed to load puzzle ${puzzleId}:`, error);
    return null;
  }
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}