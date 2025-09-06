/**
 * Officer Track - Simple Version
 * 
 * Clean, focused page for puzzle discovery
 * No overengineering - just the essentials
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { useOfficerPuzzles } from '@/hooks/useOfficerPuzzles';
import { OfficerDifficultyCards } from '@/components/game/OfficerDifficultyCards';
import { PuzzleGrid } from '@/components/officer/PuzzleGrid';
import { playFabService } from '@/services/playfab';
import type { OfficerPuzzle } from '@/services/officerArcAPI';

export default function OfficerTrackSimple() {
  const [location, setLocation] = useLocation();
  
  const { 
    filteredPuzzles, 
    stats, 
    total,
    loading, 
    error, 
    filterByDifficulty, 
    searchById,
    addSearchResult,
    currentFilter,
    currentLimit,
    refresh,
    setLimit 
  } = useOfficerPuzzles();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [playFabReady, setPlayFabReady] = useState(false);
  const [playFabInitializing, setPlayFabInitializing] = useState(true);

  // Initialize PlayFab on mount
  useEffect(() => {
    const initializePlayFab = async () => {
      try {
        console.log('🎖️ Initializing PlayFab for Officer Track...');
        setPlayFabInitializing(true);
        
        if (!playFabService.core.isReady()) {
          await playFabService.initialize();
        }
        
        if (!playFabService.isAuthenticated()) {
          await playFabService.loginAnonymously();
        }
        
        setPlayFabReady(true);
        console.log('✅ PlayFab ready for Officer Track');
      } catch (err) {
        console.error('❌ PlayFab initialization failed:', err);
        // Continue anyway - arc-explainer API doesn't require PlayFab
        // But warn user that puzzle loading might be limited
        setPlayFabReady(false);
      } finally {
        setPlayFabInitializing(false);
      }
    };

    initializePlayFab();
  }, []);

  // Handle difficulty filter from cards
  const handleDifficultySelect = (difficulty: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging') => {
    if (currentFilter === difficulty) {
      // Clicking same filter clears it
      filterByDifficulty(null);
    } else {
      filterByDifficulty(difficulty);
    }
  };

  // Handle puzzle search - add found puzzle to the card display
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Prevent search while PlayFab is still initializing
    if (playFabInitializing) {
      alert('Please wait for the system to initialize...');
      return;
    }
    
    setSearching(true);
    try {
      const puzzle = await searchById(searchQuery.trim());
      if (puzzle) {
        console.log('✅ Found puzzle:', puzzle.id);
        
        // Add the found puzzle to the display grid using the hook
        addSearchResult(puzzle);
        
        // Clear the search input after successful search
        setSearchQuery('');
        
        alert(`Found puzzle "${puzzle.id}"! Look for it at the top of the puzzle grid below.`);
      } else {
        if (playFabReady) {
          alert(`Puzzle "${searchQuery}" not found.\n\nTips:\n• Try a different puzzle ID (e.g., "007bbfb7")\n• Make sure the ID is exactly 8 characters\n• Check that the puzzle exists in the ARC dataset`);
        } else {
          alert(`Puzzle "${searchQuery}" not found.\n\n⚠️ PlayFab connection failed, so only puzzles with AI analysis data are available.\n\nTry:\n• A different puzzle ID\n• Refreshing the page\n• Checking your internet connection`);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Search failed: ${errorMessage}\n\nPlease try:\n• Refreshing the page\n• Checking your internet connection\n• Trying a different puzzle ID`);
    } finally {
      setSearching(false);
    }
  };

  // Handle puzzle selection from grid - navigate to dedicated solver page
  const handleSelectPuzzle = (puzzle: OfficerPuzzle) => {
    // Prevent navigation while PlayFab is still initializing
    if (playFabInitializing) {
      alert('Please wait for the system to initialize before loading puzzles...');
      return;
    }
    
    console.log('🎯 Navigating to puzzle solver:', puzzle.id);
    setLocation(`/officer-track/solve/${puzzle.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50">
      {/* Header */}
      <header className="bg-slate-800 border-b-2 border-amber-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-amber-400">
                🎖️ OFFICER ACADEMY
              </h1>
              <Badge className="bg-amber-600 text-slate-900 font-bold">
                ARC-AGI CHALLENGES
              </Badge>
            </div>
            
            <Button 
              variant="outline" 
              className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
              onClick={() => window.history.back()}
            >
              ← Return to Base
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error State */}
        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
              <div>
                <h3 className="text-red-400 font-semibold">Failed to Load Puzzle Data</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
              <Button 
                onClick={() => refresh()} 
                variant="outline" 
                size="sm" 
                className="ml-auto border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                🔄 Retry
              </Button>
            </div>
          </div>
        )}

        {/* Puzzle Search & Controls */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 mb-6">
          <h2 className="text-amber-400 font-semibold mb-4 flex items-center">
            🔍 PUZZLE SEARCH & FILTERS
          </h2>
          
          {/* System Status Indicator */}
          {playFabInitializing && (
            <div className="bg-blue-900 border border-blue-600 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3"></div>
                <span className="text-blue-300 text-sm">Initializing PlayFab connection for puzzle data access...</span>
              </div>
            </div>
          )}
          
          {!playFabInitializing && !playFabReady && (
            <div className="bg-orange-900 border border-orange-600 rounded-lg p-3 mb-4">
              <div className="text-orange-300 text-sm">
                ⚠️ PlayFab connection failed - puzzle loading may be limited to arc-explainer data only
              </div>
            </div>
          )}

          {/* Search Row */}
          <div className="flex space-x-3 mb-4">
            <Input
              type="text"
              placeholder="Enter puzzle ID (e.g., 494ef9d7)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-slate-700 border-slate-600 text-amber-100 flex-1"
              disabled={playFabInitializing}
            />
            <Button 
              onClick={handleSearch}
              disabled={playFabInitializing || searching || !searchQuery.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-slate-900 disabled:bg-amber-800 disabled:opacity-50"
            >
              {playFabInitializing ? 'Initializing...' : searching ? 'Searching...' : 'Find Puzzle'}
            </Button>
          </div>

          {/* Limit Controls - copied from arc-explainer */}
          <div className="border-t border-slate-600 pt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label htmlFor="limit-select" className="text-sm font-medium text-amber-300">
                  Show hardest:
                </label>
                <select
                  id="limit-select"
                  value={currentLimit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-amber-100"
                >
                  <option value={25}>25 puzzles</option>
                  <option value={50}>50 puzzles</option>
                  <option value={75}>75 puzzles</option>
                  <option value={100}>100 puzzles</option>
                  <option value={150}>150 puzzles</option>
                  <option value={200}>200 puzzles</option>
                </select>
              </div>
              
              <div className="text-slate-400 text-sm">
                Showing {filteredPuzzles.length} of {total} total analyzed puzzles
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-xs mt-3">
            Search for specific puzzles by their ID or adjust the number of hardest puzzles to display
          </p>

        </div>

        {/* Difficulty Cards */}
        <OfficerDifficultyCards 
          onCategorySelect={handleDifficultySelect}
          selectedCategory={currentFilter || undefined}
        />

        {/* Puzzle Grid */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-amber-400 font-semibold flex items-center">
              🧩 AVAILABLE CHALLENGES
              <Badge className="ml-3 bg-amber-600 text-slate-900">
                {filteredPuzzles.length} puzzles
              </Badge>
              {currentFilter && (
                <Badge className="ml-2 bg-blue-600 text-white">
                  {currentFilter.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </h2>
            
            {currentFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => filterByDifficulty(null)}
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
              >
                Clear Filter
              </Button>
            )}
          </div>

          <PuzzleGrid 
            puzzles={filteredPuzzles}
            loading={loading}
            onSelectPuzzle={handleSelectPuzzle}
          />
        </div>


        {/* Footer Info */}
        <div className="mt-12 text-center text-slate-400 text-sm">
          <p>🤖 Puzzle difficulty data sourced from arc-explainer AI analysis</p>
          <p className="mt-1">Find the puzzles that challenge AI systems to train the next generation of officers</p>
        </div>
        
      </main>
    </div>
  );
}