/**
 * Officer Puzzle Search Component
 * 
 * Enhanced search with AI difficulty filters
 * Allows exact puzzle ID input and smart filtering based on AI trustworthiness
 * 
 * Based on arc-explainer SearchFilters pattern but adapted for SFMC
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Shuffle, Brain, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfficerPuzzleSearchProps {
  onSearch: (puzzleId: string) => void;
  onRandomPuzzle: (difficulty?: string) => void;
  onFilterChange: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export interface SearchFilters {
  difficulty?: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging' | 'all';
  zeroAccuracyOnly?: boolean;
  minAccuracy?: number;
  maxAccuracy?: number;
}

export function OfficerPuzzleSearch({ 
  onSearch, 
  onRandomPuzzle, 
  onFilterChange,
  isLoading = false 
}: OfficerPuzzleSearchProps) {
  
  const [puzzleIdInput, setPuzzleIdInput] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    difficulty: 'all',
    zeroAccuracyOnly: false
  });

  const handleSearch = () => {
    if (puzzleIdInput.trim()) {
      // Clean up the input - remove .json extension if present, handle various formats
      let cleanId = puzzleIdInput.trim();
      if (cleanId.endsWith('.json')) {
        cleanId = cleanId.slice(0, -5);
      }
      
      // Remove ARC prefixes if present (user might paste full PlayFab ID)
      cleanId = cleanId.replace(/^ARC-[A-Z0-9]+-/, '');
      
      onSearch(cleanId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRandomPuzzle = () => {
    const difficulty = filters.difficulty === 'all' ? undefined : filters.difficulty;
    onRandomPuzzle(difficulty);
  };

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-cyan-400 font-semibold flex items-center">
          <Search className="mr-2" />
          PUZZLE LOOKUP & AI FILTERING
        </h2>
      </div>

      {/* Exact Puzzle ID Search */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="puzzleId" className="text-slate-300">
            Enter Exact Puzzle ID
          </Label>
          <p className="text-xs text-slate-500 mb-2">
            e.g., "1ae2feb7" or "007bbfb7" (without .json extension)
          </p>
          <div className="flex gap-2">
            <Input
              id="puzzleId"
              placeholder="Enter puzzle ID..."
              value={puzzleIdInput}
              onChange={(e) => setPuzzleIdInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="bg-slate-700 border-slate-600 text-slate-200"
            />
            <Button 
              onClick={handleSearch} 
              disabled={!puzzleIdInput.trim() || isLoading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Difficulty Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="difficulty" className="text-slate-300">
            <Brain className="h-4 w-4 inline mr-1" />
            AI Difficulty Level
          </Label>
          <Select 
            value={filters.difficulty} 
            onValueChange={(value) => handleFilterChange('difficulty', value)}
          >
            <SelectTrigger id="difficulty" className="bg-slate-700 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="impossible">🤖❌ Impossible (0%)</SelectItem>
              <SelectItem value="extremely_hard">🤖😰 Extremely Hard (0-25%)</SelectItem>
              <SelectItem value="very_hard">🤖😅 Very Hard (25-50%)</SelectItem>
              <SelectItem value="challenging">🤖🤔 Challenging (50-75%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zeroAccuracy" className="text-slate-300">
            AI Success Filter
          </Label>
          <Select 
            value={filters.zeroAccuracyOnly ? 'zero' : 'any'} 
            onValueChange={(value) => handleFilterChange('zeroAccuracyOnly', value === 'zero')}
          >
            <SelectTrigger id="zeroAccuracy" className="bg-slate-700 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Success Rate</SelectItem>
              <SelectItem value="zero">🚫 Zero Success Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Actions</Label>
          <div className="flex gap-2">
            <Button
              onClick={handleRandomPuzzle}
              disabled={isLoading}
              variant="outline"
              className="flex-1 bg-slate-700 border-slate-600 hover:bg-slate-600"
            >
              <Shuffle className="h-4 w-4 mr-1" />
              Random
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.difficulty !== 'all' || filters.zeroAccuracyOnly) && (
        <div className="flex items-center gap-2 p-3 bg-slate-900 rounded border border-slate-700">
          <Filter className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-slate-400">Active filters:</span>
          
          {filters.difficulty !== 'all' && (
            <span className="px-2 py-1 text-xs bg-slate-700 rounded text-slate-300">
              {filters.difficulty?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )}
          
          {filters.zeroAccuracyOnly && (
            <span className="px-2 py-1 text-xs bg-red-900 bg-opacity-50 rounded text-red-400">
              Zero Success Only
            </span>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const resetFilters = { difficulty: 'all' as const, zeroAccuracyOnly: false };
              setFilters(resetFilters);
              onFilterChange(resetFilters);
            }}
            className="ml-auto h-6 px-2 text-xs text-slate-500 hover:text-slate-300"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-slate-500 space-y-1">
        <p>💡 <strong>Pro tip:</strong> Use "Impossible" filter to find puzzles that stump all AI systems</p>
        <p>🎯 <strong>Training focus:</strong> Red difficulty puzzles are where humans excel beyond AI</p>
      </div>
    </div>
  );
}