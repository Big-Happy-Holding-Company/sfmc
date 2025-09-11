/**
 * Single Source of Truth for ARC Puzzle Datasets
 * 
 * This file defines all available ARC puzzle datasets, their properties,
 * and the number of batches for each. This eliminates hardcoding in both
 * the frontend (arcDataService.ts) and the backend (cloudscript.js).
 */

export type ARCDatasetType = 'training' | 'training2' | 'evaluation' | 'evaluation2';

export interface DatasetDefinition {
  id: ARCDatasetType;
  name: string;
  description: string;
  batchCount: number;
  puzzleCount: number;
}

export const DATASET_DEFINITIONS: Record<ARCDatasetType, DatasetDefinition> = {
  training: {
    id: 'training',
    name: 'ARC Training Set 1',
    description: 'The original 400 training puzzles from the ARC dataset.',
    batchCount: 4,
    puzzleCount: 400,
  },
  training2: {
    id: 'training2',
    name: 'ARC Training Set 2 (SFMC)',
    description: 'A supplemental set of 1000 training puzzles.',
    batchCount: 10,
    puzzleCount: 1000,
  },
  evaluation: {
    id: 'evaluation',
    name: 'ARC Evaluation Set 1',
    description: 'The original 400 evaluation puzzles from the ARC dataset.',
    batchCount: 4,
    puzzleCount: 400,
  },
  evaluation2: {
    id: 'evaluation2',
    name: 'ARC Evaluation Set 2 (SFMC)',
    description: 'A supplemental set of 120 evaluation puzzles.',
    batchCount: 2,
    puzzleCount: 120,
  },
};

/**
 * Generates the full list of PlayFab Title Data keys for all puzzle batches.
 * This can be used by the backend (CloudScript) to search all available puzzles.
 */
export function getAllBatchKeys(): string[] {
  const keys: string[] = [];
  for (const datasetId in DATASET_DEFINITIONS) {
    const dataset = DATASET_DEFINITIONS[datasetId as ARCDatasetType];
    for (let i = 1; i <= dataset.batchCount; i++) {
      keys.push(`officer-tasks-${dataset.id}-batch${i}.json`);
    }
  }
  return keys;
}
