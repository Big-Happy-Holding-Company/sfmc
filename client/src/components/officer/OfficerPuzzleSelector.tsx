/**
 * Officer Puzzle Selector Component
 * =================================
 * Selector component for choosing ARC puzzles with military academy theming
 * 
 * Key Features:
 * - Real ARC dataset browsing (training, evaluation, etc.)
 * - Officer rank-based filtering and access
 * - Puzzle metadata display (difficulty, grid size, completion status)
 * - Military gold/amber theming
 * - Pagination for large datasets
 */

import { useState, useEffect } from 'react';
import { ChevronDown, Star, Lock, CheckCircle } from 'lucide-react';
import type { ARCPuzzleFile, OfficerRank, ARCDataset } from '@/types/arcTypes';
import { useARCData } from '@/services/arcDataService';

interface OfficerPuzzleSelectorProps {
  /** Currently selected puzzle file */
  selectedPuzzle?: ARCPuzzleFile;
  /** Callback when puzzle is selected */
  onPuzzleSelect: (puzzle: ARCPuzzleFile) => void;
  /** Player's current officer rank */
  playerRank: OfficerRank;
  /** Completed puzzle IDs for progress tracking */
  completedPuzzles: Set<string>;
  /** Available datasets to browse */
  availableDatasets?: ARCDataset[];
  /** Whether selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function OfficerPuzzleSelector({
  selectedPuzzle,
  onPuzzleSelect,
  playerRank,
  completedPuzzles,
  availableDatasets = ['training', 'evaluation'],
  disabled = false,
  className = ''
}: OfficerPuzzleSelectorProps) {
  const [currentDataset, setCurrentDataset] = useState<ARCDataset>(availableDatasets[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  
  const { 
    puzzleFiles, 
    isLoading, 
    error, 
    loadDataset 
  } = useARCData();

  const PUZZLES_PER_PAGE = 20;

  // Load current dataset
  useEffect(() => {
    loadDataset(currentDataset);
  }, [currentDataset, loadDataset]);

  // Filter puzzles based on search and completion status
  const filteredPuzzles = puzzleFiles.filter(puzzle => {
    const matchesSearch = !searchQuery || 
      puzzle.filename.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCompletion = showCompleted || 
      !completedPuzzles.has(`ARC-${currentDataset.toUpperCase()}-${puzzle.filename}`);
    
    return matchesSearch && matchesCompletion;
  });

  // Paginated puzzles
  const startIndex = (currentPage - 1) * PUZZLES_PER_PAGE;
  const paginatedPuzzles = filteredPuzzles.slice(startIndex, startIndex + PUZZLES_PER_PAGE);
  const totalPages = Math.ceil(filteredPuzzles.length / PUZZLES_PER_PAGE);

  // Get rank access level (higher ranks can access more content)
  const getRankAccessLevel = (rank: OfficerRank): number => {
    const levels: Record<OfficerRank, number> = {
      'LIEUTENANT': 1,
      'CAPTAIN': 2,
      'MAJOR': 3,
      'COLONEL': 4,
      'GENERAL': 5
    };
    return levels[rank] || 1;
  };

  // Check if puzzle is accessible based on rank
  const isPuzzleAccessible = (puzzle: ARCPuzzleFile): boolean => {
    const accessLevel = getRankAccessLevel(playerRank);
    // For now, all training puzzles are accessible
    // Could implement difficulty-based access later
    return currentDataset === 'training' || accessLevel >= 2;
  };

  // Get completion status for a puzzle
  const getPuzzleStatus = (puzzle: ARCPuzzleFile) => {
    const puzzleId = `ARC-${currentDataset.toUpperCase()}-${puzzle.filename}`;
    const isCompleted = completedPuzzles.has(puzzleId);
    const isAccessible = isPuzzleAccessible(puzzle);
    
    return { isCompleted, isAccessible };
  };

  if (isLoading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-amber-400 text-sm animate-pulse">
          Loading ARC puzzles from {currentDataset} dataset...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-red-400 text-sm">
          Error loading puzzles: {error}
        </div>
        <button
          onClick={() => loadDataset(currentDataset)}
          className="mt-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 border border-amber-400 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-amber-400 font-bold text-lg">
          🎖️ Mission Selection
        </h3>
        <div className="text-xs text-amber-300">
          Rank: {playerRank}
        </div>
      </div>

      {/* Dataset Selector */}
      <div className="mb-4">
        <label className="block text-xs text-amber-300 mb-2">Dataset:</label>
        <div className="relative">
          <select
            value={currentDataset}
            onChange={(e) => {
              setCurrentDataset(e.target.value as ARCDataset);
              setCurrentPage(1);
            }}
            disabled={disabled}
            className="w-full bg-slate-700 border border-amber-700 rounded px-3 py-2 text-white text-sm appearance-none cursor-pointer disabled:opacity-50"
          >
            {availableDatasets.map(dataset => (
              <option key={dataset} value={dataset}>
                {dataset.charAt(0).toUpperCase() + dataset.slice(1)} Dataset
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-amber-400 pointer-events-none" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Search by puzzle ID..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          disabled={disabled}
          className="w-full bg-slate-700 border border-amber-700 rounded px-3 py-2 text-white text-sm placeholder-slate-400 disabled:opacity-50"
        />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => {
                setShowCompleted(e.target.checked);
                setCurrentPage(1);
              }}
              disabled={disabled}
              className="accent-amber-500"
            />
            <span className="text-xs text-amber-300">Show completed</span>
          </label>
        </div>
      </div>

      {/* Puzzle Grid */}
      <div className="mb-4 max-h-96 overflow-y-auto">
        {paginatedPuzzles.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {filteredPuzzles.length === 0 ? 'No puzzles match your filters' : 'No puzzles on this page'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {paginatedPuzzles.map((puzzle) => {
              const { isCompleted, isAccessible } = getPuzzleStatus(puzzle);
              const isSelected = selectedPuzzle?.filename === puzzle.filename &&
                               selectedPuzzle?.dataset === currentDataset;

              return (
                <button
                  key={puzzle.filename}
                  onClick={() => !disabled && isAccessible && onPuzzleSelect({
                    ...puzzle,
                    dataset: currentDataset
                  })}
                  disabled={disabled || !isAccessible}
                  className={`
                    p-3 rounded border text-left transition-all duration-200
                    ${isSelected
                      ? 'bg-amber-900 border-amber-400 text-amber-100'
                      : 'bg-slate-700 border-amber-700 text-white hover:bg-slate-600 hover:border-amber-500'
                    }
                    ${!isAccessible 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer hover:scale-105 active:scale-95'
                    }
                    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono">
                      {puzzle.filename.replace('.json', '')}
                    </span>
                    <div className="flex items-center gap-1">
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      {!isAccessible && (
                        <Lock className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-amber-300">
                    Dataset: {currentDataset}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-amber-300">
            Page {currentPage} of {totalPages} • {filteredPuzzles.length} puzzles
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || disabled}
              className="px-3 py-1 bg-slate-700 border border-amber-700 rounded text-xs text-amber-400 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || disabled}
              className="px-3 py-1 bg-slate-700 border border-amber-700 rounded text-xs text-amber-400 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Selected Puzzle Info */}
      {selectedPuzzle && (
        <div className="mt-4 pt-4 border-t border-amber-700">
          <div className="text-xs text-amber-300">Selected Mission:</div>
          <div className="text-sm text-white font-mono">
            {selectedPuzzle.filename.replace('.json', '')}
          </div>
          <div className="text-xs text-slate-400">
            {selectedPuzzle.dataset} • Ready for deployment
          </div>
        </div>
      )}
    </div>
  );
}