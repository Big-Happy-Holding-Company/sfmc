/**
 * Officer Track Page - ARC Puzzle Interface
 * ========================================================
 * Author: Claude 4 Code with major hallucinations and incompetence.  Sloppy code, imaginary endpoints
 * and broken logic.  Do not trust this code.
 * 
 * Purpose:
 * Advanced puzzle interface for ARC-AGI challenges with NASA military academy theming.
 * Completely separate from main game with dedicated officer ranking system.
 * 
 * Key Features:
 * - ARC puzzle loading and transformation from integer grids to emoji presentation
 * - Officer rank progression system (Lieutenant → General) HALLUCINATED!  Remove if found.
 * - Separate PlayFab leaderboards and achievements (Unknown if implemented, not required at this time)
 * - Gold/silver military academy visual theme (Poorly executed, needs a makeover and a NASA-inspired space theme that
 * isn't cheesy and looks somewhat scientific while still being fun)
 * - Advanced difficulty indicators and complex puzzle handling (Totally overengineered and needs 
 * to be simplified based on D:\1Projects\arc-explainer\client\src\pages\PuzzleDiscussion.tsx and what it is using
 * since we are using the same API!!)
 * 
 * Data Flow:   ///  Needs major overhaul.  We know where to get the puzzles, we know where to get the metadata, we know how to call PlayFab, it needs to be hooked up correctly.
 * - Loads ARC puzzles via arcDataService (1,920+ puzzles)  // Not sure if this is the best way???
 * - Matches puzzles to the PlayFab puzzle IDs (Not working?  Maybe working?)
 * - Manages officer player data via playFabOfficerTrack //  Not even sure if it does that??  Far too complex for this stage.
 * - Validates solutions via dedicated CloudScript function (Bare minimum, works!)
 * - No interaction with base game code at this time.
 */

import { useState, useEffect } from "react";
import { arcDataService } from "@/services/arcDataService";
import { playFabService } from "@/services/playfab";
import { arcExplainerAPI, type AIPuzzlePerformance } from "@/services/arcExplainerAPI";
// Removed puzzlePerformanceService - using direct arc-explainer API
import type { 
  OfficerTrackPuzzle, 
  OfficerTrackPlayer,
  ARCSolutionAttempt,
  ARCValidationResult,
  ARCPuzzleSearchResult,
  OfficerRank,
  ARCDisplayGrid
} from "@/types/arcTypes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SPACE_EMOJIS, EMOJI_SET_INFO, getARCColorCSS } from "@/constants/spaceEmojis";
import type { EmojiSet } from "@/constants/spaceEmojis";
import { OfficerDifficultyCards } from "@/components/game/OfficerDifficultyCards";
import { OfficerPuzzleSearch, type SearchFilters } from "@/components/game/OfficerPuzzleSearch";

// Officer Track specific styling constants
const OFFICER_COLORS = {
  primary: "text-amber-400",
  secondary: "text-yellow-300", 
  background: "bg-slate-900",
  cardBg: "bg-slate-800",
  border: "border-amber-400",
  accent: "bg-amber-500",
  hover: "hover:bg-amber-600"
};

export default function OfficerTrack() {
  // Core state management
  const [currentPuzzle, setCurrentPuzzle] = useState<OfficerTrackPuzzle | null>(null);
  const [officerPlayer, setOfficerPlayer] = useState<OfficerTrackPlayer | null>(null);
  const [filteredPuzzles, setFilteredPuzzles] = useState<AIPuzzlePerformance[]>([]);
  const [playerSolution, setPlayerSolution] = useState<number[][]>([]);
  const [validationResult, setValidationResult] = useState<ARCValidationResult | null>(null);
  
  // AI Performance Integration - direct from arc-explainer
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' | undefined>(undefined);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [selectedEmojiSet, setSelectedEmojiSet] = useState<EmojiSet>('tech_set1');
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [showNumbers, setShowNumbers] = useState(false);
  
  // Enhanced Grid UX state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{row: number, col: number} | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectedValue, setSelectedValue] = useState<number>(1); // For emoji palette selection
  const [showEmojiPalette, setShowEmojiPalette] = useState(false);

  // Handle global mouse events for drag selection
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleCellMouseUp();
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, selectedCells, showEmojiPalette, selectedValue, playerSolution]);

  // Initialize Officer Track data
  useEffect(() => {
    const initializeOfficerTrack = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🎖️  Initializing Officer Track...');
        
        // Initialize PlayFab completely
        await playFabService.initialize();
        
        // Login if not authenticated
        if (!playFabService.isAuthenticated()) {
          await playFabService.loginAnonymously();
        }
        
        console.log('✅ PlayFab initialized and authenticated');
        
        // Load officer player data
        const playerData = await playFabService.getOfficerPlayerData();
        setOfficerPlayer(playerData);
        console.log(`👮 Officer loaded: ${playerData.officerRank} with ${playerData.officerPoints} points`);
        
        // Load initial filtered puzzles from arc-explainer API
        await loadFilteredPuzzles();
        
        console.log('✅ Officer Track initialization complete');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load officer player data';
        setError(errorMessage);
        console.error('❌ Officer Track initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeOfficerTrack();
  }, []);

  /**
   * Get difficulties accessible to current officer rank
   */
  const getAccessibleDifficulties = (rank: OfficerRank): string[] => {
    const difficulties = ['LIEUTENANT'];
    if (rank === 'Captain' || rank === 'Major' || rank === 'Colonel' || rank === 'General') {
      difficulties.push('CAPTAIN');
    }
    if (rank === 'Major' || rank === 'Colonel' || rank === 'General') {
      difficulties.push('MAJOR');
    }
    if (rank === 'Colonel' || rank === 'General') {
      difficulties.push('COLONEL');
    }
    return difficulties;
  };

  /**
   * Get AI performance for a specific puzzle from filtered data
   */
  const getAIPerformance = (puzzleId: string): AIPuzzlePerformance | null => {
    const puzzle = filteredPuzzles.find((p: AIPuzzlePerformance) => p.id === puzzleId);
    return puzzle || null;
  };

  /**
   * Load filtered puzzles from arc-explainer API
   */
  const loadFilteredPuzzles = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading puzzles from arc-explainer API...', { selectedDifficultyFilter });
      
      let puzzles: AIPuzzlePerformance[];
      
      if (!selectedDifficultyFilter) {
        // No filter - get default worst performing puzzles
        puzzles = await arcExplainerAPI.getWorstPerformingPuzzles({ limit: 50 });
      } else {
        // Use direct arc-explainer filtering
        puzzles = await arcExplainerAPI.getFilteredPuzzles({
          difficulty: selectedDifficultyFilter,
          limit: 50
        });
      }
      
      setFilteredPuzzles(puzzles);
      console.log(`✅ Loaded ${puzzles.length} puzzles from arc-explainer`);
    } catch (error) {
      console.error('❌ Failed to load filtered puzzles:', error);
      setError(error instanceof Error ? error.message : 'Failed to load puzzles');
      setFilteredPuzzles([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle AI difficulty category selection and reload puzzles
   */
  const handleDifficultyFilterSelect = (category: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging') => {
    const newFilter = category === selectedDifficultyFilter ? undefined : category;
    setSelectedDifficultyFilter(newFilter);
  };

  // Reload puzzles when difficulty filter changes
  useEffect(() => {
    if (officerPlayer) {
      loadFilteredPuzzles();
    }
  }, [selectedDifficultyFilter]);

  /**
   * Enhanced Grid UX Utilities
   */
  
  // Get cell key for tracking selections
  const getCellKey = (row: number, col: number) => `${row}-${col}`;
  
  // Copy input grid to solution grid
  const copyInputToSolution = () => {
    if (!currentPuzzle) return;
    const testCase = currentPuzzle.test[selectedTestCase];
    if (!testCase) return;
    
    const copiedGrid = testCase.input.map(row => [...row]);
    setPlayerSolution(copiedGrid);
  };
  
  // Handle mouse down for drag selection
  const handleCellMouseDown = (row: number, col: number, event: React.MouseEvent) => {
    if (event.button === 2) {
      // Right click - clear cell
      event.preventDefault();
      const newGrid = [...playerSolution];
      newGrid[row][col] = 0;
      setPlayerSolution(newGrid);
      return;
    }
    
    if (event.button === 0) {
      // Left click - start drag selection or set value
      setIsDragging(true);
      setDragStartCell({row, col});
      
      if (showEmojiPalette) {
        // Use selected value from palette
        const newGrid = [...playerSolution];
        newGrid[row][col] = selectedValue;
        setPlayerSolution(newGrid);
      } else {
        // Cycle through values (original behavior)
        const newGrid = [...playerSolution];
        newGrid[row][col] = (playerSolution[row][col] + 1) % 10;
        setPlayerSolution(newGrid);
      }
      
      // Update selected cells
      const cellKey = getCellKey(row, col);
      setSelectedCells(new Set([cellKey]));
    }
  };
  
  // Handle mouse enter during drag
  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isDragging || !dragStartCell) return;
    
    // Calculate rectangular selection from drag start to current cell
    const minRow = Math.min(dragStartCell.row, row);
    const maxRow = Math.max(dragStartCell.row, row);
    const minCol = Math.min(dragStartCell.col, col);
    const maxCol = Math.max(dragStartCell.col, col);
    
    const newSelectedCells = new Set<string>();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        newSelectedCells.add(getCellKey(r, c));
      }
    }
    setSelectedCells(newSelectedCells);
  };
  
  // Handle mouse up - apply value to selected cells
  const handleCellMouseUp = () => {
    if (!isDragging || selectedCells.size === 0) {
      setIsDragging(false);
      setDragStartCell(null);
      setSelectedCells(new Set());
      return;
    }
    
    // Apply selected value to all selected cells
    const newGrid = [...playerSolution];
    selectedCells.forEach(cellKey => {
      const [rowStr, colStr] = cellKey.split('-');
      const row = parseInt(rowStr);
      const col = parseInt(colStr);
      if (showEmojiPalette) {
        newGrid[row][col] = selectedValue;
      }
    });
    
    if (showEmojiPalette && selectedCells.size > 1) {
      setPlayerSolution(newGrid);
    }
    
    setIsDragging(false);
    setDragStartCell(null);
    setSelectedCells(new Set());
  };
  
  // Get unique values used in current puzzle for emoji palette
  const getUsedValues = (): number[] => {
    if (!currentPuzzle) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    const allGrids = [
      ...currentPuzzle.train.flatMap(ex => [ex.input, ex.output]),
      ...currentPuzzle.test.map(t => t.input)
    ];
    
    const usedValues = new Set<number>();
    allGrids.forEach(grid => {
      grid.forEach(row => {
        row.forEach(cell => usedValues.add(cell));
      });
    });
    
    return Array.from(usedValues).sort((a, b) => a - b);
  };

  /**
   * Handle puzzle selection
   */
  const handleSelectPuzzle = (puzzle: OfficerTrackPuzzle) => {
    console.log(`🎯 Selected puzzle: ${puzzle.id} (${puzzle.difficulty})`);
    
    setCurrentPuzzle(puzzle);
    setStartTime(Date.now());
    setValidationResult(null);
    setShowResult(false);
    
    // Reset enhanced UX state
    setIsDragging(false);
    setDragStartCell(null);
    setSelectedCells(new Set());
    setShowEmojiPalette(false);
    setSelectedValue(1);
    setSelectedTestCase(0);
    
    // Initialize empty solution grid based on test case
    const testCase = puzzle.test[0];
    if (testCase) {
      const emptyGrid = testCase.input.map(row => 
        row.map(() => 0) // Initialize with 0 (black/empty)
      );
      setPlayerSolution(emptyGrid);
    }
  };

  /**
   * Handle search for specific puzzle by ID
   */
  const handlePuzzleSearch = async (puzzleId: string) => {
    if (!puzzleId.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Searching for puzzle: ${puzzleId}`);
      
      // First try to find in current filtered dataset
      const foundInFiltered = filteredPuzzles.find(p => 
        p.id === puzzleId || p.id.includes(puzzleId)
      );
      
      if (foundInFiltered) {
        console.log(`✅ Found puzzle in filtered dataset: ${foundInFiltered.id}`);
        // Convert AIPuzzlePerformance to OfficerTrackPuzzle for selection
        const puzzleData = await arcDataService.searchPuzzleById(foundInFiltered.id);
        if (puzzleData) {
          handleSelectPuzzle(puzzleData);
          return;
        }
      }
      
      // Try direct API lookup from arc-explainer
      const directLookup = await arcExplainerAPI.getPuzzleById(puzzleId);
      if (directLookup) {
        console.log(`✅ Found puzzle via arc-explainer API: ${puzzleId}`);
        // Get full puzzle data from arcDataService
        const puzzleData = await arcDataService.searchPuzzleById(puzzleId);
        if (puzzleData) {
          handleSelectPuzzle(puzzleData);
          return;
        }
      }
      
      // Fallback to direct arcDataService search
      const puzzle = await arcDataService.searchPuzzleById(puzzleId);
      
      if (puzzle) {
        console.log(`✅ Found puzzle via direct search: ${puzzle.id}`);
        handleSelectPuzzle(puzzle);
      } else {
        setError(`Puzzle "${puzzleId}" not found in any dataset. Try a different ID.`);
        console.warn(`❌ Puzzle not found: ${puzzleId}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search for puzzle';
      setError(errorMessage);
      console.error('❌ Puzzle search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle random puzzle selection with optional difficulty filter
   */
  const handleRandomPuzzle = async (difficulty?: string) => {
    try {
      console.log(`🎲 Selecting random puzzle with difficulty: ${difficulty || 'any'}`);
      
      // Use filtered puzzles from arc-explainer API
      let candidatePuzzles = filteredPuzzles;
      
      if (difficulty && difficulty !== 'all') {
        // Filter current puzzles by requested difficulty
        const difficultyMap: Record<string, 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging'> = {
          'impossible': 'impossible',
          'extremely_hard': 'extremely_hard', 
          'very_hard': 'very_hard',
          'challenging': 'challenging'
        };
        
        const targetDifficulty = difficultyMap[difficulty];
        if (targetDifficulty) {
          candidatePuzzles = filteredPuzzles.filter(p => 
            arcExplainerAPI.getDifficultyCategory(p.avgAccuracy) === targetDifficulty
          );
        }
        
        if (candidatePuzzles.length === 0) {
          setError(`No puzzles found with difficulty "${difficulty}". Try a different filter.`);
          return;
        }
      }
      
      // Select random puzzle from candidates
      const randomIndex = Math.floor(Math.random() * candidatePuzzles.length);
      const randomAIPuzzle = candidatePuzzles[randomIndex];
      
      console.log(`✅ Selected random AI puzzle: ${randomAIPuzzle.id} (${candidatePuzzles.length} candidates)`);
      
      // Get full puzzle data from arcDataService
      const puzzleData = await arcDataService.searchPuzzleById(randomAIPuzzle.id);
      if (puzzleData) {
        handleSelectPuzzle(puzzleData);
      } else {
        setError('Failed to load selected puzzle data');
      }
      
    } catch (err) {
      console.error('❌ Random puzzle selection failed:', err);
      setError('Failed to select random puzzle');
    }
  };

  /**
   * Handle search filter changes from OfficerPuzzleSearch
   */
  const handleSearchFilterChange = async (filters: SearchFilters) => {
    console.log(`🔧 Search filters changed:`, filters);
    
    // Handle zero accuracy filter (takes priority)
    if (filters.zeroAccuracyOnly) {
      setSelectedDifficultyFilter('impossible');
      console.log('🚫 Applied zero accuracy filter - showing impossible puzzles only');
      return;
    }
    
    // Update the AI difficulty filter to match search filters
    if (filters.difficulty && filters.difficulty !== 'all') {
      setSelectedDifficultyFilter(filters.difficulty);
    } else {
      setSelectedDifficultyFilter(undefined);
    }
  };

  /**
   * Handle solution submission
   */
  const handleSubmitSolution = async () => {
    if (!currentPuzzle || !officerPlayer || !startTime) return;
    
    setValidating(true);
    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      const attempt: ARCSolutionAttempt = {
        puzzleId: currentPuzzle.id,
        solution: playerSolution,
        timeElapsed,
        hintsUsed: 0,
        sessionId: `officer-${Date.now()}`,
        attemptNumber: 1
      };
      
      console.log('🔍 Validating ARC solution...', attempt);
      const result = await playFabService.validateARCSolution(attempt);
      
      setValidationResult(result);
      setShowResult(true);
      
      // Update officer player data if solution was correct
      if (result.correct) {
        const updatedPlayer = await playFabService.getOfficerPlayerData();
        setOfficerPlayer(updatedPlayer);
        
        // Award achievements if applicable
        if (officerPlayer.completedPuzzles.length === 0) {
          await playFabService.awardOfficerAchievement('first_puzzle_solve');
        }
        if (result.rankUp) {
          await playFabService.awardOfficerAchievement('rank_promotion');
        }
      }
      
      console.log('✅ Solution validation complete:', result);
    } catch (err) {
      console.error('❌ Solution validation failed:', err);
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  /**
   * Transform integer grid to emoji display or numbers
   */
  const transformGridForDisplay = (grid: number[][]): ARCDisplayGrid => {
    if (showNumbers) {
      return grid.map(row => row.map(cell => cell.toString()));
    }
    return arcDataService.transformIntegersToEmojis(grid, selectedEmojiSet);
  };

  /**
   * Strip ARC prefix from puzzle ID for clean display
   */
  const getCleanPuzzleId = (id: string): string => {
    return id.replace(/^ARC-[A-Z0-9]+-/, '');
  };

  /**
   * Get dataset badge info from puzzle ID
   */
  const getDatasetBadge = (puzzle: OfficerTrackPuzzle) => {
    const dataset = puzzle.dataset;
    const badgeMap = {
      'training': { label: 'Training', className: 'bg-blue-600' },
      'training2': { label: 'Training 2', className: 'bg-blue-700' },
      'evaluation': { label: 'Evaluation', className: 'bg-green-600' },
      'evaluation2': { label: 'Evaluation 2', className: 'bg-green-700' }
    };
    
    return badgeMap[dataset] || { label: dataset.toUpperCase(), className: 'bg-gray-600' };
  };

  /**
   * Calculate optimal grid layout for training examples
   */
  const calculateExampleLayout = (exampleCount: number, maxGridWidth: number) => {
    // Determine columns based on example count and grid size
    if (exampleCount <= 2) return 'grid-cols-1 lg:grid-cols-2';
    if (exampleCount <= 4) return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4';
    if (exampleCount <= 6) return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
    // For 7-9 examples, use flexible layout
    return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
  };

  /**
   * Handle test case selection for puzzles with multiple test cases
   */
  const handleTestCaseChange = (testIndex: number) => {
    setSelectedTestCase(testIndex);
    
    // Reset solution grid to match new test case dimensions
    if (currentPuzzle && currentPuzzle.test[testIndex]) {
      const testCase = currentPuzzle.test[testIndex];
      const emptyGrid = testCase.input.map(row => row.map(() => 0));
      setPlayerSolution(emptyGrid);
    }
  };

  /**
   * Calculate optimal cell size based on grid dimensions
   */
  const calculateCellSize = (grid: number[][]) => {
    const height = grid.length;
    const width = grid[0]?.length || 0;
    const maxDimension = Math.max(height, width);
    
    // Dynamic sizing based on grid dimensions
    if (maxDimension <= 3) return { size: 'w-12 h-12', textSize: 'text-lg' };
    if (maxDimension <= 5) return { size: 'w-10 h-10', textSize: 'text-base' };
    if (maxDimension <= 8) return { size: 'w-8 h-8', textSize: 'text-sm' };
    if (maxDimension <= 12) return { size: 'w-6 h-6', textSize: 'text-xs' };
    return { size: 'w-4 h-4', textSize: 'text-xs' }; // Very large grids
  };

  /**
   * Render a grid for display (input/output examples)
   */
  const renderDisplayGrid = (grid: number[][], title: string): JSX.Element => {
    const emojiGrid = transformGridForDisplay(grid);
    const { size, textSize } = calculateCellSize(grid);
    
    return (
      <div className="text-center">
        <div className="text-xs text-amber-300 mb-2 font-semibold">{title}</div>
        <div 
          className="grid gap-1 bg-slate-800 p-2 rounded border border-amber-600"
          style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 1}, 1fr)` }}
        >
          {emojiGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const originalValue = grid[rowIndex][colIndex];
              const cellStyle = showNumbers ? {
                backgroundColor: getARCColorCSS(originalValue),
                color: originalValue === 4 ? '#000000' : '#ffffff' // Black text for yellow (4), white for others
              } : {};
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${size} flex items-center justify-center rounded ${textSize} border ${
                    showNumbers ? 'border-gray-400' : 'bg-slate-700 border-amber-800'
                  }`}
                  style={cellStyle}
                >
                  {cell}
                </div>
              );
            })
          )}
        </div>
        <div className="text-xs text-amber-600 mt-1">
          {grid.length}×{grid[0]?.length || 0}
        </div>
      </div>
    );
  };

  /**
   * Render interactive solution grid with enhanced UX
   */
  const renderSolutionGrid = (): JSX.Element => {
    if (!currentPuzzle) return <div></div>;
    
    const testCase = currentPuzzle.test[selectedTestCase];
    if (!testCase) return <div></div>;
    
    const { size, textSize } = calculateCellSize(playerSolution);
    const solutionDisplay = transformGridForDisplay(playerSolution);
    
    return (
      <div className="text-center">
        <div className="text-xs text-amber-300 mb-2 font-semibold">YOUR SOLUTION</div>
        <div 
          className="grid gap-1 bg-slate-800 p-2 rounded border-2 border-amber-400 select-none"
          style={{ gridTemplateColumns: `repeat(${playerSolution[0]?.length || 1}, 1fr)` }}
        >
          {solutionDisplay.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const cellKey = getCellKey(rowIndex, colIndex);
              const isSelected = selectedCells.has(cellKey);
              const originalValue = playerSolution[rowIndex][colIndex];
              
              // Calculate styles based on display mode and selection state
              let cellStyle = {};
              let className = `${size} flex items-center justify-center rounded ${textSize} border transition-colors`;
              
              if (showNumbers && !isSelected) {
                // Apply ARC colors in numeric mode when not selected
                cellStyle = {
                  backgroundColor: getARCColorCSS(originalValue),
                  color: originalValue === 4 ? '#000000' : '#ffffff' // Black text for yellow (4), white for others
                };
                className += ' border-gray-400 hover:scale-105 active:scale-95';
              } else if (isSelected) {
                // Selected state overrides color styling
                className += ' bg-amber-600 border-amber-400 text-slate-900';
              } else {
                // Default emoji mode styling
                className += ' bg-slate-700 hover:bg-slate-600 border-amber-700 hover:scale-105 active:scale-95';
              }
              
              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={className}
                  style={cellStyle}
                  onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                  onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={validating}
                  title={`Cell (${rowIndex}, ${colIndex}): ${playerSolution[rowIndex][colIndex]} | Left: ${showEmojiPalette ? 'set selected value' : 'cycle'} | Right: clear | Drag: select area`}
                >
                  {cell}
                </button>
              );
            })
          )}
        </div>
        <div className="text-xs text-amber-600 mt-2 space-y-1">
          <div>
            {showEmojiPalette 
              ? `Click: set selected value (${selectedValue}) | Drag: select area | Right-click: clear`
              : 'Click: cycle values (0-9) | Drag: select area | Right-click: clear'
            }
          </div>
          <div>{playerSolution.length}×{playerSolution[0]?.length || 0}</div>
        </div>
      </div>
    );
  };

  /**
   * Render officer rank badge with progression
   */
  const renderOfficerRank = (): JSX.Element => {
    if (!officerPlayer) return <div></div>;
    
    const rankColors = {
      Lieutenant: "bg-green-600",
      Captain: "bg-blue-600", 
      Major: "bg-purple-600",
      Colonel: "bg-red-600",
      General: "bg-yellow-600"
    };
    
    return (
      <div className="flex items-center space-x-3">
        <Badge className={`${rankColors[officerPlayer.officerRank]} text-white px-3 py-1`}>
          ⭐ {officerPlayer.officerRank}
        </Badge>
        <div className="text-sm text-amber-300">
          {officerPlayer.officerPoints} pts
        </div>
        <div className="text-xs text-slate-400">
          ({officerPlayer.pointsToNextRank - officerPlayer.officerPoints} to next rank)
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-6"></div>
          <div className="text-amber-400 text-xl font-bold mb-2">🎖️ OFFICER ACADEMY</div>
          <div className="text-amber-300">Initializing Advanced Training Systems...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <div className="text-red-400 font-bold mb-2">Officer Academy Access Denied</div>
          <div className="text-slate-300 mb-4">{error}</div>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700"
          >
            Retry Access
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50">
      {/* Military Academy Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(251,191,36,0.15) 1px, transparent 0)",
            backgroundSize: "24px 24px"
          }}
        />
      </div>

      {/* Header */}
      <header className="bg-slate-800 border-b-2 border-amber-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-amber-400">
                🎖️ OFFICER ACADEMY
              </h1>
              <Badge className="bg-amber-600 text-slate-900 font-bold">
                ARC-AGI ADVANCED TRAINING
              </Badge>
            </div>
            
            <div className="flex items-center space-x-6">
              {officerPlayer && renderOfficerRank()}
              <Button 
                variant="outline" 
                className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
                onClick={() => window.history.back()}
              >
                ← Return to Base
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentPuzzle ? (
          /* Puzzle Selection Interface */
          <div className="space-y-6">
            {/* AI Difficulty Filter Cards */}
            <OfficerDifficultyCards 
              onCategorySelect={handleDifficultyFilterSelect}
              selectedCategory={selectedDifficultyFilter}
            />

            {/* Puzzle Search Component */}
            <OfficerPuzzleSearch
              onSearch={handlePuzzleSearch}
              onRandomPuzzle={handleRandomPuzzle}
              onFilterChange={handleSearchFilterChange}
              isLoading={loading}
            />
            
            <Card className="bg-slate-800 border-amber-400">
              <CardHeader>
                <CardTitle className="text-amber-400 flex items-center">
                  🧩 Advanced Reasoning Challenges
                  <Badge className="ml-3 bg-amber-600 text-slate-900">
                    {filteredPuzzles.length} Available
                  </Badge>
                  {selectedDifficultyFilter && (
                    <Badge className="ml-2 bg-blue-600 text-white">
                      Filtered: {selectedDifficultyFilter.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-100 mb-4">
                  Welcome to the Officer Academy, {officerPlayer?.officerRank}. These Advanced Reasoning Corpus (ARC) 
                  puzzles will test your pattern recognition and abstract thinking abilities. Each puzzle requires 
                  understanding complex transformations that go far beyond standard operations.
                </p>
                
                {selectedDifficultyFilter && (
                  <div className="bg-slate-900 border border-blue-600 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-blue-400 text-sm font-medium mb-1">
                          🤖 AI Difficulty Filter Active
                        </div>
                        <div className="text-blue-300 text-xs">
                          Showing only puzzles categorized as "{selectedDifficultyFilter.replace('_', ' ')}" based on AI performance data.
                          {filteredPuzzles.length === 0 && " No puzzles match this criteria in the current set."}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDifficultyFilter(undefined)}
                        className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                      >
                        Clear Filter
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPuzzles.map((aiPuzzle) => {
                    const difficultyCategory = arcExplainerAPI.getDifficultyCategory(aiPuzzle.avgAccuracy);
                    return (
                    <Card 
                      key={aiPuzzle.id}
                      className="bg-slate-700 border-amber-600 hover:border-amber-400 cursor-pointer transition-colors"
                      onClick={async () => {
                        // Load full puzzle data from arcDataService when selected
                        const puzzleData = await arcDataService.searchPuzzleById(aiPuzzle.id);
                        if (puzzleData) {
                          handleSelectPuzzle(puzzleData);
                        } else {
                          setError(`Failed to load puzzle data for ${aiPuzzle.id}`);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-amber-600 text-slate-900">
                            ARC PUZZLE
                          </Badge>
                          <div className="text-xs text-amber-400">
                            ANALYSIS DATA
                          </div>
                        </div>
                        
                        {/* AI Performance Badge */}
                        <div className="mb-2">
                          <Badge className={`
                            text-xs
                            ${aiPuzzle.avgAccuracy === 0 ? 'bg-red-600 text-white' : ''}
                            ${aiPuzzle.avgAccuracy <= 0.25 && aiPuzzle.avgAccuracy > 0 ? 'bg-orange-600 text-white' : ''}
                            ${aiPuzzle.avgAccuracy <= 0.50 && aiPuzzle.avgAccuracy > 0.25 ? 'bg-yellow-600 text-black' : ''}
                            ${aiPuzzle.avgAccuracy > 0.50 ? 'bg-blue-600 text-white' : ''}
                          `}>
                            🤖 AI: {(aiPuzzle.avgAccuracy * 100).toFixed(0)}% accuracy
                            {aiPuzzle.avgAccuracy === 0 && ' (IMPOSSIBLE)'}
                          </Badge>
                        </div>
                        
                        {/* Difficulty Category Badge */}
                        <div className="mb-2">
                          <Badge className={`
                            text-xs
                            ${difficultyCategory === 'impossible' ? 'bg-red-700 text-red-200' : ''}
                            ${difficultyCategory === 'extremely_hard' ? 'bg-orange-700 text-orange-200' : ''}
                            ${difficultyCategory === 'very_hard' ? 'bg-yellow-700 text-yellow-200' : ''}
                            ${difficultyCategory === 'challenging' ? 'bg-blue-700 text-blue-200' : ''}
                          `}>
                            {difficultyCategory.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="text-sm font-semibold text-amber-200 mb-1">
                          {getCleanPuzzleId(aiPuzzle.id)}
                        </div>
                        
                        <div className="text-xs text-slate-300 space-y-1">
                          <div className="text-blue-300">
                            Explanations: {aiPuzzle.totalExplanations} • Score: {aiPuzzle.compositeScore?.toFixed(1) || 'N/A'}
                          </div>
                          <div className="text-amber-300">
                            Click to load full puzzle data and solve
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Active Puzzle Interface */
          <div className="space-y-6">
            <Card className="bg-slate-800 border-amber-400">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-amber-400 flex items-center space-x-3">
                      <span>🎯 MISSION: {getCleanPuzzleId(currentPuzzle.id)}</span>
                      <Badge className={getDatasetBadge(currentPuzzle).className}>
                        {getDatasetBadge(currentPuzzle).label}
                      </Badge>
                      <Badge className={`
                        ${currentPuzzle.difficulty === 'LIEUTENANT' ? 'bg-green-600' : ''}
                        ${currentPuzzle.difficulty === 'CAPTAIN' ? 'bg-blue-600' : ''}
                        ${currentPuzzle.difficulty === 'MAJOR' ? 'bg-purple-600' : ''}
                        ${currentPuzzle.difficulty === 'COLONEL' ? 'bg-red-600' : ''}
                      `}>
                        {currentPuzzle.difficulty} LEVEL
                      </Badge>
                    </CardTitle>
                    <div className="text-amber-300 text-sm mt-1">
                      Dataset: {currentPuzzle.dataset.toUpperCase()} • 
                      Complexity: {currentPuzzle.complexity.transformationComplexity} • 
                      Colors: {currentPuzzle.complexity.uniqueColors}
                      {getAIPerformance(currentPuzzle.id) && (
                        <>
                          {" • "}
                          <span className="text-blue-300">
                            🤖 AI Accuracy: {(getAIPerformance(currentPuzzle.id)!.avgAccuracy * 100).toFixed(0)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentPuzzle(null)}
                    className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-slate-900"
                  >
                    ← Select Different Mission
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* AI Performance Context */}
                {getAIPerformance(currentPuzzle.id) && (
                  <div className="bg-slate-900 border border-blue-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-blue-400 font-semibold flex items-center">
                        🤖 AI PERFORMANCE ANALYSIS
                      </h4>
                      <Badge className={`
                        ${getAIPerformance(currentPuzzle.id)!.avgAccuracy === 0 ? 'bg-red-600 text-white' : ''}
                        ${getAIPerformance(currentPuzzle.id)!.avgAccuracy <= 0.25 && getAIPerformance(currentPuzzle.id)!.avgAccuracy > 0 ? 'bg-orange-600 text-white' : ''}
                        ${getAIPerformance(currentPuzzle.id)!.avgAccuracy <= 0.50 && getAIPerformance(currentPuzzle.id)!.avgAccuracy > 0.25 ? 'bg-yellow-600 text-black' : ''}
                        ${getAIPerformance(currentPuzzle.id)!.avgAccuracy > 0.50 ? 'bg-blue-600 text-white' : ''}
                      `}>
                        {arcExplainerAPI.getDifficultyCategory(getAIPerformance(currentPuzzle.id)!.avgAccuracy).replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-blue-300 font-medium">Accuracy Rate</div>
                        <div className="text-2xl font-bold text-blue-100">
                          {(getAIPerformance(currentPuzzle.id)!.avgAccuracy * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-300 font-medium">Explanations</div>
                        <div className="text-2xl font-bold text-blue-100">
                          {getAIPerformance(currentPuzzle.id)!.totalExplanations}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-300 font-medium">Composite Score</div>
                        <div className="text-2xl font-bold text-blue-100">
                          {getAIPerformance(currentPuzzle.id)!.compositeScore.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    
                    {getAIPerformance(currentPuzzle.id)!.avgAccuracy === 0 && (
                      <div className="mt-3 text-center">
                        <div className="text-red-300 text-sm font-medium">
                          ⚠️ This puzzle has NEVER been solved correctly by AI systems
                        </div>
                        <div className="text-red-400 text-xs mt-1">
                          You're attempting a challenge that represents the frontier of human reasoning
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Emoji Set and Display Controls */}
                <div className="bg-slate-900 border border-amber-800 rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="emojiSet" className="text-amber-300 text-sm font-medium">
                        🎨 Display Style:
                      </Label>
                      <Select 
                        value={selectedEmojiSet} 
                        onValueChange={(value) => setSelectedEmojiSet(value as EmojiSet)}
                      >
                        <SelectTrigger id="emojiSet" className="w-48 bg-slate-700 border-amber-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EMOJI_SET_INFO).map(([key, info]) => (
                            <SelectItem key={key} value={key}>
                              {info.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        variant={showNumbers ? "outline" : "default"}
                        size="sm"
                        onClick={() => setShowNumbers(false)}
                        className={showNumbers ? "border-amber-600 text-amber-400" : "bg-amber-600 text-slate-900"}
                      >
                        🎭 Emojis
                      </Button>
                      <Button
                        variant={showNumbers ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowNumbers(true)}
                        className={showNumbers ? "bg-amber-600 text-slate-900" : "border-amber-600 text-amber-400"}
                      >
                        🔢 Numbers
                      </Button>
                    </div>
                    
                    {!showNumbers && (
                      <div className="text-xs text-amber-500">
                        <strong>{EMOJI_SET_INFO[selectedEmojiSet].name}:</strong> {EMOJI_SET_INFO[selectedEmojiSet].description}
                      </div>
                    )}
                  </div>
                </div>
                {/* Training Examples */}
                <div>
                  <h3 className="text-amber-300 font-semibold mb-3 flex items-center">
                    📚 TRAINING EXAMPLES - Study These Patterns
                  </h3>
                  
                  <div className={`grid gap-4 ${calculateExampleLayout(currentPuzzle.train.length, Math.max(...currentPuzzle.train.map(ex => ex.input[0]?.length || 0)))}`}>
                    {currentPuzzle.train.map((example, index) => (
                      <Card key={index} className="bg-slate-700 border-amber-700 hover:border-amber-500 transition-colors">
                        <CardContent className="p-3">
                          <div className="text-amber-400 text-xs font-semibold mb-2 text-center">
                            Example {index + 1} of {currentPuzzle.train.length}
                          </div>
                          <div className="flex flex-col items-center space-y-3">
                            <div className="flex items-center justify-center space-x-3">
                              {renderDisplayGrid(example.input, "INPUT")}
                              <div className="text-amber-400 text-xl flex-shrink-0">→</div>
                              {renderDisplayGrid(example.output, "OUTPUT")}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <Separator className="bg-amber-600" />
                
                {/* Test Challenge */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-amber-300 font-semibold flex items-center">
                      🎯 YOUR CHALLENGE - Apply the Pattern
                    </h3>
                    {currentPuzzle.test.length > 1 && (
                      <div className="text-amber-400 text-sm">
                        {currentPuzzle.test.length} test cases available
                      </div>
                    )}
                  </div>
                  
                  {/* Test Case Tabs (if multiple test cases) */}
                  {currentPuzzle.test.length > 1 && (
                    <div className="flex space-x-2 mb-4">
                      {currentPuzzle.test.map((_, index) => (
                        <Button
                          key={index}
                          variant={selectedTestCase === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTestCaseChange(index)}
                          className={
                            selectedTestCase === index 
                              ? "bg-amber-600 text-slate-900" 
                              : "border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-slate-900"
                          }
                        >
                          Test Case {index + 1}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <Card className="bg-slate-700 border-amber-400">
                    <CardContent className="p-6">
                      {/* Enhanced Grid Controls */}
                      <div className="bg-slate-900 border border-amber-800 rounded-lg p-4 mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyInputToSolution}
                              className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                              title="Copy the test input grid to your solution grid as a starting point"
                            >
                              📥 Copy Input
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Clear all cells to 0
                                const testCase = currentPuzzle.test[selectedTestCase];
                                if (testCase) {
                                  const emptyGrid = testCase.input.map(row => row.map(() => 0));
                                  setPlayerSolution(emptyGrid);
                                }
                              }}
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              title="Clear all cells to empty (0)"
                            >
                              🗑️ Clear All
                            </Button>
                            
                            <Button
                              variant={showEmojiPalette ? "default" : "outline"}
                              size="sm"
                              onClick={() => setShowEmojiPalette(!showEmojiPalette)}
                              className={showEmojiPalette 
                                ? "bg-purple-600 hover:bg-purple-700 text-white" 
                                : "border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                              }
                              title="Show/hide emoji palette for fast value selection"
                            >
                              🎨 Palette
                            </Button>
                          </div>
                          
                          <div className="text-xs text-amber-500 max-w-md">
                            💡 <strong>New:</strong> Copy input, drag-select multiple cells, right-click to clear, use palette for fast selection
                          </div>
                        </div>

                        {/* Emoji Palette */}
                        {showEmojiPalette && (
                          <div className="bg-slate-800 border border-purple-600 rounded-lg p-3">
                            <div className="text-purple-400 text-sm font-medium mb-2">
                              🎨 Value Palette - Click to select, then click/drag on grid
                            </div>
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                              {getUsedValues().map(value => {
                                const emoji = showNumbers ? value.toString() : transformGridForDisplay([[value]])[0][0];
                                
                                // Calculate styles based on display mode and selection state
                                let buttonStyle = {};
                                let buttonClassName = `h-10 w-10 flex items-center justify-center rounded border transition-colors text-sm`;
                                
                                if (showNumbers) {
                                  if (selectedValue === value) {
                                    // Selected state: use purple selection styling
                                    buttonClassName += ' bg-purple-600 border-purple-400 text-white';
                                  } else {
                                    // Not selected: use ARC colors with gray border
                                    buttonStyle = {
                                      backgroundColor: getARCColorCSS(value),
                                      color: value === 4 ? '#000000' : '#ffffff' // Black text for yellow (4), white for others
                                    };
                                    buttonClassName += ' border-gray-400 hover:border-purple-400';
                                  }
                                } else {
                                  // Emoji mode: use original purple styling
                                  buttonClassName += selectedValue === value 
                                    ? ' bg-purple-600 border-purple-400 text-white' 
                                    : ' bg-slate-700 border-purple-700 text-purple-200 hover:bg-purple-800';
                                }
                                
                                return (
                                  <button
                                    key={value}
                                    className={buttonClassName}
                                    style={buttonStyle}
                                    onClick={() => setSelectedValue(value)}
                                  >
                                    {emoji}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 mb-6">
                        <div className="flex items-center space-x-6">
                          {renderDisplayGrid(currentPuzzle.test[selectedTestCase].input, "TEST INPUT")}
                          <div className="text-amber-400 text-3xl">→</div>
                          {renderSolutionGrid()}
                        </div>
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        <Button
                          onClick={handleSubmitSolution}
                          disabled={validating}
                          className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-semibold px-8"
                        >
                          {validating ? 'Validating...' : '🚀 Submit Solution'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Results Modal would go here */}
      {showResult && validationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-amber-400 max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className={`text-center ${validationResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                {validationResult.correct ? '🏆 MISSION ACCOMPLISHED' : '❌ MISSION FAILED'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-amber-100">
                {validationResult.message}
              </div>
              
              {validationResult.correct && (
                <div className="space-y-2">
                  <div className="text-amber-400">Points Earned: {validationResult.pointsEarned}</div>
                  {validationResult.rankUp && (
                    <div className="text-yellow-400 font-bold">
                      🎖️ PROMOTED TO {validationResult.newRank}!
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex space-x-3 justify-center">
                <Button
                  onClick={() => {
                    setShowResult(false);
                    setCurrentPuzzle(null);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-slate-900"
                >
                  Continue Training
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}