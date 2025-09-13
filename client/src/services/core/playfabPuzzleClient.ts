/**
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-13
 * PURPOSE: Single client for PlayFab puzzle operations. Replaces duplicate implementations in
 * arcDataService.ts and officerArcAPI.ts. Handles all PlayFab Title Data puzzle operations.
 * SRP and DRY check: Pass - Single responsibility (PlayFab puzzle data), no business logic
 */

import { playFabRequestManager } from '@/services/playfab/requestManager';
import { idConverter, type ARCDatasetType } from '@/services/idConverter';
import { DATASET_DEFINITIONS } from '@shared/datasets';
import { puzzleCache, CacheManager } from './cacheManager';
import type { ARCPuzzle, OfficerTrackPuzzle } from '@/types/arcTypes';

/**
 * Pure PlayFab client for puzzle data operations
 * No business logic, just PlayFab Title Data access
 */
export class PlayFabPuzzleClient {
  private static instance: PlayFabPuzzleClient;

  private constructor() {
    console.log('🎮 PlayFabPuzzleClient initialized');
  }

  public static getInstance(): PlayFabPuzzleClient {
    if (!PlayFabPuzzleClient.instance) {
      PlayFabPuzzleClient.instance = new PlayFabPuzzleClient();
    }
    return PlayFabPuzzleClient.instance;
  }

  /**
   * Load puzzles from a specific dataset batch
   */
  async loadBatch(dataset: ARCDatasetType, batchNumber: number): Promise<OfficerTrackPuzzle[]> {
    const batchKey = idConverter.generateBatchKey(dataset, batchNumber);
    const cacheKey = CacheManager.createKey('playfab-batch', batchKey);

    // Check cache first
    const cached = puzzleCache.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit for batch: ${batchKey}`);
      return cached as OfficerTrackPuzzle[];
    }

    try {
      console.log(`📥 Loading batch from PlayFab: ${batchKey}`);

      const result = await playFabRequestManager.makeRequest<
        { Keys: string[] },
        { Data?: Record<string, string> }
      >('getTitleData', { Keys: [batchKey] });

      if (!result?.Data?.[batchKey] || result.Data[batchKey] === "undefined") {
        console.warn(`No data found for batch: ${batchKey}`);
        return [];
      }

      const puzzles = JSON.parse(result.Data[batchKey]);

      if (!Array.isArray(puzzles)) {
        console.error(`Invalid batch data for ${batchKey}: not an array`);
        return [];
      }

      // Cache the result
      puzzleCache.set(cacheKey, puzzles);

      console.log(`✅ Loaded ${puzzles.length} puzzles from ${batchKey}`);
      return puzzles;

    } catch (error) {
      console.error(`Failed to load batch ${batchKey}:`, error);
      this.logPlayFabError(error);
      return [];
    }
  }

  /**
   * Load all puzzles from a dataset
   */
  async loadDataset(dataset: ARCDatasetType): Promise<OfficerTrackPuzzle[]> {
    const datasetDef = DATASET_DEFINITIONS[dataset];
    if (!datasetDef) {
      console.error(`Unknown dataset: ${dataset}`);
      return [];
    }

    console.log(`📚 Loading dataset ${dataset} (${datasetDef.batchCount} batches)`);

    const allPuzzles: OfficerTrackPuzzle[] = [];

    // Load all batches in parallel for better performance
    const batchPromises = [];
    for (let i = 1; i <= datasetDef.batchCount; i++) {
      batchPromises.push(this.loadBatch(dataset, i));
    }

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(puzzles => allPuzzles.push(...puzzles));

    console.log(`✅ Loaded ${allPuzzles.length} puzzles from ${dataset}`);
    return allPuzzles;
  }

  /**
   * Search for a specific puzzle by ID across all datasets
   */
  async findPuzzleById(puzzleId: string): Promise<OfficerTrackPuzzle | null> {
    const cacheKey = CacheManager.createKey('playfab-puzzle', puzzleId);

    // Check cache first
    const cached = puzzleCache.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit for puzzle: ${puzzleId}`);
      return cached as OfficerTrackPuzzle;
    }

    // Normalize to ARC ID for searching
    const arcId = idConverter.normalizeToArcId(puzzleId);
    if (!arcId) {
      console.error(`Invalid puzzle ID: ${puzzleId}`);
      return null;
    }

    console.log(`🔍 Searching PlayFab for puzzle: ${arcId}`);

    // Search all datasets
    const datasets: ARCDatasetType[] = ['training', 'evaluation', 'training2', 'evaluation2'];

    for (const dataset of datasets) {
      const datasetDef = DATASET_DEFINITIONS[dataset];

      for (let i = 1; i <= datasetDef.batchCount; i++) {
        const puzzles = await this.loadBatch(dataset, i);

        const found = puzzles.find(p => {
          const pArcId = idConverter.normalizeToArcId(p.id);
          return pArcId === arcId;
        });

        if (found) {
          console.log(`✅ Found puzzle ${arcId} in ${dataset} batch ${i}`);
          // Cache the result
          puzzleCache.set(cacheKey, found);
          return found;
        }
      }
    }

    console.log(`❌ Puzzle ${arcId} not found in any PlayFab dataset`);
    return null;
  }

  /**
   * Load multiple puzzles by IDs (batch operation)
   */
  async loadPuzzlesByIds(puzzleIds: string[]): Promise<Map<string, OfficerTrackPuzzle>> {
    const results = new Map<string, OfficerTrackPuzzle>();

    // First check cache for all puzzles
    const uncachedIds: string[] = [];

    for (const id of puzzleIds) {
      const cacheKey = CacheManager.createKey('playfab-puzzle', id);
      const cached = puzzleCache.get(cacheKey);

      if (cached) {
        results.set(id, cached as OfficerTrackPuzzle);
      } else {
        uncachedIds.push(id);
      }
    }

    console.log(`📦 Found ${results.size}/${puzzleIds.length} puzzles in cache`);

    // Load uncached puzzles
    if (uncachedIds.length > 0) {
      // Group by potential dataset for efficiency
      const datasetGroups = this.groupIdsByDataset(uncachedIds);

      for (const [dataset, ids] of datasetGroups.entries()) {
        const puzzles = await this.loadDataset(dataset);

        for (const id of ids) {
          const arcId = idConverter.normalizeToArcId(id);
          if (!arcId) continue;

          const found = puzzles.find(p => {
            const pArcId = idConverter.normalizeToArcId(p.id);
            return pArcId === arcId;
          });

          if (found) {
            results.set(id, found);
            // Cache the found puzzle
            const cacheKey = CacheManager.createKey('playfab-puzzle', id);
            puzzleCache.set(cacheKey, found);
          }
        }
      }
    }

    console.log(`✅ Loaded ${results.size}/${puzzleIds.length} puzzles total`);
    return results;
  }

  /**
   * Get all available puzzle IDs from a dataset
   */
  async getDatasetPuzzleIds(dataset: ARCDatasetType): Promise<string[]> {
    const puzzles = await this.loadDataset(dataset);
    return puzzles.map(p => p.id);
  }

  /**
   * Check if PlayFab is properly initialized
   */
  isInitialized(): boolean {
    return playFabRequestManager.isInitialized();
  }

  /**
   * Clear all cached puzzle data
   */
  clearCache(): void {
    puzzleCache.clear();
    console.log('🧹 Cleared PlayFab puzzle cache');
  }

  /**
   * Private: Group puzzle IDs by likely dataset based on prefix
   */
  private groupIdsByDataset(puzzleIds: string[]): Map<ARCDatasetType, string[]> {
    const groups = new Map<ARCDatasetType, string[]>();

    for (const id of puzzleIds) {
      const dataset = idConverter.getDatasetFromPlayFabId(id);

      if (dataset) {
        if (!groups.has(dataset)) {
          groups.set(dataset, []);
        }
        groups.get(dataset)!.push(id);
      } else {
        // If we can't determine dataset from ID, we'll need to search all
        // Add to training by default (most common)
        if (!groups.has('training')) {
          groups.set('training', []);
        }
        groups.get('training')!.push(id);
      }
    }

    return groups;
  }

  /**
   * Private: Log PlayFab-specific errors with helpful context
   */
  private logPlayFabError(error: any): void {
    if (error instanceof Error) {
      if (error.message.includes('PlayFab not initialized')) {
        console.error('💡 PlayFab not initialized. Check VITE_PLAYFAB_TITLE_ID and authentication.');
      } else if (error.message.includes('HTTP 401') || error.message.includes('Unauthorized')) {
        console.error('💡 PlayFab authentication failed. Check VITE_PLAYFAB_SECRET_KEY.');
      } else if (error.message.includes('HTTP 404')) {
        console.error('💡 PlayFab Title Data not found. Ensure puzzles are uploaded.');
      } else if (error.message.includes('JSON.parse')) {
        console.error('💡 Invalid JSON in PlayFab Title Data.');
      }
    }
  }
}

// Export singleton instance
export const playfabPuzzleClient = PlayFabPuzzleClient.getInstance();