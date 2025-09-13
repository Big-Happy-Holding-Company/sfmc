/**
 * @deprecated THIS SERVICE IS DEPRECATED AND SHOULD NOT BE USED.
 * This service attempted to merge data from multiple sources but has been superseded
 * by a more robust and efficient implementation in the new core service architecture.
 *
 * MIGRATION PATH:
 * - All functionality is now handled by `puzzleRepository` from `@/services/core/puzzleRepository`.
 *   It provides unified data access with integrated caching and performance enhancement.
 *
 * @author Gemini 2.5 Pro
 * @see puzzleRepository
 */

import { arcDataService } from '@/services/arcDataService';
import { arcExplainerAPI, type AIPuzzlePerformance } from '@/services/arcExplainerAPI';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';

export interface MergedPuzzleData extends OfficerTrackPuzzle {
  aiPerformance?: AIPuzzlePerformance;
  difficultyCategory?: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging';
  hasPerformanceData: boolean;
}

export interface PuzzleDatasetOptions {
  datasets?: ('training' | 'evaluation' | 'training2' | 'evaluation2')[];
  difficulty?: string[];
  limit?: number;
  offset?: number;
}

export interface PerformanceFilters {
  difficulty?: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging';
  zeroAccuracyOnly?: boolean;
  minAccuracy?: number;
  maxAccuracy?: number;
}

/**
 * Categorize puzzle difficulty based on AI accuracy for this service.
 */
function categorizeDifficulty(accuracy: number): 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' {
  const percentage = accuracy * 100;
  if (percentage === 0) return 'impossible';
  if (percentage > 0 && percentage <= 25) return 'extremely_hard';
  if (percentage > 25 && percentage <= 50) return 'very_hard';
  return 'challenging';
}

class PuzzlePerformanceService {
  private cache: Map<string, MergedPuzzleData[]> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamp = 0;

  /**
   * Get merged dataset: PlayFab puzzles + arc-explainer performance data
   */
  async getMergedPuzzleDataset(
    datasetOptions: PuzzleDatasetOptions = {}
  ): Promise<MergedPuzzleData[]> {
    const cacheKey = JSON.stringify(datasetOptions);
    
    // Check cache first
    if (this.isCached(cacheKey)) {
      console.log('📦 Using cached merged puzzle dataset');
      return this.cache.get(cacheKey)!;
    }

    try {
      console.log('🔄 Loading merged puzzle dataset...', datasetOptions);
      
      // Step 1: Load PlayFab puzzles (authoritative source)
      const arcLoadOptions = {
        datasets: datasetOptions.datasets || ['training', 'evaluation', 'training2', 'evaluation2'],
        limit: datasetOptions.limit,
        offset: datasetOptions.offset
        // Remove difficulty field as it has incompatible types
      };
      const puzzleData = await arcDataService.loadARCPuzzles(arcLoadOptions);
      console.log(`📋 Loaded ${puzzleData.puzzles.length} PlayFab puzzles`);
      
      // Step 2: Get performance data from arc-explainer API
      const puzzleIds = puzzleData.puzzles.map(p => p.id);
      const performanceMap = await arcExplainerAPI.getBatchPuzzlePerformance(puzzleIds);
      console.log(`🤖 Got performance data for ${performanceMap.size}/${puzzleIds.length} puzzles`);
      
      // Step 3: Merge data
      const mergedData: MergedPuzzleData[] = puzzleData.puzzles.map(puzzle => {
        const performance = performanceMap.get(puzzle.id);
        const hasPerformanceData = !!performance;
        
        let difficultyCategory: MergedPuzzleData['difficultyCategory'] = undefined;
        if (performance) {
          difficultyCategory = categorizeDifficulty(performance.avgAccuracy);
        }
        
        return {
          ...puzzle,
          aiPerformance: performance,
          difficultyCategory,
          hasPerformanceData
        };
      });
      
      console.log(`✅ Created merged dataset: ${mergedData.length} puzzles, ${mergedData.filter(p => p.hasPerformanceData).length} with AI data`);
      
      // Cache the result
      this.cache.set(cacheKey, mergedData);
      this.cacheTimestamp = Date.now();
      
      return mergedData;
      
    } catch (error) {
      console.error('❌ Failed to create merged puzzle dataset:', error);
      throw error;
    }
  }

  /**
   * Filter merged dataset by AI performance criteria
   */
  filterByPerformance(
    mergedData: MergedPuzzleData[],
    filters: PerformanceFilters
  ): MergedPuzzleData[] {
    return mergedData.filter(puzzle => {
      // Must have performance data to filter by performance criteria
      if (!puzzle.hasPerformanceData || !puzzle.aiPerformance) {
        return false;
      }
      
      const performance = puzzle.aiPerformance;
      
      // Difficulty category filter
      if (filters.difficulty && puzzle.difficultyCategory !== filters.difficulty) {
        return false;
      }
      
      // Zero accuracy only filter
      if (filters.zeroAccuracyOnly && performance.avgAccuracy !== 0) {
        return false;
      }
      
      // Accuracy range filters
      if (filters.minAccuracy !== undefined && performance.avgAccuracy < filters.minAccuracy) {
        return false;
      }
      
      if (filters.maxAccuracy !== undefined && performance.avgAccuracy > filters.maxAccuracy) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get difficulty statistics from merged dataset
   */
  getDifficultyStats(mergedData: MergedPuzzleData[]) {
    const stats = {
      impossible: 0,
      extremely_hard: 0,
      very_hard: 0,
      challenging: 0,
      total: 0,
      withPerformanceData: 0,
      withoutPerformanceData: 0
    };
    
    mergedData.forEach(puzzle => {
      stats.total++;
      
      if (puzzle.hasPerformanceData && puzzle.difficultyCategory) {
        stats.withPerformanceData++;
        stats[puzzle.difficultyCategory]++;
      } else {
        stats.withoutPerformanceData++;
      }
    });
    
    return stats;
  }

  /**
   * Get puzzles by specific difficulty category
   */
  async getPuzzlesByDifficulty(
    category: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging',
    datasetOptions: PuzzleDatasetOptions = {}
  ): Promise<MergedPuzzleData[]> {
    const mergedData = await this.getMergedPuzzleDataset(datasetOptions);
    return this.filterByPerformance(mergedData, { difficulty: category });
  }

  /**
   * Get impossible puzzles (0% AI accuracy)
   */
  async getImpossiblePuzzles(
    datasetOptions: PuzzleDatasetOptions = {}
  ): Promise<MergedPuzzleData[]> {
    const mergedData = await this.getMergedPuzzleDataset(datasetOptions);
    return this.filterByPerformance(mergedData, { zeroAccuracyOnly: true });
  }

  /**
   * Search for a specific puzzle by ID, prioritizing arc-explainer API
   * and resolving the correct PlayFab ID on the fly.
   */
  async findPuzzleById(puzzleId: string): Promise<MergedPuzzleData | null> {
    console.log(`🔍 Finding puzzle by ID: ${puzzleId}`);

    try {
      // Step 1: Get puzzle data from arc-explainer API (source of truth for metadata)
      const rawArcId = arcExplainerAPI.convertPlayFabIdToArcId(puzzleId);
      const explainerData = await arcExplainerAPI.getPuzzleById(rawArcId);

      if (!explainerData) {
        console.error(`❌ Puzzle ${rawArcId} not found in arc-explainer API.`);
        return null;
      }

      // Step 2: Find the correct PlayFab ID using the new service method
      const correctPlayFabId = await arcDataService.findPlayFabIdForArcId(rawArcId);

      if (!correctPlayFabId) {
        console.error(`❌ Could not resolve PlayFab ID for ARC ID ${rawArcId}.`);
        return null;
      }

      // Step 3: Load the authoritative puzzle data from PlayFab using the correct ID
      // This assumes `loadPuzzleFromPlayFab` is updated or a similar method exists
      // For now, we'll use the search method which is less efficient but functional
      const puzzleData = await arcDataService.searchPuzzleById(correctPlayFabId);

      if (!puzzleData) {
        console.error(`❌ Failed to load puzzle data for PlayFab ID ${correctPlayFabId}.`);
        return null;
      }

      // Step 4: Merge the data
      const performance = await arcExplainerAPI.getPuzzlePerformance(correctPlayFabId);
      const hasPerformanceData = !!performance;
      const difficultyCategory = performance ? categorizeDifficulty(performance.avgAccuracy) : undefined;

      const mergedData: MergedPuzzleData = {
        ...puzzleData,
        aiPerformance: performance || undefined,
        difficultyCategory,
        hasPerformanceData,
      };

      console.log('✅ Successfully found and merged puzzle data:', mergedData.id);
      return mergedData;

    } catch (error) {
      console.error(`❌ Critical error in findPuzzleById for ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Cache management
   */
  private isCached(key: string): boolean {
    if (!this.cache.has(key)) return false;
    
    const isExpired = Date.now() - this.cacheTimestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.clearCache();
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp = 0;
    console.log('🧹 Cleared puzzle performance cache');
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    return {
      entries: this.cache.size,
      lastUpdate: new Date(this.cacheTimestamp).toISOString(),
      isExpired: Date.now() - this.cacheTimestamp > this.CACHE_DURATION
    };
  }
}

// Export singleton instance
export const puzzlePerformanceService = new PuzzlePerformanceService();