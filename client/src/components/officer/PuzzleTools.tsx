/**
 * 
 * Author: Claude Code using Sonnet 4
 * Date: 2025-09-12
 * PURPOSE: Enhanced puzzle tools with glowing pulse effects to guide user interaction.
 * Provides display controls and action tools for ARC puzzle solving with improved UX.
 * Features pulsing glow effect on Display Mode controls until user first interacts.
 * SRP and DRY check: Pass - Single responsibility (puzzle tools/controls), enhanced with UX improvements
 * 
 */

import React, { useState } from 'react';
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
  onReplayTutorial?: () => void;
  onValidate: () => void;
  
  // Validation state
  isValidating: boolean;
  allTestsCompleted: boolean;
  isAssessmentMode?: boolean;
  
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
  onReplayTutorial,
  onValidate,
  isValidating,
  allTestsCompleted,
  isAssessmentMode = false,
  usedValues
}: PuzzleToolsProps) {
  // Track user interaction to control glowing pulse effect
  const [hasInteractedWithDisplayMode, setHasInteractedWithDisplayMode] = useState(false);

  // Handle display mode change with interaction tracking
  const handleDisplayModeChange = (mode: DisplayMode) => {
    setHasInteractedWithDisplayMode(true);
    onDisplayModeChange(mode);
  };
  return (
    <>
      {/* Emoji Palette - Main Selection */}
      <EmojiPaletteDivider
        emojiSet={emojiSet}
        selectedValue={selectedValue}
        onValueSelect={onValueSelect}
        usedValues={usedValues}
        displayMode={displayMode}
        className="bg-slate-800 border border-slate-600 rounded-lg p-5 w-full mb-4"
      />

      {/* Display Mode & Emoji Set Controls */}
      <div className={`
        bg-slate-800 border border-slate-600 rounded-lg p-5 w-full transition-all duration-300
        ${!hasInteractedWithDisplayMode ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/30' : ''}
      `}>
        <h4 className={`
          text-amber-300 text-3xl font-bold mb-3 text-center transition-all duration-300
          ${!hasInteractedWithDisplayMode ? 'animate-pulse [animation-duration:4s] text-amber-200' : ''}
        `}>
          DISPLAY MODE
        </h4>
        <p className={`
          text-slate-300 text-xl mb-4 text-center transition-all duration-300
          ${!hasInteractedWithDisplayMode ? 'animate-pulse [animation-duration:4s] text-slate-200' : ''}
        `}>
          Choose how to visualize puzzle values
        </p>
        
        {/* Display Mode Toggle - Clear and Verbose */}
        <div className="flex flex-col gap-3 mb-4">
          <button
            onClick={() => handleDisplayModeChange('arc-colors')}
            className={`
              px-6 py-4 text-lg font-bold rounded h-16 w-full flex-shrink-0 transition-all duration-300
              ${!hasInteractedWithDisplayMode ? 'animate-pulse [animation-duration:4s] ring-1 ring-amber-400/60' : ''}
              ${displayMode === 'arc-colors' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl">🔢 Numbers Only</span>
            </div>
          </button>
          <button
            onClick={() => handleDisplayModeChange('emoji')}
            className={`
              px-6 py-4 text-lg font-bold rounded h-16 w-full flex-shrink-0 transition-all duration-300
              ${!hasInteractedWithDisplayMode ? 'animate-pulse [animation-duration:4s] ring-1 ring-amber-400/60' : ''}
              ${displayMode === 'emoji' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl">🎨 Emojis Only</span>
            </div>
          </button>
          <button
            onClick={() => handleDisplayModeChange('hybrid')}
            className={`
              px-6 py-4 text-lg font-bold rounded h-16 w-full flex-shrink-0 transition-all duration-300
              ${!hasInteractedWithDisplayMode ? 'animate-pulse [animation-duration:4s] ring-1 ring-amber-400/60' : ''}
              ${displayMode === 'hybrid' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl">🔀 Numbers + Emojis</span>
            </div>
          </button>
        </div>
        
        {/* Emoji Set Dropdown - Only show when emoji or hybrid mode */}
        {(displayMode === 'emoji' || displayMode === 'hybrid') && (
          <div>
            <label className="text-slate-300 text-lg font-semibold mb-2 block">Emoji Theme:</label>
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
          </div>
        )}
      </div>

      {/* Action Controls - Puzzle Actions */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-5 w-full">
        <h4 className="text-amber-300 text-2xl font-bold mb-4 text-center">PUZZLE ACTIONS</h4>
        
        {/* Primary Actions Row */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button 
            size="lg" 
            variant="outline" 
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white text-xl font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[140px]" 
            onClick={onCopyInput}
          >
            Copy Input
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-xl font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[140px]" 
            onClick={onResetSolution}
          >
            Reset
          </Button>
          {onReplayTutorial && (
            <Button 
              size="lg" 
              variant="outline" 
              className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white text-xl font-bold px-6 py-4 h-16 flex-1 sm:flex-none min-w-[140px]"
              onClick={onReplayTutorial}
            >
              Replay Tutorial
            </Button>
          )}
        </div>
      </div>

      {/* Validation Button - Separated with margin */}
      <div className="mt-4">
        <Button
          size="lg"
          className="w-full px-4 py-4 h-16 text-xl bg-amber-600 hover:bg-amber-700 text-white"
          disabled={false}
          onClick={onValidate}
        >
          {isValidating ? '🔄 Submitting to PlayFab...' : '🎯 Submit for Official Validation'}
        </Button>
        
        {/* Helper text */}
        <div className="text-base text-slate-400 mt-3 text-center">
          {isAssessmentMode ? 
            'Submit your attempt for official assessment validation.' :
            'Submit your solution for official PlayFab validation.'}
        </div>
      </div>
    </>
  );
}