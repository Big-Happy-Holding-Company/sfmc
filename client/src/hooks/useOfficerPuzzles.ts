/**
 * Simple hook for Officer Track puzzle data
 * 
 * Manages loading, error states, and basic filtering
 * No overengineering - just what we need
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
  refresh: (limit?: number) => Promise<void>;
  setLimit: (limit: number) => void;
  
  // Current filter state
  currentFilter: string | null;
  currentLimit: number;
}

export function useOfficerPuzzles(): UseOfficerPuzzlesReturn {
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
  const [currentLimit, setCurrentLimit] = useState(50);

  // Load initial data
  const loadData = async (limit: number = currentLimit) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Loading officer puzzles (limit: ${limit})...`);
      
      // Load puzzles with limit
      const puzzleResponse = await getOfficerPuzzles(limit);
      
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
      
      console.log(`✅ Loaded ${puzzleResponse.puzzles.length} puzzles out of ${puzzleResponse.total} total analyzed`);
      console.log('📊 Stats:', statsData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load puzzles';
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

  // Refresh data
  const refresh = async (limit?: number) => {
    const newLimit = limit || currentLimit;
    await loadData(newLimit);
    // Reapply current filter if any
    if (currentFilter) {
      filterByDifficulty(currentFilter as any);
    }
  };

  // Set new limit and reload data
  const setLimit = (limit: number) => {
    setCurrentLimit(limit);
    loadData(limit);
  };

  // Load data on mount and when limit changes
  useEffect(() => {
    loadData(currentLimit);
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
    refresh,
    setLimit,
    
    // Current state
    currentFilter,
    currentLimit
  };
}