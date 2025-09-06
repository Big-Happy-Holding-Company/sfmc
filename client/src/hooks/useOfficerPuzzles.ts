/**
 * Smart hook for Officer Track puzzle data
 * 
 * Leverages arc-explainer API rich metadata for dynamic puzzle selection
 * Uses worst-performing algorithms with multiple sorting strategies
 */

import { useState, useEffect } from 'react';
import { 
  getOfficerPuzzles, 
  getDifficultyStats, 
  getPuzzlesByDifficulty,
  searchPuzzleById,
  type OfficerPuzzle, 
  type DifficultyStats 
} from '@/services/officerArcAPI';

export type SortStrategy = 'composite' | 'accuracy' | 'explanations' | 'difficulty' | 'recent';

export interface UseOfficerPuzzlesReturn {
  // Data
  puzzles: OfficerPuzzle[];
  stats: DifficultyStats;
  filteredPuzzles: OfficerPuzzle[];
  total: number; // Total puzzles in database
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  filterByDifficulty: (difficulty: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' | null) => void;
  searchById: (id: string) => Promise<OfficerPuzzle | null>;
  addSearchResult: (puzzle: OfficerPuzzle) => void;
  refresh: (limit?: number, sortBy?: SortStrategy) => Promise<void>;
  setLimit: (limit: number) => void;
  setSortStrategy: (strategy: SortStrategy) => void;
  
  // Current filter state
  currentFilter: string | null;
  currentLimit: number;
  currentSortStrategy: SortStrategy;
}

export function useOfficerPuzzles(
  initialLimit: number = 100, // Increased default - we have the API power, use it!
  initialSort: SortStrategy = 'composite'
): UseOfficerPuzzlesReturn {
  const [puzzles, setPuzzles] = useState<OfficerPuzzle[]>([]);
  const [stats, setStats] = useState<DifficultyStats>({
    impossible: 0,
    extremely_hard: 0,
    very_hard: 0,
    challenging: 0,
    total: 0
  });
  const [filteredPuzzles, setFilteredPuzzles] = useState<OfficerPuzzle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [currentLimit, setCurrentLimit] = useState(initialLimit);
  const [currentSortStrategy, setCurrentSortStrategy] = useState<SortStrategy>(initialSort);

  // Load data with smart arc-explainer API usage
  const loadData = async (limit: number = currentLimit, sortBy: SortStrategy = currentSortStrategy) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Loading officer puzzles (limit: ${limit}, sort: ${sortBy})...`);
      console.log(`🎯 Getting WORST-PERFORMING puzzles from arc-explainer with rich metadata`);
      
      // Load worst-performing puzzles with specified sorting strategy
      const puzzleResponse = await getOfficerPuzzlesWithStrategy(limit, sortBy);
      
      // Calculate stats from loaded puzzles
      const statsData: DifficultyStats = {
        impossible: 0,
        extremely_hard: 0,
        very_hard: 0,
        challenging: 0,
        total: puzzleResponse.total // Use real total from API
      };
      
      puzzleResponse.puzzles.forEach(puzzle => {
        statsData[puzzle.difficulty]++;
      });
      
      setPuzzles(puzzleResponse.puzzles);
      setTotal(puzzleResponse.total);
      setStats(statsData);
      setFilteredPuzzles(puzzleResponse.puzzles); // Show all by default
      
      console.log(`✅ Loaded ${puzzleResponse.puzzles.length} WORST-PERFORMING puzzles out of ${puzzleResponse.total} total`);
      console.log(`📊 Difficulty breakdown:`, statsData);
      console.log(`🔥 Worst puzzle accuracy: ${Math.min(...puzzleResponse.puzzles.map(p => p.avgAccuracy)).toFixed(3)}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load worst-performing puzzles';
      setError(errorMessage);
      console.error('❌ Failed to load officer puzzles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter puzzles by difficulty
  const filterByDifficulty = async (difficulty: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' | null) => {
    try {
      setCurrentFilter(difficulty);
      
      if (!difficulty) {
        // No filter - show all
        setFilteredPuzzles(puzzles);
        return;
      }
      
      // Filter to specific difficulty
      const filtered = puzzles.filter(p => p.difficulty === difficulty);
      setFilteredPuzzles(filtered);
      
      console.log(`🔧 Filtered to ${difficulty}: ${filtered.length} puzzles`);
      
    } catch (err) {
      console.error('❌ Filter error:', err);
    }
  };

  // Search for specific puzzle
  const searchById = async (id: string): Promise<OfficerPuzzle | null> => {
    try {
      return await searchPuzzleById(id);
    } catch (err) {
      console.error('❌ Search error:', err);
      return null;
    }
  };

  // Add search result to the displayed puzzles
  const addSearchResult = (puzzle: OfficerPuzzle) => {
    // Check if puzzle already exists in current filtered display
    const isAlreadyDisplayed = filteredPuzzles.some(p => p.id === puzzle.id);
    if (!isAlreadyDisplayed) {
      // Add to the beginning of the filtered list for prominence
      setFilteredPuzzles([puzzle, ...filteredPuzzles]);
      console.log(`🎯 Added search result "${puzzle.id}" to display grid`);
    } else {
      console.log(`🔄 Puzzle "${puzzle.id}" already in display grid`);
    }
  };

  // Enhanced refresh with strategy support
  const refresh = async (limit?: number, sortBy?: SortStrategy) => {
    const newLimit = limit || currentLimit;
    const newSort = sortBy || currentSortStrategy;
    
    console.log(`🔄 Refreshing with limit: ${newLimit}, sort: ${newSort}`);
    await loadData(newLimit, newSort);
    
    // Reapply current filter if any
    if (currentFilter) {
      filterByDifficulty(currentFilter as any);
    }
  };

  // Set new limit and reload data
  const setLimit = (limit: number) => {
    console.log(`📊 Changing limit from ${currentLimit} to ${limit}`);
    setCurrentLimit(limit);
    loadData(limit, currentSortStrategy);
  };

  // Set new sort strategy and reload data  
  const setSortStrategy = (strategy: SortStrategy) => {
    console.log(`🔄 Changing sort strategy from ${currentSortStrategy} to ${strategy}`);
    setCurrentSortStrategy(strategy);
    loadData(currentLimit, strategy);
  };

  // Load data on mount
  useEffect(() => {
    console.log(`🚀 Initializing Officer Track with ${initialLimit} puzzles, sorted by ${initialSort}`);
    loadData(currentLimit, currentSortStrategy);
  }, []);

  return {
    // Data
    puzzles,
    stats,
    filteredPuzzles,
    total,
    
    // State
    loading,
    error,
    
    // Actions
    filterByDifficulty,
    searchById,
    addSearchResult,
    refresh,
    setLimit,
    setSortStrategy,
    
    // Current state
    currentFilter,
    currentLimit,
    currentSortStrategy
  };
}

// Enhanced API call with multiple sorting strategies
async function getOfficerPuzzlesWithStrategy(limit: number, sortBy: SortStrategy): Promise<{ puzzles: OfficerPuzzle[]; total: number }> {
  // Map our sort strategies to arc-explainer API parameters
  const sortMap: Record<SortStrategy, string> = {
    'composite': 'composite',
    'accuracy': 'accuracy', 
    'explanations': 'explanations',
    'difficulty': 'difficulty',
    'recent': 'recent'
  };
  
  const apiSortBy = sortMap[sortBy] || 'composite';
  
  console.log(`🎯 Calling arc-explainer worst-performing API with sortBy=${apiSortBy}, limit=${limit}`);
  
  // Actually pass the sortBy parameter to leverage arc-explainer's rich metadata sorting
  return await getOfficerPuzzles(limit, apiSortBy);
}