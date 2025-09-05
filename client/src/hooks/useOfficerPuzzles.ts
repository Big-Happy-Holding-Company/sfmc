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
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  filterByDifficulty: (difficulty: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' | null) => void;
  searchById: (id: string) => Promise<OfficerPuzzle | null>;
  refresh: () => Promise<void>;
  
  // Current filter state
  currentFilter: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading officer puzzles...');
      
      // Load puzzles and stats in parallel
      const [puzzleData, statsData] = await Promise.all([
        getOfficerPuzzles(),
        getDifficultyStats()
      ]);
      
      setPuzzles(puzzleData);
      setStats(statsData);
      setFilteredPuzzles(puzzleData); // Show all by default
      
      console.log(`✅ Loaded ${puzzleData.length} puzzles`);
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
  const refresh = async () => {
    await loadData();
    // Reapply current filter if any
    if (currentFilter) {
      filterByDifficulty(currentFilter as any);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  return {
    // Data
    puzzles,
    stats,
    filteredPuzzles,
    
    // State
    loading,
    error,
    
    // Actions
    filterByDifficulty,
    searchById,
    refresh,
    
    // Current filter
    currentFilter
  };
}