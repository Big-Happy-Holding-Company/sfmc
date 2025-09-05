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
 * Get worst performing puzzles (our primary data source)
 */
export async function getOfficerPuzzles(): Promise<OfficerPuzzle[]> {
  const cacheKey = 'officer-puzzles';
  
  if (isCached(cacheKey)) {
    return getFromCache<OfficerPuzzle[]>(cacheKey);
  }

  try {
    console.log('🔄 Fetching puzzles from arc-explainer API...');
    
    const data = await makeAPICall('/api/puzzle/worst-performing');
    
    // Handle different response formats (as noted in API guide)
    let rawPuzzles: any[] = [];
    
    if (Array.isArray(data)) {
      rawPuzzles = data;
    } else if (data.success && data.data?.puzzles) {
      rawPuzzles = data.data.puzzles;
    } else if (data.data && Array.isArray(data.data)) {
      rawPuzzles = data.data;
    } else {
      console.warn('Unexpected API response structure:', data);
      return [];
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

    setCache(cacheKey, puzzles);
    console.log(`✅ Loaded ${puzzles.length} officer puzzles`);
    
    return puzzles;
    
  } catch (error) {
    console.error('❌ Failed to fetch officer puzzles:', error);
    throw error;
  }
}

/**
 * Get difficulty statistics
 */
export async function getDifficultyStats(): Promise<DifficultyStats> {
  const puzzles = await getOfficerPuzzles();
  
  const stats: DifficultyStats = {
    impossible: 0,
    extremely_hard: 0,
    very_hard: 0,
    challenging: 0,
    total: puzzles.length
  };
  
  puzzles.forEach(puzzle => {
    stats[puzzle.difficulty]++;
  });
  
  return stats;
}

/**
 * Filter puzzles by difficulty
 */
export async function getPuzzlesByDifficulty(difficulty: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging'): Promise<OfficerPuzzle[]> {
  const allPuzzles = await getOfficerPuzzles();
  return allPuzzles.filter(p => p.difficulty === difficulty);
}

/**
 * Search for puzzle by ID (supports both arc and PlayFab formats)
 */
export async function searchPuzzleById(searchId: string): Promise<OfficerPuzzle | null> {
  const allPuzzles = await getOfficerPuzzles();
  
  // Try exact match first
  let found = allPuzzles.find(p => p.id === searchId || p.playFabId === searchId);
  
  // If not found, try partial match
  if (!found) {
    const cleanSearch = searchId.toLowerCase().replace(/^arc-[a-z0-9]+-/, '');
    found = allPuzzles.find(p => p.id.toLowerCase().includes(cleanSearch));
  }
  
  return found || null;
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}