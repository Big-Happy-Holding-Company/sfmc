/**
 * ARC Data Processing Service
 * Handles loading, processing, and transformation of raw ARC JSON puzzle files
 * 
 * Key Features:
 * - Lazy loading with pagination for 1,920+ puzzles
 * - Unique ID generation with duplicate detection
 * - Integer-to-emoji transformation for UI presentation
 * - Difficulty estimation and complexity analysis
 * - Intelligent caching for performance
 * - Importing arcDataService, arcExplainerAPI, and loadPuzzleFromPlayFab
 */

import type { 
  ARCPuzzle, 
  ARCGrid,
  ARCDatasetType, 
  OfficerTrackPuzzle,
  OfficerRankRequirement,
  ARCServiceConfig,
  ARCLoadOptions,
  ARCPuzzleSearchResult,
  ARCPuzzleFilters,
  ARCDisplayGrid
} from '@/types/arcTypes';
import { DATASET_DEFINITIONS } from '@shared/datasets';
import { SPACE_EMOJIS } from '@/constants/spaceEmojis';
import { loadPuzzleFromPlayFab } from '@/services/officerArcAPI';
import { idConverter } from '@/services/idConverter';

/**
 * ARC Data Service - Singleton for managing ARC puzzle data
 */
export class ARCDataService {
  private static instance: ARCDataService;
  
  // Puzzle cache organized by dataset
  private puzzleCache: Map<ARCDatasetType, Map<string, OfficerTrackPuzzle>> = new Map();
  private lastLoadTime: Map<ARCDatasetType, number> = new Map();
  
  // Configuration
  private config: ARCServiceConfig = {
    batchSize: 50,
    cacheTimeout: 10 * 60 * 1000, // 10 minutes
    enableDifficultyEstimation: true,
    defaultEmojiSet: 'tech_set1'
  };
  
  // File loading cache to prevent duplicate loads
  private loadedFiles: Set<string> = new Set();
  private uniqueIds: Set<string> = new Set();

  private constructor() {
    // Initialize cache maps
    this.puzzleCache.set('training', new Map());
    this.puzzleCache.set('training2', new Map());  
    this.puzzleCache.set('evaluation', new Map());
    this.puzzleCache.set('evaluation2', new Map());
  }

  public static getInstance(): ARCDataService {
    if (!ARCDataService.instance) {
      ARCDataService.instance = new ARCDataService();
    }
    return ARCDataService.instance;
  }

  /**
   * Load ARC puzzles from specified datasets with pagination
   */
  public async loadARCPuzzles(options: ARCLoadOptions): Promise<ARCPuzzleSearchResult> {
    const { datasets, offset = 0, difficulty, forceRefresh = false } = options;
    const limit = options.limit || Number.MAX_SAFE_INTEGER; // No artificial limits
    
    console.log(`🎯 Loading ARC puzzles:`, { datasets, limit, offset, difficulty });

    // Load puzzles from all requested datasets
    const allPuzzles: OfficerTrackPuzzle[] = [];
    
    for (const dataset of datasets) {
      const datasetPuzzles = await this.loadDatasetPuzzles(dataset, forceRefresh);
      allPuzzles.push(...datasetPuzzles);
    }

    // Apply difficulty filter if specified
    const filteredPuzzles = difficulty?.length 
      ? allPuzzles.filter(p => difficulty.includes(p.difficulty))
      : allPuzzles;

    // Apply pagination
    const totalCount = filteredPuzzles.length;
    const paginatedPuzzles = filteredPuzzles.slice(offset, offset + limit);

    console.log(`✅ Loaded ${paginatedPuzzles.length}/${totalCount} ARC puzzles`);

    return {
      puzzles: paginatedPuzzles,
      totalCount,
      currentPage: Math.floor(offset / limit),
      totalPages: Math.ceil(totalCount / limit),
      filters: {
        dataset: datasets,
        difficulty,
        sortBy: 'id',
        sortDirection: 'asc'
      }
    };
  }

  /**
   * Load puzzles from a specific dataset (from PlayFab Title Data)
   */
  private async loadDatasetPuzzles(
    dataset: ARCDatasetType, 
    forceRefresh: boolean = false
  ): Promise<OfficerTrackPuzzle[]> {
    
    const cache = this.puzzleCache.get(dataset)!;
    const lastLoad = this.lastLoadTime.get(dataset) || 0;
    const isExpired = Date.now() - lastLoad > this.config.cacheTimeout;

    // Return cached data if available and not expired
    if (cache.size > 0 && !isExpired && !forceRefresh) {
      console.log(`📋 Using cached ${dataset} puzzles: ${cache.size}`);
      return Array.from(cache.values());
    }

    console.log(`🔄 Loading fresh ${dataset} puzzles from PlayFab Title Data...`);

    try {
      const puzzles = await this.loadDatasetFromPlayFab(dataset);

      // Update cache
      cache.clear();
      puzzles.forEach(puzzle => cache.set(puzzle.id, puzzle));
      this.lastLoadTime.set(dataset, Date.now());

      console.log(`✅ Successfully loaded ${puzzles.length} ${dataset} puzzles from PlayFab`);
      return puzzles;

    } catch (error) {
      console.error(`❌ Failed to load ${dataset} puzzles from PlayFab:`, error);
      throw new Error(`Failed to load ARC dataset: ${dataset}`);
    }
  }

  /**
   * Load dataset puzzles from PlayFab Title Data (batched structure)
   */
  private async loadDatasetFromPlayFab(dataset: ARCDatasetType): Promise<OfficerTrackPuzzle[]> {
    const allPuzzles: OfficerTrackPuzzle[] = [];

    // Get dataset definition from the single source of truth
    const datasetDef = DATASET_DEFINITIONS[dataset];
    if (!datasetDef) {
      console.error(`Unknown dataset type: ${dataset}`);
      return [];
    }

    const totalBatches = datasetDef.batchCount;

    // Load all batches for this dataset
    for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
      const titleDataKey = `officer-tasks-${dataset}-batch${batchNum}.json`;
      
      try {
        const batchPuzzles = await this.loadPlayFabTitleData(titleDataKey);
        if (batchPuzzles && Array.isArray(batchPuzzles)) {
          // Debug: Log structure of first puzzle to understand PlayFab data format
          if (batchPuzzles.length > 0) {
            console.log(`🔍 PlayFab puzzle structure sample from ${titleDataKey}:`, {
              keys: Object.keys(batchPuzzles[0]),
              id: batchPuzzles[0].id,
              filename: batchPuzzles[0].filename,
              sample: batchPuzzles[0]
            });
          }
          allPuzzles.push(...batchPuzzles);
          console.log(`📦 Loaded batch ${batchNum}/${totalBatches}: ${batchPuzzles.length} puzzles`);
        } else {
          console.warn(`⚠️  No data found for ${titleDataKey}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load batch ${batchNum} for ${dataset}:`, error);
        // Continue with other batches rather than failing completely
      }
    }

    return allPuzzles;
  }

  /**
   * Load data from PlayFab Title Data using Admin API
   */
  private async loadPlayFabTitleData(key: string, isSinglePuzzleKey: boolean = false): Promise<any | null> {
    try {
      const { playFabRequestManager } = await import('./playfab/requestManager');
      const result = await playFabRequestManager.makeRequest<{ Keys: string[] }, { Data?: Record<string, string> }>(
        'getTitleData',
        { Keys: [key] }
      );

      if (!result?.Data?.[key] || result.Data[key] === "undefined") {
        console.warn(`No title data found for key: ${key}`);
        return null;
      }

      const puzzleData = JSON.parse(result.Data[key]);
      
      // If it's a single puzzle key, it might not be an array
      if (isSinglePuzzleKey) {
        return puzzleData;
      }

      return Array.isArray(puzzleData) ? puzzleData : null;

    } catch (error) {
      console.error(`Failed to load PlayFab title data for ${key}:`, error);
      
      // Provide specific guidance based on error type
      if (error instanceof Error) {
        if (error.message.includes('PlayFab not initialized')) {
          console.error(`💡 PlayFab initialization failed. Ensure VITE_PLAYFAB_TITLE_ID and VITE_PLAYFAB_SECRET_KEY are set.`);
        } else if (error.message.includes('HTTP 401') || error.message.includes('Unauthorized')) {
          console.error(`💡 PlayFab authentication failed. Check VITE_PLAYFAB_SECRET_KEY in environment.`);
        } else if (error.message.includes('HTTP 404')) {
          console.error(`💡 PlayFab title data key "${key}" not found. Ensure data was uploaded correctly.`);
        } else if (error.message.includes('JSON.parse')) {
          console.error(`💡 Invalid JSON in PlayFab title data. The data may be corrupted or contain "undefined" strings.`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Get list of actual JSON files for a dataset from file manifests
   * Real implementation - loads actual file lists, no simulation
   */
  private async getDatasetFiles(dataset: ARCDatasetType): Promise<string[]> {
    const manifestPaths: Record<ARCDatasetType, string> = {
      training: '/data/training-manifest.json',
      training2: '/data/training2-manifest.json', 
      evaluation: '/data/evaluation-manifest.json',
      evaluation2: '/data/evaluation2-manifest.json'
    };

    const basePaths: Record<ARCDatasetType, string> = {
      training: '/data/training/',
      training2: '/data/training2/', 
      evaluation: '/data/evaluation/',
      evaluation2: '/data/evaluation2/'
    };

    try {
      // Try to load manifest file first
      const manifestResponse = await fetch(manifestPaths[dataset]);
      if (manifestResponse.ok) {
        const filenames: string[] = await manifestResponse.json();
        return filenames.map(name => `${basePaths[dataset]}${name}`);
      }
    } catch (error) {
      console.warn(`Could not load manifest for ${dataset}, falling back to known files`);
    }

    // Fallback: Use hardcoded list of known files for each dataset
    return this.getKnownFilesForDataset(dataset);
  }

  /**
   * Load a batch of puzzle files
   */
  private async loadFileBatch(
    files: string[], 
    dataset: ARCDatasetType
  ): Promise<OfficerTrackPuzzle[]> {
    const puzzles: OfficerTrackPuzzle[] = [];

    for (const filePath of files) {
      try {
        // Skip if already loaded to prevent duplicates
        if (this.loadedFiles.has(filePath)) {
          continue;
        }

        const rawPuzzle = await this.loadPuzzleFile(filePath);
        if (rawPuzzle) {
          const enhancedPuzzle = await this.enhancePuzzle(rawPuzzle, filePath, dataset);
          
          // Check for unique ID to prevent duplicates across datasets
          if (!this.uniqueIds.has(enhancedPuzzle.id)) {
            puzzles.push(enhancedPuzzle);
            this.uniqueIds.add(enhancedPuzzle.id);
            this.loadedFiles.add(filePath);
          } else {
            console.warn(`⚠️  Duplicate puzzle ID detected: ${enhancedPuzzle.id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to load puzzle file ${filePath}:`, error);
        // Continue with other files rather than failing completely
      }
    }

    return puzzles;
  }

  /**
   * Load individual puzzle file using real browser fetch()
   * REAL implementation - no simulation or placeholders
   */
  private async loadPuzzleFile(filePath: string): Promise<ARCPuzzle | null> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        console.warn(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      // Validate that this is a proper ARC puzzle format
      if (!this.isValidARCPuzzle(data)) {
        console.warn(`Invalid ARC puzzle format in ${filePath}`);
        return null;
      }

      return data as ARCPuzzle;
    } catch (error) {
      console.error(`Failed to load file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Validate that data is a proper ARC puzzle format
   */
  private isValidARCPuzzle(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.train) || !Array.isArray(data.test)) return false;
    
    // Check that train and test contain proper example structures
    const validateExample = (example: any) => {
      return example && 
             Array.isArray(example.input) && 
             Array.isArray(example.output) &&
             example.input.every((row: any) => Array.isArray(row)) &&
             example.output.every((row: any) => Array.isArray(row));
    };

    return data.train.every(validateExample) && data.test.every(validateExample);
  }

  /**
   * Get known file lists for each dataset (fallback when manifest not available)
   * Real file names from actual directories
   */
  private getKnownFilesForDataset(dataset: ARCDatasetType): string[] {
    const basePaths: Record<ARCDatasetType, string> = {
      training: '/data/training/',
      training2: '/data/training2/', 
      evaluation: '/data/evaluation/',
      evaluation2: '/data/evaluation2/'
    };

    // Emergency fallback: Only if manifests completely fail to load
    // These are just a few real files for absolute emergency fallback
    const emergencyFallbackFiles: Record<ARCDatasetType, string[]> = {
      training: [
        '007bbfb7.json', '00d62c1b.json', '017c7c7b.json', '025d127b.json', '045e512c.json'
      ],
      training2: [],
      evaluation: [
        '00576224.json', '009d5c81.json', '00dbd492.json', '03560426.json', '05a7bcf2.json'
      ],
      evaluation2: []
    };

    const basePath = basePaths[dataset];
    const files = emergencyFallbackFiles[dataset];
    
    console.warn(`Using emergency fallback files for ${dataset} - only ${files.length} puzzles available`);
    return files.map(filename => `${basePath}${filename}`);
  }

  /**
   * Enhance raw ARC puzzle with metadata and analysis
   */
  private async enhancePuzzle(
    rawPuzzle: ARCPuzzle,
    filePath: string,
    dataset: ARCDatasetType
  ): Promise<OfficerTrackPuzzle> {
    
    const filename = filePath.split('/').pop()?.replace('.json', '') || 'unknown';
    const id = idConverter.arcToPlayFab(filename, dataset);
    
    // Analyze grid dimensions
    const allGrids = [
      ...rawPuzzle.train.flatMap(ex => [ex.input, ex.output]),
      ...rawPuzzle.test.flatMap(ex => [ex.input, ex.output])
    ];
    
    const dimensions = this.analyzeGridDimensions(allGrids);
    const complexity = this.analyzeComplexity(rawPuzzle);
    const difficulty = this.estimateDifficulty(rawPuzzle);

    return {
      ...rawPuzzle,
      id,
      filename,
      dataset,
      difficulty,
      gridSize: dimensions,
      complexity,
      loadedAt: new Date()
    };
  }

  // ID generation now handled by centralized idConverter service

  /**
   * Analyze grid dimensions across all examples
   */
  private analyzeGridDimensions(grids: ARCGrid[]): {
    minWidth: number;
    maxWidth: number;
    minHeight: number; 
    maxHeight: number;
  } {
    let minWidth = Infinity, maxWidth = 0;
    let minHeight = Infinity, maxHeight = 0;

    grids.forEach(grid => {
      const height = grid.length;
      const width = grid[0]?.length || 0;
      
      minHeight = Math.min(minHeight, height);
      maxHeight = Math.max(maxHeight, height);
      minWidth = Math.min(minWidth, width);
      maxWidth = Math.max(maxWidth, width);
    });

    return {
      minWidth: minWidth === Infinity ? 0 : minWidth,
      maxWidth,
      minHeight: minHeight === Infinity ? 0 : minHeight,
      maxHeight
    };
  }

  /**
   * Analyze puzzle complexity
   */
  private analyzeComplexity(puzzle: ARCPuzzle) {
    const trainingExamples = puzzle.train.length;
    
    // Count unique colors across all grids
    const allValues = new Set<number>();
    [...puzzle.train, ...puzzle.test].forEach(example => {
      [example.input, example.output].forEach(grid => {
        grid.forEach(row => row.forEach(cell => allValues.add(cell)));
      });
    });

    const uniqueColors = allValues.size;
    
    // Estimate transformation complexity based on various factors
    let transformationComplexity: 'simple' | 'moderate' | 'complex' | 'expert' = 'simple';
    
    if (uniqueColors > 6 || trainingExamples > 3) {
      transformationComplexity = 'moderate';
    }
    if (uniqueColors > 8 || trainingExamples > 4) {
      transformationComplexity = 'complex';  
    }
    if (uniqueColors === 10 && trainingExamples > 5) {
      transformationComplexity = 'expert';
    }

    return {
      trainingExamples,
      uniqueColors,
      transformationComplexity
    };
  }

  /**
   * Estimate difficulty level for officer rank requirements
   */
  private estimateDifficulty(puzzle: ARCPuzzle): OfficerRankRequirement {
    const complexity = this.analyzeComplexity(puzzle);
    
    // Map complexity to officer ranks
    switch (complexity.transformationComplexity) {
      case 'simple':
        return 'LIEUTENANT';
      case 'moderate': 
        return 'CAPTAIN';
      case 'complex':
        return 'MAJOR';  
      case 'expert':
        return 'COLONEL';
      default:
        return 'LIEUTENANT';
    }
  }

  /**
   * Transform integer grid to emoji display grid
   */
  public transformIntegersToEmojis(
    grid: ARCGrid, 
    emojiSet: string = this.config.defaultEmojiSet
  ): ARCDisplayGrid {
    const emojis = SPACE_EMOJIS[emojiSet as keyof typeof SPACE_EMOJIS];
    if (!emojis) {
      console.warn(`Unknown emoji set: ${emojiSet}, using default`);
      const defaultEmojis = SPACE_EMOJIS[this.config.defaultEmojiSet as keyof typeof SPACE_EMOJIS];
      return grid.map(row => row.map(cell => defaultEmojis[cell] || defaultEmojis[0]));
    }

    return grid.map(row => 
      row.map(cell => {
        // Ensure cell value is within valid range (0-9)
        const safeCell = Math.max(0, Math.min(9, cell));
        return emojis[safeCell];
      })
    );
  }

  /**
   * Get puzzle by ID
   */
  public async getPuzzleById(id: string): Promise<OfficerTrackPuzzle | null> {
    // Check all dataset caches
    for (const cache of this.puzzleCache.values()) {
      const puzzle = cache.get(id);
      if (puzzle) {
        return puzzle;
      }
    }
    
    console.warn(`Puzzle not found in cache: ${id}`);
    return null;
  }

  /**
   * Search puzzles with filters and pagination
   */
  public async searchPuzzles(filters: ARCPuzzleFilters): Promise<ARCPuzzleSearchResult> {
    const datasets = filters.dataset || ['training', 'training2', 'evaluation', 'evaluation2'];
    
    const options: ARCLoadOptions = {
      datasets,
      difficulty: filters.difficulty,
      // No artificial limits - load all available puzzles
      offset: 0
    };

    // Load all matching puzzles
    const result = await this.loadARCPuzzles(options);
    
    // Apply additional filters
    let filteredPuzzles = result.puzzles;
    
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredPuzzles = filteredPuzzles.filter(p => 
        p.id.toLowerCase().includes(searchTerm) ||
        p.filename.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.completed !== undefined) {
      // This would integrate with player progress data
      // For now, just return all puzzles
    }

    // Apply sorting
    filteredPuzzles.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'difficulty':
          const difficultyOrder = ['LIEUTENANT', 'CAPTAIN', 'MAJOR', 'COLONEL', 'GENERAL'];
          comparison = difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
          break;
        case 'complexity':
          comparison = a.complexity.uniqueColors - b.complexity.uniqueColors;
          break;
        case 'dataset':
          comparison = a.dataset.localeCompare(b.dataset);
          break;
        case 'id':
        default:
          comparison = a.id.localeCompare(b.id);
          break;
      }
      
      return filters.sortDirection === 'desc' ? -comparison : comparison;
    });

    return {
      puzzles: filteredPuzzles,
      totalCount: filteredPuzzles.length,
      currentPage: 0,
      totalPages: 1,
      filters
    };
  }

  /**
   * Search for a specific puzzle by ID across all datasets
   */
  public async searchPuzzleById(puzzleId: string): Promise<OfficerTrackPuzzle | null> {
    const cleanId = puzzleId.trim();
    
    // First check if we already have it in cache
    for (const cache of this.puzzleCache.values()) {
      for (const puzzle of cache.values()) {
        if (puzzle.filename === cleanId || puzzle.id.includes(cleanId)) {
          return puzzle;
        }
      }
    }

    // If not in cache, load from PlayFab
    console.log(`🔍 Loading puzzle ${cleanId} from PlayFab...`);
    
    try {
      const puzzleData = await loadPuzzleFromPlayFab(cleanId);
      
      if (puzzleData) {
        console.log(`✅ Found puzzle ${cleanId} in PlayFab`);
        return puzzleData;
      } else {
        console.log(`❌ Puzzle ${cleanId} not found in PlayFab`);
      }
    } catch (error) {
      console.error(`❌ Failed to load puzzle ${cleanId} from PlayFab:`, error);
    }

    return null;
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.puzzleCache.forEach(cache => cache.clear());
    this.lastLoadTime.clear();
    this.loadedFiles.clear();
    this.uniqueIds.clear();
    // Cache cleared
  }

  /**
   * Get cache statistics
   */
  /**
   * Find the correct PlayFab ID for a given raw ARC puzzle ID.
   * Iterates through all possible dataset prefixes to find a match.
   */
  public async findPlayFabIdForArcId(arcId: string): Promise<string | null> {
    console.log(`🔄 Searching all datasets for ARC ID: ${arcId}`);
    const datasetsToSearch: ARCDatasetType[] = ['training', 'evaluation', 'training2', 'evaluation2'];

    for (const dataset of datasetsToSearch) {
      try {
        const puzzles = await this.loadDatasetPuzzles(dataset, false); // forceRefresh = false to use cache
        console.log(`🔍 Dataset ${dataset}: loaded ${puzzles.length} puzzles`);
        
        // Debug: Log first few puzzles to see actual structure
        if (puzzles.length > 0) {
          console.log(`🔍 Sample puzzle from ${dataset}:`, {
            id: puzzles[0].id,
            filename: puzzles[0].filename,
            hasFilename: 'filename' in puzzles[0],
            keys: Object.keys(puzzles[0])
          });
        }
        
        // Search using the PROVEN working approach from test-officer-track-e2e.cjs
        const foundPuzzle = puzzles.find(p => {
          // Extract clean ID from prefixed PlayFab ID (ARC-TR-007bbfb7 -> 007bbfb7)
          const cleanId = p.id?.replace(/^ARC-[A-Z0-9]+-/, '');
          return cleanId === arcId ||           // Primary: extract from prefixed ID  
                 p.filename === arcId ||        // Fallback: filename field (if exists)
                 p.id?.endsWith(`-${arcId}`);   // Fallback: ID suffix matching
        });

        if (foundPuzzle) {
          console.log(`✅ Found matching puzzle in dataset '${dataset}'. PlayFab ID: ${foundPuzzle.id}, filename: ${foundPuzzle.filename}`);
          return foundPuzzle.id;
        }
      } catch (error) {
        console.error(`❌ Error loading dataset '${dataset}' while searching for ${arcId}:`, error);
      }
    }

    console.error(`❌ No matching PlayFab ID found for ARC ID: ${arcId} after searching all datasets.`);
    return null;
  }

  public getCacheStats() {
    const stats: Record<string, any> = {};
    
    this.puzzleCache.forEach((cache, dataset) => {
      stats[dataset] = {
        count: cache.size,
        lastLoaded: this.lastLoadTime.get(dataset),
        isExpired: this.isDatasetExpired(dataset)
      };
    });

    return {
      datasets: stats,
      totalPuzzles: Array.from(this.puzzleCache.values()).reduce((sum, cache) => sum + cache.size, 0),
      uniqueIds: this.uniqueIds.size,
      loadedFiles: this.loadedFiles.size
    };
  }

  /**
   * Check if dataset cache is expired
   */
  private isDatasetExpired(dataset: ARCDatasetType): boolean {
    const lastLoad = this.lastLoadTime.get(dataset) || 0;
    return Date.now() - lastLoad > this.config.cacheTimeout;
  }

  /**
   * Update service configuration
   */
  public updateConfig(newConfig: Partial<ARCServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️  ARC service config updated:', this.config);
  }
}

// Export singleton instance
export const arcDataService = ARCDataService.getInstance();

/**
 * React hook for using ARC data service with rich metadata
 */
import { useState, useCallback, useEffect } from 'react';
import { puzzlePerformanceService, type MergedPuzzleData } from './puzzlePerformanceService';

export interface EnhancedPuzzleFile {
  filename: string;
  dataset: ARCDatasetType;
  id: string;
  // Grid dimension metadata
  gridSize: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
  };
  // Test case information
  testCaseCount: number;
  trainingExampleCount: number;
  // Complexity metrics
  complexity: {
    uniqueColors: number;
    transformationComplexity: 'simple' | 'moderate' | 'complex' | 'expert';
  };
  // AI performance data (if available)
  aiPerformance?: {
    avgAccuracy: number;
    avgConfidence?: number;
    wrongCount?: number;
    totalExplanations?: number;
    difficultyCategory?: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging';
  };
  // Difficulty from local analysis
  difficulty: OfficerRankRequirement;
}

export function useARCData() {
  const [puzzleFiles, setPuzzleFiles] = useState<EnhancedPuzzleFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDataset = useCallback(async (dataset: ARCDatasetType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load rich metadata using puzzlePerformanceService
      const mergedData = await puzzlePerformanceService.getMergedPuzzleDataset({
        datasets: [dataset],
        // Load all available puzzles - no artificial limits
      });
      
      // Convert to enhanced format with rich metadata
      const enhancedFiles: EnhancedPuzzleFile[] = mergedData.map(puzzle => ({
        filename: `${puzzle.filename}.json`,
        dataset: puzzle.dataset,
        id: puzzle.id,
        gridSize: puzzle.gridSize,
        testCaseCount: puzzle.test?.length || 0,
        trainingExampleCount: puzzle.train?.length || 0,
        complexity: {
          uniqueColors: puzzle.complexity.uniqueColors,
          transformationComplexity: puzzle.complexity.transformationComplexity
        },
        aiPerformance: puzzle.hasPerformanceData ? {
          avgAccuracy: puzzle.aiPerformance!.avgAccuracy,
          avgConfidence: puzzle.aiPerformance!.avgConfidence,
          wrongCount: puzzle.aiPerformance!.wrongCount,
          totalExplanations: puzzle.aiPerformance!.totalExplanations,
          difficultyCategory: puzzle.difficultyCategory
        } : undefined,
        difficulty: puzzle.difficulty
      }));
      
      setPuzzleFiles(enhancedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset');
      setPuzzleFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    puzzleFiles,
    isLoading,
    error,
    loadDataset
  };
}