/**
 * Officer Track Page - Advanced ARC Puzzle Interface
 * ========================================================
 * Author: Space Force Mission Control Team
 * 
 * Purpose:
 * Advanced puzzle interface for ARC-AGI challenges with military academy theming.
 * Completely separate from main game with dedicated officer ranking system.
 * 
 * Key Features:
 * - ARC puzzle loading and transformation from integer grids to emoji presentation
 * - Officer rank progression system (Lieutenant → General)
 * - Separate PlayFab leaderboards and achievements
 * - Gold/silver military academy visual theme
 * - Advanced difficulty indicators and complex puzzle handling
 * 
 * Data Flow:
 * - Loads ARC puzzles via arcDataService (1,920+ puzzles)
 * - Manages officer player data via playFabOfficerTrack
 * - Validates solutions via dedicated CloudScript function
 * - Maintains complete separation from base game
 */

import { useState, useEffect } from "react";
import { arcDataService } from "@/services/arcDataService";
import { playFabService } from "@/services/playfab";
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
import { SPACE_EMOJIS } from "@/constants/spaceEmojis";

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
  const [availablePuzzles, setAvailablePuzzles] = useState<ARCPuzzleSearchResult | null>(null);
  const [playerSolution, setPlayerSolution] = useState<number[][]>([]);
  const [validationResult, setValidationResult] = useState<ARCValidationResult | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [selectedEmojiSet, setSelectedEmojiSet] = useState('tech_set1');

  // Initialize Officer Track data
  useEffect(() => {
    const initializeOfficerTrack = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🎖️  Initializing Officer Track...');
        
        // Initialize PlayFab if needed
        if (!playFabService.isAuthenticated()) {
          await playFabService.loginAnonymously();
        }
        
        // Load officer player data
        const playerData = await playFabService.getOfficerPlayerData();
        setOfficerPlayer(playerData);
        console.log(`👮 Officer loaded: ${playerData.officerRank} with ${playerData.officerPoints} points`);
        
        // Load initial set of ARC puzzles based on officer rank
        const puzzleData = await arcDataService.loadARCPuzzles({
          datasets: ['training', 'evaluation'],
          limit: 20,
          offset: 0,
          difficulty: getAccessibleDifficulties(playerData.officerRank)
        });
        setAvailablePuzzles(puzzleData);
        console.log(`🧩 Loaded ${puzzleData.puzzles.length} ARC puzzles for ${playerData.officerRank}`);
        
        console.log('✅ Officer Track initialization complete');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Officer Track';
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
   * Handle puzzle selection
   */
  const handleSelectPuzzle = (puzzle: OfficerTrackPuzzle) => {
    console.log(`🎯 Selected puzzle: ${puzzle.id} (${puzzle.difficulty})`);
    
    setCurrentPuzzle(puzzle);
    setStartTime(Date.now());
    setValidationResult(null);
    setShowResult(false);
    
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
   * Transform integer grid to emoji display
   */
  const transformGridForDisplay = (grid: number[][]): ARCDisplayGrid => {
    return arcDataService.transformIntegersToEmojis(grid, selectedEmojiSet);
  };

  /**
   * Render a grid for display (input/output examples)
   */
  const renderDisplayGrid = (grid: number[][], title: string): JSX.Element => {
    const emojiGrid = transformGridForDisplay(grid);
    
    return (
      <div className="text-center">
        <div className="text-xs text-amber-300 mb-2 font-semibold">{title}</div>
        <div 
          className="grid gap-1 bg-slate-800 p-3 rounded border border-amber-600"
          style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 1}, 1fr)` }}
        >
          {emojiGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded text-sm border border-amber-800"
              >
                {cell}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  /**
   * Render interactive solution grid
   */
  const renderSolutionGrid = (): JSX.Element => {
    if (!currentPuzzle) return <div></div>;
    
    const testCase = currentPuzzle.test[0];
    if (!testCase) return <div></div>;
    
    return (
      <div className="text-center">
        <div className="text-xs text-amber-300 mb-2 font-semibold">YOUR SOLUTION</div>
        <div 
          className="grid gap-1 bg-slate-800 p-3 rounded border-2 border-amber-400"
          style={{ gridTemplateColumns: `repeat(${playerSolution[0]?.length || 1}, 1fr)` }}
        >
          {playerSolution.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-lg border border-amber-700 transition-colors"
                onClick={() => {
                  // Cycle through available integers 0-9
                  const newGrid = [...playerSolution];
                  newGrid[rowIndex][colIndex] = (cell + 1) % 10;
                  setPlayerSolution(newGrid);
                }}
                disabled={validating}
              >
                {SPACE_EMOJIS[selectedEmojiSet as keyof typeof SPACE_EMOJIS][cell]}
              </button>
            ))
          )}
        </div>
        <div className="text-xs text-amber-600 mt-2">
          Click cells to cycle through values (0-9)
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
            <Card className="bg-slate-800 border-amber-400">
              <CardHeader>
                <CardTitle className="text-amber-400 flex items-center">
                  🧩 Advanced Reasoning Challenges
                  <Badge className="ml-3 bg-amber-600 text-slate-900">
                    {availablePuzzles?.totalCount || 0} Available
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-100 mb-4">
                  Welcome to the Officer Academy, {officerPlayer?.officerRank}. These Advanced Reasoning Corpus (ARC) 
                  puzzles will test your pattern recognition and abstract thinking abilities. Each puzzle requires 
                  understanding complex transformations that go far beyond standard operations.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availablePuzzles?.puzzles.map((puzzle) => (
                    <Card 
                      key={puzzle.id}
                      className="bg-slate-700 border-amber-600 hover:border-amber-400 cursor-pointer transition-colors"
                      onClick={() => handleSelectPuzzle(puzzle)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className={`
                            ${puzzle.difficulty === 'LIEUTENANT' ? 'bg-green-600' : ''}
                            ${puzzle.difficulty === 'CAPTAIN' ? 'bg-blue-600' : ''}
                            ${puzzle.difficulty === 'MAJOR' ? 'bg-purple-600' : ''}
                            ${puzzle.difficulty === 'COLONEL' ? 'bg-red-600' : ''}
                          `}>
                            {puzzle.difficulty}
                          </Badge>
                          <div className="text-xs text-amber-400">
                            {puzzle.dataset.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="text-sm font-semibold text-amber-200 mb-1">
                          {puzzle.id}
                        </div>
                        
                        <div className="text-xs text-slate-300 space-y-1">
                          <div>Training Examples: {puzzle.complexity.trainingExamples}</div>
                          <div>Colors Used: {puzzle.complexity.uniqueColors}</div>
                          <div>Complexity: {puzzle.complexity.transformationComplexity}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                      <span>🎯 MISSION: {currentPuzzle.id}</span>
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
                {/* Training Examples */}
                <div>
                  <h3 className="text-amber-300 font-semibold mb-3 flex items-center">
                    📚 TRAINING EXAMPLES - Study These Patterns
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {currentPuzzle.train.map((example, index) => (
                      <Card key={index} className="bg-slate-700 border-amber-700">
                        <CardContent className="p-4">
                          <div className="text-amber-400 text-sm font-semibold mb-3">
                            Example {index + 1}
                          </div>
                          <div className="flex items-center justify-center space-x-6">
                            {renderDisplayGrid(example.input, "INPUT")}
                            <div className="text-amber-400 text-2xl">→</div>
                            {renderDisplayGrid(example.output, "OUTPUT")}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <Separator className="bg-amber-600" />
                
                {/* Test Challenge */}
                <div>
                  <h3 className="text-amber-300 font-semibold mb-3 flex items-center">
                    🎯 YOUR CHALLENGE - Apply the Pattern
                  </h3>
                  
                  <Card className="bg-slate-700 border-amber-400">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center space-x-8 mb-6">
                        {renderDisplayGrid(currentPuzzle.test[0].input, "TEST INPUT")}
                        <div className="text-amber-400 text-3xl">→</div>
                        {renderSolutionGrid()}
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        <Button
                          onClick={handleSubmitSolution}
                          disabled={validating}
                          className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-semibold px-8"
                        >
                          {validating ? 'Validating...' : '🚀 Submit Solution'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Reset solution to empty
                            const testCase = currentPuzzle.test[0];
                            if (testCase) {
                              const emptyGrid = testCase.input.map(row => row.map(() => 0));
                              setPlayerSolution(emptyGrid);
                            }
                          }}
                          className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-slate-900"
                        >
                          🔄 Reset Grid
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