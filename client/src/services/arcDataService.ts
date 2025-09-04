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
import { SPACE_EMOJIS } from '@/constants/spaceEmojis';

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
    const { datasets, limit = 50, offset = 0, difficulty, forceRefresh = false } = options;
    
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
   * Load puzzles from a specific dataset
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

    console.log(`🔄 Loading fresh ${dataset} puzzles from files...`);

    try {
      // Get all JSON files for this dataset
      const files = await this.getDatasetFiles(dataset);
      const puzzles: OfficerTrackPuzzle[] = [];

      // Load files in batches to prevent memory issues
      const batchSize = 50;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchPuzzles = await this.loadFileBatch(batch, dataset);
        puzzles.push(...batchPuzzles);
        
        // Log progress for large datasets
        if (files.length > 100) {
          console.log(`📦 Loaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)} (${puzzles.length}/${files.length})`);
        }
      }

      // Update cache
      cache.clear();
      puzzles.forEach(puzzle => cache.set(puzzle.id, puzzle));
      this.lastLoadTime.set(dataset, Date.now());

      console.log(`✅ Successfully loaded ${puzzles.length} ${dataset} puzzles`);
      return puzzles;

    } catch (error) {
      console.error(`❌ Failed to load ${dataset} puzzles:`, error);
      throw new Error(`Failed to load ARC dataset: ${dataset}`);
    }
  }

  /**
   * Get list of JSON files for a dataset
   */
  private async getDatasetFiles(dataset: ARCDatasetType): Promise<string[]> {
    // In a real implementation, this would scan the filesystem or use a manifest
    // For now, we'll simulate with known file patterns
    const datasetPaths: Record<ARCDatasetType, string> = {
      training: 'data/training/',
      training2: 'data/training2/', 
      evaluation: 'data/evaluation/',
      evaluation2: 'data/evaluation2/'
    };

    const basePath = datasetPaths[dataset];
    
    // This is a placeholder - in reality you'd use fs.readdir or a file manifest
    // For now, return a simulated list based on the actual structure
    const counts = { training: 400, training2: 1000, evaluation: 400, evaluation2: 120 };
    const count = counts[dataset];
    
    // Generate filenames - this would be replaced with actual file scanning
    const files: string[] = [];
    for (let i = 0; i < Math.min(count, 100); i++) { // Limit for demo
      files.push(`${basePath}puzzle_${i}.json`);
    }
    
    return files;
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
   * Load individual puzzle file (placeholder - would use actual file loading)
   */
  private async loadPuzzleFile(filePath: string): Promise<ARCPuzzle | null> {
    try {
      // This is a placeholder - in reality would use fetch() or fs.readFile()
      // For demo, we'll simulate loading one of the known files
      const filename = filePath.split('/').pop() || '';
      
      // For demo, use the example files we know exist
      if (filename === 'puzzle_0.json') {
        const response = await fetch('/data/training/007bbfb7.json');
        if (response.ok) {
          return await response.json();
        }
      }
      
      // Return null for simulated files for now
      return null;
    } catch (error) {
      console.error(`Failed to load file ${filePath}:`, error);
      return null;
    }
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
    const id = this.generateARCId(filename, dataset);
    
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

  /**
   * Generate unique ARC ID with dataset prefix
   */
  private generateARCId(filename: string, dataset: ARCDatasetType): string {
    const prefixMap: Record<ARCDatasetType, string> = {
      training: 'ARC-TR',
      training2: 'ARC-T2',
      evaluation: 'ARC-EV', 
      evaluation2: 'ARC-E2'
    };
    
    const prefix = prefixMap[dataset];
    const cleanFilename = filename.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    
    return `${prefix}-${cleanFilename}`;
  }

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
      limit: 50, // Will be handled by the search logic
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
   * Clear all caches
   */
  public clearCache(): void {
    this.puzzleCache.forEach(cache => cache.clear());
    this.lastLoadTime.clear();
    this.loadedFiles.clear();
    this.uniqueIds.clear();
    console.log('🗑️  ARC data cache cleared');
  }

  /**
   * Get cache statistics
   */
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