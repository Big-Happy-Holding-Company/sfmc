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
    
    // Use arc-explainer's specific puzzle endpoint
    const data = await makeAPICall(`/api/puzzle/task/${cleanId}`);
    
    if (data.success && data.data) {
      // Get performance data for this specific puzzle
      const taskData = data.data;
      
      // Try to get performance data from worst-performing (might not be there)
      let performanceData = null;
      try {
        const perfResponse = await getOfficerPuzzles(200); // Get larger set to find performance data
        const foundWithPerf = perfResponse.puzzles.find(p => p.id === cleanId);
        if (foundWithPerf) {
          performanceData = {
            avgAccuracy: foundWithPerf.avgAccuracy,
            totalExplanations: foundWithPerf.totalExplanations,
            compositeScore: foundWithPerf.compositeScore
          };
        }
      } catch (err) {
        console.warn('Could not get performance data for puzzle:', cleanId);
      }
      
      // Create puzzle object with available data
      const puzzle: OfficerPuzzle = {
        id: cleanId,
        playFabId: arcIdToPlayFab(cleanId),
        avgAccuracy: performanceData?.avgAccuracy || 0,
        difficulty: categorizeDifficulty(performanceData?.avgAccuracy || 0),
        totalExplanations: performanceData?.totalExplanations || 0,
        compositeScore: performanceData?.compositeScore || 0
      };
      
      console.log(`✅ Found puzzle ${cleanId} with performance data:`, performanceData);
      return puzzle;
    }
    
    return null;
    
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
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}