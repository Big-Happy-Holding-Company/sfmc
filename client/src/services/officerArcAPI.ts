/**
 * Simple Officer Track API Service
 * 
 * Focused service for getting puzzle difficulty data from arc-explainer API
 * No overengineering - just the basics needed for the new Officer Track
 */

import { arcDataService } from '@/services/arcDataService';
import { playFabCore } from '@/services/playfab/core';

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

// Cache for PlayFab batch data - 10 minute TTL for less frequent API calls
const batchCache = new Map<string, { data: any[]; timestamp: number }>();
const BATCH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

// Batch cache management
function isBatchCached(batchKey: string): boolean {
  const cached = batchCache.get(batchKey);
  if (!cached) return false;
  
  const isExpired = Date.now() - cached.timestamp > BATCH_CACHE_TTL;
  if (isExpired) {
    batchCache.delete(batchKey);
    return false;
  }
  
  return true;
}

function getBatchFromCache(batchKey: string): any[] {
  return batchCache.get(batchKey)!.data;
}

function setBatchCache(batchKey: string, data: any[]): void {
  batchCache.set(batchKey, { data, timestamp: Date.now() });
}

/**
 * Get arc-explainer base URL
 */
function getBaseURL(): string {
  const envUrl = import.meta.env.VITE_ARC_EXPLAINER_URL;
  return envUrl || 'https://arc-explainer-production.up.railway.app';
}

/**
 * Make API call to arc-explainer with retry logic for Windows/certificate issues
 */
async function makeAPICall(endpoint: string): Promise<any> {
  const url = `${getBaseURL()}${endpoint}`;
  
  const makeRequest = async (): Promise<Response> => {
    return fetch(url, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json'
      }
    });
  };

  try {
    console.log(`🌐 Calling arc-explainer API: ${url}`);
    
    // First attempt
    let response = await makeRequest();
    
    // Retry once if network error (common with Windows certificate issues)
    if (!response.ok && (response.status >= 500 || response.status === 0)) {
      console.log(`⚠️ First attempt failed (${response.status}), retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      response = await makeRequest();
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`❌ Arc-explainer API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Arc-explainer API success: ${endpoint}`);
    return data;
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
  // If no data or accuracy is exactly 0, consider it impossible
  if (!hasData || accuracy === 0) return 'impossible';
  if (accuracy <= 0.25) return 'extremely_hard';
  if (accuracy <= 0.50) return 'very_hard';
  return 'challenging';
}

/**
 * Get puzzles from arc-explainer (metadata only) - simple pattern
 */
export async function getOfficerPuzzles(limit: number = 50): Promise<OfficerPuzzleResponse> {
  try {
    console.log(`🔄 Getting ${limit} puzzles from arc-explainer...`);
    
    // Add limit parameter like arc-explainer does
    const data = await makeAPICall(`/api/puzzle/worst-performing?limit=${limit}&sortBy=composite`);
    
    // Simple: get puzzles from arc-explainer response
    const rawPuzzles = data.data?.puzzles || [];
    const total = data.data?.total || rawPuzzles.length;
    
    // Convert to our format
    const puzzles: OfficerPuzzle[] = rawPuzzles.map((p: any) => ({
      id: p.id,
      playFabId: p.id,
      avgAccuracy: p.avgAccuracy || 0,
      difficulty: categorizeDifficulty(p.avgAccuracy || 0, p.totalExplanations > 0),
      totalExplanations: p.totalExplanations || 0,
      compositeScore: p.compositeScore || 0
    }));
      
    return { puzzles, total };
    
  } catch (error) {
    console.error('❌ Failed to fetch officer puzzles:', error);
    throw error;
  }
}

/**
 * Get difficulty statistics
 */
export async function getDifficultyStats(): Promise<DifficultyStats> {
  console.log('🔍 Calculating difficulty statistics...');
  const response = await getOfficerPuzzles(200); // Get larger sample for better stats
  
  const stats: DifficultyStats = {
    impossible: 0,
    extremely_hard: 0,
    very_hard: 0,
    challenging: 0,
    total: response.total // Use real database total
  };
  
  // Track some examples of each difficulty
  const examples: Record<string, any> = {
    impossible: [],
    extremely_hard: [],
    very_hard: [],
    challenging: []
  };
  
  response.puzzles.forEach(puzzle => {
    stats[puzzle.difficulty]++;
    
    // Keep up to 3 examples of each difficulty
    if (examples[puzzle.difficulty].length < 3) {
      examples[puzzle.difficulty].push({
        id: puzzle.id,
        accuracy: puzzle.avgAccuracy,
        explanations: puzzle.totalExplanations
      });
    }
  });
  
  console.log('📊 Difficulty distribution:', stats);
  console.log('🔍 Examples by difficulty:', JSON.stringify(examples, null, 2));
  
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
 * Search for puzzle by ID - simplified flow
 * 1. Try to get AI metadata from arc-explainer API (fast)
 * 2. Only get full PlayFab data when actually needed for solving
 */
export async function searchPuzzleById(searchId: string): Promise<OfficerPuzzle | null> {
  try {
    const cleanId = searchId.trim().toLowerCase().replace(/^arc-[a-z0-9]+-/, '');
    console.log(`🔍 Searching for puzzle: ${searchId} -> ${cleanId}`);
    
    // First try to get AI metadata from arc-explainer API (fast and always available)
    let avgAccuracy = 0;
    let totalExplanations = 0;
    let compositeScore = 0;
    let foundInArcExplainer = false;
    
    try {
      const aiData = await makeAPICall(`/api/puzzle/task/${cleanId}`);
      if (aiData.success && aiData.data) {
        const performanceData = aiData.data.performanceData || {};
        avgAccuracy = performanceData.avgAccuracy || 0;
        totalExplanations = performanceData.totalExplanations || 0;
        compositeScore = performanceData.compositeScore || 0;
        foundInArcExplainer = true;
        console.log(`✅ Found AI metadata for ${cleanId} in arc-explainer`);
      }
    } catch (error) {
      console.log(`⚠️ No AI metadata found for ${cleanId} in arc-explainer`);
    }
    
    // If we found AI data, create puzzle object (full PlayFab data loaded later when needed)
    if (foundInArcExplainer) {
      const puzzle: OfficerPuzzle = {
        id: cleanId,
        playFabId: cleanId,
        avgAccuracy,
        difficulty: categorizeDifficulty(avgAccuracy, totalExplanations > 0),
        totalExplanations,
        compositeScore
      };
      
      console.log(`✅ Created puzzle metadata for ${cleanId}`);
      return puzzle;
    }
    
    // If no AI data available, check if puzzle exists in PlayFab at least
    console.log(`🔍 No AI data found, checking PlayFab for ${cleanId}...`);
    const puzzleExists = await loadPuzzleFromPlayFab(cleanId);
    
    if (puzzleExists) {
      // Create minimal puzzle object - full data will be loaded when needed
      const puzzle: OfficerPuzzle = {
        id: cleanId,
        playFabId: cleanId,
        avgAccuracy: 0,
        difficulty: 'challenging', // Default difficulty if no AI data
        totalExplanations: 0,
        compositeScore: 0
      };
      
      console.log(`✅ Found puzzle ${cleanId} in PlayFab (no AI data)`);
      return puzzle;
    }
    
    console.log(`❌ Puzzle ${cleanId} not found in any system`);
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
 * Load full puzzle data from PlayFab by searching all datasets for ARC ID
 */
export async function loadPuzzleFromPlayFab(puzzleId: string): Promise<any | null> {
  try {
    // Ensure PlayFab is initialized with admin credentials
    if (!playFabCore.isReady()) {
      console.warn('PlayFab not initialized for admin access, initializing...');
      const titleId = import.meta.env.VITE_PLAYFAB_TITLE_ID;
      const secretKey = import.meta.env.VITE_PLAYFAB_SECRET_KEY;
      await playFabCore.initialize({ titleId, secretKey });
    }
    
    // Extract ARC ID (remove any existing prefix)
    const arcId = puzzleId.startsWith('ARC-') ? playFabToArcId(puzzleId) : puzzleId;
    console.log(`🔍 loadPuzzleFromPlayFab: searching for "${puzzleId}" -> arcId: "${arcId}"`);
    
    // Try to determine dataset from existing PlayFab ID format if available
    // This optimizes search by checking most likely datasets first
    const datasets = [
      { name: 'training', batches: 4, priority: arcId.length === 8 ? 1 : 2 },
      { name: 'evaluation', batches: 4, priority: arcId.length === 8 ? 1 : 2 },
      { name: 'training2', batches: 10, priority: arcId.length === 8 ? 1 : 3 },
      { name: 'evaluation2', batches: 2, priority: arcId.length === 8 ? 1 : 3 }
    ].sort((a, b) => a.priority - b.priority); // Search higher priority datasets first
    
    console.log(`🔍 Searching ${datasets.length} datasets for puzzle ${arcId}...`);
    
    // Search datasets in priority order
    for (const dataset of datasets) {
      console.log(`📂 Searching ${dataset.name} dataset (${dataset.batches} batches)...`);
      
      for (let i = 1; i <= dataset.batches; i++) {
        try {
          const batchKey = `officer-tasks-${dataset.name}-batch${i}.json`;
          let puzzleArray: any[] = [];
          
          // Check cache first to avoid repeated API calls
          if (isBatchCached(batchKey)) {
            puzzleArray = getBatchFromCache(batchKey);
            console.log(`📋 Using cached batch ${batchKey}: ${puzzleArray.length} puzzles`);
          } else {
            // Load from PlayFab and cache
            const result = await playFabCore.makeHttpRequest(
              '/Admin/GetTitleData',
              { Keys: [batchKey] },
              false // Admin API uses secret key, not user authentication
            );
            
            if (result.success && result.data?.Data?.[batchKey]?.Value) {
              const puzzleDataStr = result.data.Data[batchKey].Value;
              
              if (puzzleDataStr && puzzleDataStr !== "undefined") {
                puzzleArray = JSON.parse(puzzleDataStr);
                setBatchCache(batchKey, puzzleArray); // Cache for future searches
                console.log(`📊 Loaded and cached batch ${batchKey}: ${puzzleArray.length} puzzles`);
              } else {
                console.log(`❌ Batch ${batchKey} is empty or undefined`);
                continue; // Skip to next batch
              }
            } else {
              console.log(`❌ Failed to get data for ${batchKey}`);
              continue; // Skip to next batch
            }
          }
          
          // Search for puzzle in this batch
          const puzzle = puzzleArray.find((p: any) => {
            if (!p.id) return false;
            const pArcId = playFabToArcId(p.id);
            const isMatch = pArcId === arcId;
            if (isMatch) {
              console.log(`✅ MATCH FOUND: ${p.id} -> ${pArcId} === ${arcId}`);
            }
            return isMatch;
          });
          
          if (puzzle) {
            console.log(`✅ Found puzzle ${puzzle.id} in ${dataset.name} batch ${i}`);
            return puzzle; // Exit immediately when found
          }
        } catch (error) {
          console.log(`❌ Error checking batch ${dataset.name}-${i}:`, error);
        }
      }
    }
    
    console.log(`❌ Puzzle with ARC ID ${arcId} not found in any dataset`);
    return null;
    
  } catch (error) {
    console.error(`❌ Failed to load puzzle ${puzzleId}:`, error);
    return null;
  }
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
  batchCache.clear();
  console.log('🗑️ Cleared all officer API caches');
}