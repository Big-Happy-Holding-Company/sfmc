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
 * Search for puzzle by ID - uses PlayFab data via arcDataService
 * Simple pattern: get full puzzle from PlayFab, add AI data if available
 */
export async function searchPuzzleById(searchId: string): Promise<OfficerPuzzle | null> {
  try {
    const cleanId = searchId.trim().toLowerCase().replace(/^arc-[a-z0-9]+-/, '');
    
    console.log(`🔍 Getting puzzle from PlayFab: ${cleanId}`);
    
    // Get full puzzle data from PlayFab
    const puzzleData = await arcDataService.searchPuzzleById(cleanId);
    
    if (!puzzleData) {
      console.log(`❌ Puzzle not found in PlayFab: ${cleanId}`);
      return null;
    }
    
    // Try to get AI performance data (optional)
    let avgAccuracy = 0;
    let totalExplanations = 0;
    let compositeScore = 0;
    
    try {
      const aiData = await makeAPICall(`/api/puzzle/task/${cleanId}`);
      if (aiData.success && aiData.data) {
        const performanceData = aiData.data.performanceData || {};
        avgAccuracy = performanceData.avgAccuracy || 0;
        totalExplanations = performanceData.totalExplanations || 0;
        compositeScore = performanceData.compositeScore || 0;
      }
    } catch {
      // AI data is optional - continue without it
    }
    
    // Return the PlayFab puzzle data with optional AI metadata  
    const puzzle: OfficerPuzzle = {
      id: cleanId,
      playFabId: cleanId,
      avgAccuracy,
      difficulty: categorizeDifficulty(avgAccuracy, totalExplanations > 0),
      totalExplanations,
      compositeScore
    };
    
    console.log(`✅ Found puzzle in PlayFab with AI data: ${cleanId}`);
    return puzzle;
    
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
    
    // Extract ARC ID (remove any existing prefix)
    const arcId = puzzleId.startsWith('ARC-') ? playFabToArcId(puzzleId) : puzzleId;
    console.log(`🔍 loadPuzzleFromPlayFab: searching for "${puzzleId}" -> arcId: "${arcId}"`);
    
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
          console.log(`🔍 Checking batch: ${batchKey}`);
          
          const result = await playFabCore.makeHttpRequest(
            '/Client/GetTitleData',
            { Keys: [batchKey] },
            true
          );
          
          if (result.success && result.data?.Data?.[batchKey]) {
            const puzzleDataStr = result.data.Data[batchKey];
            
            if (puzzleDataStr && puzzleDataStr !== "undefined") {
              const puzzleArray = JSON.parse(puzzleDataStr);
              console.log(`📊 Batch contains ${puzzleArray.length} puzzles`);
              
              // Find puzzle by ARC ID (regardless of prefix)
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
                return puzzle;
              }
            } else {
              console.log(`❌ Batch ${batchKey} is empty or undefined`);
            }
          } else {
            console.log(`❌ Failed to get data for ${batchKey}:`, result);
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
}