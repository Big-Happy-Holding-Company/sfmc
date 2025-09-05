/**
 * arc-explainer HTTP API Client
 * 
 * Makes browser HTTP calls to external arc-explainer server
 * Retrieves AI performance and trustworthiness data for puzzle curation
 * 
 * ARCHITECTURE: Static-only SFMC app calls external API via HTTP
 */

// Types matching arc-explainer API response structure
export interface AIPuzzlePerformance {
  puzzleId: string;
  wrongCount: number;
  avgAccuracy: number;
  avgConfidence: number;
  totalExplanations: number;
  negativeFeedback: number;
  totalFeedback: number;
  latestAnalysis: string;
  worstExplanationId: number;
  compositeScore: number;
}

export interface WorstPerformingPuzzlesResponse {
  success: boolean;
  data: {
    puzzles: AIPuzzlePerformance[];
    total: number;
  };
}

export interface APIFilters {
  limit?: number;
  sortBy?: 'composite' | 'accuracy' | 'confidence' | 'feedback';
  minAccuracy?: number;
  maxAccuracy?: number;
  zeroAccuracyOnly?: boolean;
}

/**
 * HTTP API client for arc-explainer endpoints
 * All calls are made from browser to external server
 */
export class ArcExplainerAPI {
  private static instance: ArcExplainerAPI;
  private baseURL: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // TODO: Configure your arc-explainer server URL
    console.log('🔧 VITE_ARC_EXPLAINER_URL env var:', process.env.VITE_ARC_EXPLAINER_URL);
    console.log('🔧 All VITE env vars:', Object.keys(process.env).filter(k => k.startsWith('VITE_')));
    this.baseURL = process.env.VITE_ARC_EXPLAINER_URL || 'http://localhost:3001';
    console.log('🌐 ArcExplainerAPI baseURL set to:', this.baseURL);
  }

  public static getInstance(): ArcExplainerAPI {
    if (!ArcExplainerAPI.instance) {
      ArcExplainerAPI.instance = new ArcExplainerAPI();
    }
    return ArcExplainerAPI.instance;
  }

  /**
   * Get worst performing puzzles (hardest for AI)
   * Calls GET /api/puzzle/worst-performing endpoint
   */
  public async getWorstPerformingPuzzles(
    filters: APIFilters = {}
  ): Promise<AIPuzzlePerformance[]> {
    
    const queryParams = new URLSearchParams();
    
    if (filters.limit !== undefined) {
      queryParams.set('limit', filters.limit.toString());
    }
    if (filters.sortBy) {
      queryParams.set('sortBy', filters.sortBy);
    }
    if (filters.minAccuracy !== undefined) {
      queryParams.set('minAccuracy', (filters.minAccuracy / 100).toString());
    }
    if (filters.maxAccuracy !== undefined) {
      queryParams.set('maxAccuracy', (filters.maxAccuracy / 100).toString());
    }
    if (filters.zeroAccuracyOnly) {
      queryParams.set('zeroAccuracyOnly', 'true');
    }

    const url = `/api/puzzle/worst-performing?${queryParams.toString()}`;
    const cacheKey = url;

    // Check cache first
    if (this.isCached(cacheKey)) {
      return this.getFromCache(cacheKey);
    }

    try {
      const response = await this.makeRequest(url);
      const data: WorstPerformingPuzzlesResponse = await response.json();

      if (data.success && data.data?.puzzles) {
        this.setCache(cacheKey, data.data.puzzles);
        return data.data.puzzles;
      } else {
        console.warn('arc-explainer API returned unsuccessful response:', data);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch worst performing puzzles:', error);
      throw error;
    }
  }

  /**
   * Get performance data for a specific puzzle
   * Handles PlayFab puzzle ID format conversion (ARC-TR-007bbfb7 → 007bbfb7)
   */
  public async getPuzzlePerformance(puzzleId: string): Promise<AIPuzzlePerformance | null> {
    try {
      // Convert PlayFab puzzle ID format to ARC Explainer format
      const cleanPuzzleId = this.convertPlayFabIdToArcId(puzzleId);
      
      // First try to get from worst performing list (cached)
      const worstPuzzles = await this.getWorstPerformingPuzzles({ limit: 1000 });
      const found = worstPuzzles.find(p => p.puzzleId === cleanPuzzleId);
      
      if (found) {
        return found;
      }

      // If not found, could implement specific puzzle endpoint here
      // For now, return null as we focus on worst performing puzzles
      return null;
      
    } catch (error) {
      console.error(`Failed to get performance data for puzzle ${puzzleId}:`, error);
      return null;
    }
  }

  /**
   * Convert PlayFab puzzle ID format to ARC Explainer format
   * ARC-TR-007bbfb7 → 007bbfb7
   * ARC-EV-1ae2feb7 → 1ae2feb7
   */
  public convertPlayFabIdToArcId(playFabId: string): string {
    // Remove ARC-TR-, ARC-EV-, ARC-TR2-, ARC-EV2- prefixes
    return playFabId.replace(/^ARC-[A-Z0-9]+-/, '');
  }

  /**
   * Get performance data for multiple puzzles (batch operation)
   */
  public async getBatchPuzzlePerformance(puzzleIds: string[]): Promise<Map<string, AIPuzzlePerformance>> {
    try {
      const performanceMap = new Map<string, AIPuzzlePerformance>();
      
      // Get all worst performing puzzles (with larger limit for better coverage)
      const worstPuzzles = await this.getWorstPerformingPuzzles({ limit: 1000 });
      
      // Create lookup map for faster searching
      const arcPerformanceMap = new Map<string, AIPuzzlePerformance>();
      worstPuzzles.forEach(p => arcPerformanceMap.set(p.puzzleId, p));
      
      // Match PlayFab IDs to ARC performance data
      puzzleIds.forEach(playFabId => {
        const arcId = this.convertPlayFabIdToArcId(playFabId);
        const performance = arcPerformanceMap.get(arcId);
        if (performance) {
          performanceMap.set(playFabId, performance);
        }
      });
      
      console.log(`Found AI performance data for ${performanceMap.size}/${puzzleIds.length} puzzles`);
      return performanceMap;
      
    } catch (error) {
      console.error('Failed to get batch puzzle performance:', error);
      return new Map();
    }
  }

  /**
   * Get difficulty category based on accuracy score
   */
  public getDifficultyCategory(accuracy: number): 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' {
    if (accuracy === 0) return 'impossible';
    if (accuracy <= 0.25) return 'extremely_hard';
    if (accuracy <= 0.50) return 'very_hard';
    return 'challenging';
  }

  /**
   * Get difficulty statistics summary
   */
  public async getDifficultyStats(): Promise<{
    impossible: number;
    extremely_hard: number;
    very_hard: number;
    challenging: number;
    total: number;
  }> {
    try {
      // Get a large sample of worst performing puzzles
      const puzzles = await this.getWorstPerformingPuzzles({ limit: 1000 });
      
      const stats = {
        impossible: 0,
        extremely_hard: 0,
        very_hard: 0,
        challenging: 0,
        total: puzzles.length
      };

      puzzles.forEach(puzzle => {
        const category = this.getDifficultyCategory(puzzle.avgAccuracy);
        stats[category]++;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get difficulty stats:', error);
      return {
        impossible: 0,
        extremely_hard: 0,
        very_hard: 0,
        challenging: 0,
        total: 0
      };
    }
  }

  /**
   * Make HTTP request to arc-explainer server
   */
  private async makeRequest(endpoint: string): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 Making API request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add credentials if your arc-explainer server requires auth
        // credentials: 'include',
      });

      console.log(`📡 API response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ API Error ${response.status}: ${response.statusText}`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      return response;
    } catch (error) {
      console.error(`🚫 Network error calling ${url}:`, error);
      throw error;
    }
  }

  /**
   * Cache management
   */
  private isCached(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  private getFromCache<T>(key: string): T {
    return this.cache.get(key)!.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const arcExplainerAPI = ArcExplainerAPI.getInstance();