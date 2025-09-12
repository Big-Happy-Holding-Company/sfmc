/**
 * React Hook for Dynamic Model Data
 * Fetches current AI models and difficulty categories from arc-explainer API
 * No hardcoded model names or assumptions - all data is dynamic
 */

import { useState, useEffect } from 'react';
import { arcExplainerAPI, type ModelInfo } from '@/services/arcExplainerAPI';

export interface DifficultyCategory {
  key: string;
  label: string;
  count: number;
  accuracyRange?: { min: number; max: number };
}

export interface ModelData {
  models: ModelInfo[];
  providers: string[];
  difficulties: DifficultyCategory[];
  performanceStats: Record<string, { solved: number; total: number; accuracy: number }>;
  isLoading: boolean;
  error: string | null;
}

export function useModelData(): ModelData {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<DifficultyCategory[]>([]);
  const [performanceStats, setPerformanceStats] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModelData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load all data in parallel
        const [modelsData, perfStats, difficultyStats] = await Promise.all([
          arcExplainerAPI.getAvailableModels(),
          arcExplainerAPI.getModelPerformanceBreakdown(),
          arcExplainerAPI.getPerformanceStats()
        ]);

        // Extract unique providers from models
        const uniqueProviders = [...new Set(modelsData.map(m => m.provider))];

        // Build difficulty categories from actual API data
        const difficultyCategories: DifficultyCategory[] = [
          {
            key: 'all',
            label: 'All Puzzles',
            count: difficultyStats.total
          },
          {
            key: 'has_ai_data',
            label: 'Has AI Data',
            count: difficultyStats.total
          },
          {
            key: 'no_ai_data', 
            label: 'No AI Data',
            count: 0 // Would need separate endpoint to get this
          }
        ];

        // Add difficulty categories based on actual data
        if (difficultyStats.impossible > 0) {
          difficultyCategories.push({
            key: 'impossible',
            label: `Impossible (${difficultyStats.impossible})`,
            count: difficultyStats.impossible,
            accuracyRange: { min: 0, max: 0 }
          });
        }

        if (difficultyStats.extremely_hard > 0) {
          difficultyCategories.push({
            key: 'extremely_hard',
            label: `Extremely Hard (${difficultyStats.extremely_hard})`,
            count: difficultyStats.extremely_hard,
            accuracyRange: { min: 0.01, max: 0.25 }
          });
        }

        if (difficultyStats.very_hard > 0) {
          difficultyCategories.push({
            key: 'very_hard',
            label: `Very Hard (${difficultyStats.very_hard})`,
            count: difficultyStats.very_hard,
            accuracyRange: { min: 0.25, max: 0.50 }
          });
        }

        if (difficultyStats.challenging > 0) {
          difficultyCategories.push({
            key: 'challenging', 
            label: `Challenging (${difficultyStats.challenging})`,
            count: difficultyStats.challenging,
            accuracyRange: { min: 0.50, max: 0.75 }
          });
        }

        setModels(modelsData);
        setProviders(uniqueProviders);
        setDifficulties(difficultyCategories);
        setPerformanceStats(perfStats);

      } catch (err) {
        console.error('Failed to load model data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load model data');
      } finally {
        setIsLoading(false);
      }
    };

    loadModelData();
  }, []);

  return {
    models,
    providers,
    difficulties,
    performanceStats,
    isLoading,
    error
  };
}