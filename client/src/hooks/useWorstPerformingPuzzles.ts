/**
 * useWorstPerformingPuzzles Hook
 * 
 * React hook for fetching AI performance data from arc-explainer API
 * Based on arc-explainer's original hook but using HTTP client for static app
 */

import { useState, useEffect } from 'react';
import { arcExplainerAPI, type AIPuzzlePerformance, type APIFilters } from '@/services/arcExplainerAPI';

interface UseWorstPerformingPuzzlesResult {
  puzzles: AIPuzzlePerformance[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWorstPerformingPuzzles(
  limit: number = 20,
  sortBy: APIFilters['sortBy'] = 'composite',
  minAccuracy?: number,
  maxAccuracy?: number,
  zeroAccuracyOnly?: boolean
): UseWorstPerformingPuzzlesResult {
  
  const [puzzles, setPuzzles] = useState<AIPuzzlePerformance[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPuzzles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: APIFilters = {
        limit,
        sortBy,
        minAccuracy,
        maxAccuracy,
        zeroAccuracyOnly
      };

      const data = await arcExplainerAPI.getWorstPerformingPuzzles(filters);
      
      setPuzzles(data);
      setTotal(data.length);
      
      console.log('useWorstPerformingPuzzles: loaded', data.length, 'puzzles');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load AI performance data';
      setError(errorMessage);
      console.error('useWorstPerformingPuzzles error:', err);
      
      // Set empty data on error
      setPuzzles([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when parameters change
  useEffect(() => {
    fetchPuzzles();
  }, [limit, sortBy, minAccuracy, maxAccuracy, zeroAccuracyOnly]);

  return {
    puzzles,
    total,
    isLoading,
    error,
    refetch: fetchPuzzles
  };
}

/**
 * Hook for getting difficulty statistics from unified puzzle dataset
 * Uses consistent data source with Officer Track filtering
 */
export function useDifficultyStats(datasetOptions?: any) {
  const [stats, setStats] = useState({
    impossible: 0,
    extremely_hard: 0,
    very_hard: 0,
    challenging: 0,
    total: 0,
    withPerformanceData: 0,
    withoutPerformanceData: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Import here to avoid circular dependency
      const { puzzlePerformanceService } = await import('@/services/puzzlePerformanceService');
      
      // Use same dataset as Officer Track for consistency
      const mergedData = await puzzlePerformanceService.getMergedPuzzleDataset(
        datasetOptions || {
          datasets: ['training', 'evaluation'],
          difficulty: undefined, // Load all difficulties
          limit: undefined // Remove arbitrary limits
        }
      );
      
      const statsData = puzzlePerformanceService.getDifficultyStats(mergedData);
      setStats(statsData);
      
      console.log('📊 Difficulty stats from unified dataset:', statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load difficulty stats';
      setError(errorMessage);
      console.error('useDifficultyStats error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [JSON.stringify(datasetOptions)]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  };
}

/**
 * Hook for getting performance data for a specific puzzle
 */
export function usePuzzlePerformance(puzzleId: string | null) {
  const [performance, setPerformance] = useState<AIPuzzlePerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = async () => {
    if (!puzzleId) {
      setPerformance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await arcExplainerAPI.getPuzzlePerformance(puzzleId);
      setPerformance(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load puzzle performance';
      setError(errorMessage);
      console.error('usePuzzlePerformance error:', err);
      setPerformance(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [puzzleId]);

  return {
    performance,
    isLoading,
    error,
    refetch: fetchPerformance
  };
}