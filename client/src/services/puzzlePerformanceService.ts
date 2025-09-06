/**
 * Unified Puzzle Performance Service
 * 
 * Merges PlayFab puzzle data with arc-explainer AI performance metadata
 * Provides single source of truth for Officer Track difficulty filtering
 * 
 * Architecture: PlayFab (authoritative) + arc-explainer (metadata overlay)
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
      const { categorizeDifficulty } = await import('@/services/officerArcAPI');
      const mergedData: MergedPuzzleData[] = puzzleData.puzzles.map(puzzle => {
        const performance = performanceMap.get(puzzle.id);
        const hasPerformanceData = !!performance;
        
        let difficultyCategory: MergedPuzzleData['difficultyCategory'] = undefined;
        if (performance) {
          difficultyCategory = categorizeDifficulty(performance.avgAccuracy, true);
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
   * Search for specific puzzle by ID in merged dataset
   */
  async findPuzzleById(
    puzzleId: string,
    datasetOptions: PuzzleDatasetOptions = {}
  ): Promise<MergedPuzzleData | null> {
    const mergedData = await this.getMergedPuzzleDataset(datasetOptions);
    
    // Try exact match first
    let found = mergedData.find(p => p.id === puzzleId);
    if (found) return found;
    
    // Try with ID conversion
    const validation = arcExplainerAPI.validatePuzzleId(puzzleId);
    if (validation.valid && validation.format === 'arc') {
      // Convert arc ID to possible PlayFab formats
      const datasets: ('training' | 'evaluation' | 'training2' | 'evaluation2')[] = 
        ['training', 'evaluation', 'training2', 'evaluation2'];
      
      for (const dataset of datasets) {
        const playFabId = arcExplainerAPI.convertArcIdToPlayFabId(puzzleId, dataset);
        found = mergedData.find(p => p.id === playFabId);
        if (found) return found;
      }
    } else if (validation.valid && validation.format === 'playfab') {
      // Convert PlayFab ID to arc format and search
      const arcId = arcExplainerAPI.convertPlayFabIdToArcId(puzzleId);
      found = mergedData.find(p => {
        const puzzleArcId = arcExplainerAPI.convertPlayFabIdToArcId(p.id);
        return puzzleArcId === arcId;
      });
      if (found) return found;
    }
    
    return null;
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