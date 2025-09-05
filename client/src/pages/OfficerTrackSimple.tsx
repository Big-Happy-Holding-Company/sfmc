/**
 * Officer Track - Simple Version
 * 
 * Clean, focused page for puzzle discovery
 * No overengineering - just the essentials
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { useOfficerPuzzles } from '@/hooks/useOfficerPuzzles';
import { OfficerDifficultyCards } from '@/components/game/OfficerDifficultyCards';
import { PuzzleGrid } from '@/components/officer/PuzzleGrid';
import { arcDataService } from '@/services/arcDataService';
import type { OfficerPuzzle } from '@/services/officerArcAPI';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';

export default function OfficerTrackSimple() {
  const { 
    filteredPuzzles, 
    stats, 
    loading, 
    error, 
    filterByDifficulty, 
    searchById,
    currentFilter,
    refresh 
  } = useOfficerPuzzles();
  
  const [currentPuzzle, setCurrentPuzzle] = useState<OfficerTrackPuzzle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Handle difficulty filter from cards
  const handleDifficultySelect = (difficulty: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging') => {
    if (currentFilter === difficulty) {
      // Clicking same filter clears it
      filterByDifficulty(null);
    } else {
      filterByDifficulty(difficulty);
    }
  };

  // Handle puzzle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const puzzle = await searchById(searchQuery.trim());
      if (puzzle) {
        // Load full puzzle data from arcDataService
        const fullPuzzleData = await arcDataService.searchPuzzleById(puzzle.id);
        if (fullPuzzleData) {
          setCurrentPuzzle(fullPuzzleData);
          console.log('✅ Loaded puzzle for solving:', fullPuzzleData.id);
        } else {
          alert(`Failed to load puzzle data for "${puzzle.id}"`);
        }
      } else {
        alert(`Puzzle "${searchQuery}" not found. Try a different ID.`);
      }
    } catch (err) {
      console.error('Search failed:', err);
      alert('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Handle puzzle selection from grid  
  const handleSelectPuzzle = async (puzzle: OfficerPuzzle) => {
    try {
      console.log('🎯 Loading puzzle for solving:', puzzle.id);
      
      // Load full puzzle data from arcDataService using the arc ID
      const fullPuzzleData = await arcDataService.searchPuzzleById(puzzle.id);
      
      if (fullPuzzleData) {
        setCurrentPuzzle(fullPuzzleData);
        console.log('✅ Puzzle loaded and ready to solve:', fullPuzzleData.id);
      } else {
        alert(`Failed to load puzzle data for "${puzzle.id}"`);
        console.error('❌ No full puzzle data found for:', puzzle.id);
      }
      
    } catch (err) {
      console.error('❌ Failed to load puzzle:', err);
      alert('Failed to load puzzle. Please try another one.');
    }
  };

  // If puzzle selected, show puzzle solver (simple version for now)
  if (currentPuzzle) {
    return (
      <div className="min-h-screen bg-slate-900 text-amber-50">
        {/* Header */}
        <header className="bg-slate-800 border-b-2 border-amber-400 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-amber-400">
                  🎯 MISSION: {currentPuzzle.filename || currentPuzzle.id}
                </h1>
                <Badge className="bg-amber-600 text-slate-900 font-bold">
                  {currentPuzzle.difficulty} LEVEL
                </Badge>
              </div>
              
              <Button 
                variant="outline" 
                className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
                onClick={() => setCurrentPuzzle(null)}
              >
                ← Back to Puzzle Selection
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-green-900 border border-green-600 rounded-lg p-8 text-center">
            <h2 className="text-green-400 text-2xl font-bold mb-4">
              ✅ Puzzle Solver Connected!
            </h2>
            <div className="text-green-200 space-y-2 mb-6">
              <div><strong>Puzzle ID:</strong> {currentPuzzle.id}</div>
              <div><strong>Filename:</strong> {currentPuzzle.filename}</div>
              <div><strong>Difficulty:</strong> {currentPuzzle.difficulty}</div>
              <div><strong>Dataset:</strong> {currentPuzzle.dataset}</div>
              <div><strong>Training Examples:</strong> {currentPuzzle.train?.length || 0}</div>
              <div><strong>Test Cases:</strong> {currentPuzzle.test?.length || 0}</div>
            </div>
            <div className="text-green-300 text-sm">
              <p className="mb-2">
                🎉 <strong>Success!</strong> The puzzle has been loaded from the arc-explainer API 
                and successfully translated to the full PlayFab puzzle format.
              </p>
              <p>
                The existing puzzle solver UI can now be integrated here to complete the flow.
                For now, this demonstrates the end-to-end connection working perfectly!
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                onClick={refresh} 
                variant="outline" 
                size="sm" 
                className="ml-auto border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                🔄 Retry
              </Button>
            </div>
          </div>
        )}

        {/* Puzzle Search */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 mb-6">
          <h2 className="text-amber-400 font-semibold mb-4 flex items-center">
            🔍 PUZZLE SEARCH
          </h2>
          <div className="flex space-x-3">
            <Input
              type="text"
              placeholder="Enter puzzle ID (e.g., 007bbfb7)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-slate-700 border-slate-600 text-amber-100 flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-slate-900"
            >
              {searching ? 'Searching...' : 'Find Puzzle'}
            </Button>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Search for specific puzzles by their ID (supports both arc and PlayFab formats)
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