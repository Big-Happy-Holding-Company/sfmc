/**
 * WHAT DOES THIS DO?
 * ===================
 * This component provides display controls and action tools for ARC puzzle solving.
 * It handles display mode switching (numbers/emojis/hybrid), emoji set selection,
 * puzzle actions (copy input, reset), and validation submission controls.
 * 
 * WHO WROTE IT?
 * =============
 * Extracted from ResponsivePuzzleSolver.tsx as part of code refactoring to follow
 * Single Responsibility Principle and DRY principles. Original code was inline
 * within the main solver component (lines 672-772).
 * 
 * WHEN WAS IT WRITTEN?
 * ====================
 * September 2025 - Extracted during component modularization effort
 * 
 * WHERE DID I GET THIS CODE FROM?
 * ===============================
 * Extracted from ResponsivePuzzleSolver.tsx solving interface section.
 * Originally part of the "Combined Controls Panel" and action controls.
 * 
 * DOES IT WORK?
 * =============
 * Yes - This component handles:
 * - Display mode toggle (arc-colors/emoji/hybrid visualization)
 * - Emoji set dropdown selection for puzzle theming
 * - Action buttons (Copy Input, Reset Solution)
 * - Validation submission with PlayFab integration
 * - Status messages and helper text
 * - Emoji palette integration for value selection
 * 
 * Is it actually used anywhere?
 * =============================
 * Yes - Used by ResponsivePuzzleSolver.tsx in the main solving interface.
 * Replaces the inline display controls and actions to improve code organization.
 * 
 * HOW IT WORKS:
 * =============
 * 1. Display Controls:
 *    - Three mode buttons: 123 (numbers), 🎨 (emojis), MIX (hybrid)
 *    - Emoji set dropdown appears when emoji/hybrid mode is selected
 *    - Calls display change callbacks to update parent state
 * 
 * 2. Action Controls:
 *    - Copy Input: Copies test input grid to solution grid
 *    - Reset: Clears solution grid to empty state
 *    - Both actions trigger parent callbacks for grid updates
 * 
 * 3. Validation Controls:
 *    - Submit button changes color based on completion status
 *    - Shows validation progress (submitting, verified, error states)
 *    - Helper text provides guidance on validation requirements
 * 
 * 4. Emoji Palette Integration:
 *    - Displays compact 2x5 palette for value selection
 *    - Highlights values used in current puzzle
 *    - Updates selected value for painting on grid
 * 
 * DEPENDENCIES:
 * =============
 * - @/components/ui/button (consistent button styling)
 * - @/components/officer/EmojiPaletteDivider (value selection palette)
 * - @/constants/spaceEmojis (emoji set options and labels)
 * - @/types/puzzleDisplayTypes (DisplayMode type definition)
 * 
 * STYLING:
 * ========
 * - Space Force theme: slate-800 backgrounds, amber-300 headings
 * - Large interactive elements (h-14) for better accessibility
 * - Color-coded validation states (green=ready, gray=incomplete)
 * - Responsive layout with proper spacing and alignment
 */

import { Button } from '@/components/ui/button';
import { EmojiPaletteDivider } from '@/components/officer/EmojiPaletteDivider';
import type { DisplayMode } from '@/types/puzzleDisplayTypes';
import type { EmojiSet } from '@/constants/spaceEmojis';
import { getEmojiSetOptions, getEmojiSetDropdownLabel } from '@/constants/spaceEmojis';

interface PuzzleToolsProps {
  // Display state
  displayMode: DisplayMode;
  emojiSet: EmojiSet;
  selectedValue: number;
  
  // Display control handlers
  onDisplayModeChange: (mode: DisplayMode) => void;
  onEmojiSetChange: (emojiSet: EmojiSet) => void;
  onValueSelect: (value: number) => void;
  
  // Action handlers
  onCopyInput: () => void;
  onResetSolution: () => void;
  onValidate: () => void;
  
  // Validation state
  isValidating: boolean;
  allTestsCompleted: boolean;
  
  // Palette data
  usedValues: number[];
}

export function PuzzleTools({
  displayMode,
  emojiSet,
  selectedValue,
  onDisplayModeChange,
  onEmojiSetChange,
  onValueSelect,
  onCopyInput,
  onResetSolution,
  onValidate,
  isValidating,
  allTestsCompleted,
  usedValues
}: PuzzleToolsProps) {
  return (
    <>
      {/* Display Mode & Emoji Set Controls */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-full">
        <h4 className="text-amber-300 text-lg font-semibold mb-4 text-center">DISPLAY</h4>
        
        {/* Display Mode Toggle */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button
            onClick={() => onDisplayModeChange('arc-colors')}
            className={`px-6 py-3 text-lg font-bold rounded h-14 min-w-[80px] flex-shrink-0 ${displayMode === 'arc-colors' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            123
          </button>
          <button
            onClick={() => onDisplayModeChange('emoji')}
            className={`px-6 py-3 text-lg font-bold rounded h-14 min-w-[80px] flex-shrink-0 ${displayMode === 'emoji' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            🎨
          </button>
          <button
            onClick={() => onDisplayModeChange('hybrid')}
            className={`px-6 py-3 text-lg font-bold rounded h-14 min-w-[80px] flex-shrink-0 ${displayMode === 'hybrid' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            MIX
          </button>
        </div>
        
        {/* Emoji Set Dropdown - Only show when emoji or hybrid mode */}
        {(displayMode === 'emoji' || displayMode === 'hybrid') && (
          <select
            value={emojiSet}
            onChange={(e) => onEmojiSetChange(e.target.value as EmojiSet)}
            className="w-full bg-slate-700 border border-slate-500 rounded px-4 py-3 text-amber-100 text-lg h-14"
          >
            {getEmojiSetOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {getEmojiSetDropdownLabel(option.value)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Action Controls - Puzzle Actions */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-full">
        <h4 className="text-amber-300 text-lg font-semibold mb-4 text-center">ACTIONS</h4>
        
        {/* Primary Actions Row */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button 
            size="lg" 
            variant="outline" 
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white text-lg font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[120px]" 
            onClick={onCopyInput}
          >
            Copy Input
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-lg font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[120px]" 
            onClick={onResetSolution}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Emoji Palette - Main Selection */}
      <EmojiPaletteDivider
        emojiSet={emojiSet}
        selectedValue={selectedValue}
        onValueSelect={onValueSelect}
        usedValues={usedValues}
        displayMode={displayMode}
        className="bg-slate-800 border border-slate-600 rounded-lg p-3 w-full"
      />

      {/* Validation Button - Separated with margin */}
      <div className="mt-4">
        <Button
          size="lg"
          className={`w-full px-3 py-3 h-12 text-sm ${
            allTestsCompleted 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
          disabled={isValidating}
          onClick={onValidate}
        >
          {isValidating ? '🔄 Submitting to PlayFab...' : 
           allTestsCompleted ? '🎯 Submit for Official Validation' : 
           '🎯 Submit Solution (Incomplete)'}
        </Button>
        
        {/* Helper text */}
        <div className="text-xs text-slate-400 mt-2 text-center">
          {allTestsCompleted ? 
            'All tests pass locally! Submit for official verification.' :
            'Frontend validation checks your solution as you work.'}
        </div>
      </div>
    </>
  );
}