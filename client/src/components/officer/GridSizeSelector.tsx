/**
 * Grid Size Selector Component
 * Author: Cascade
 * 
 * PURPOSE:
 * Allows users to specify output grid dimensions when different from input size
 * Critical for ARC puzzles where output size ≠ input size
 * 
 * HOW IT WORKS:
 * - Provides width/height dropdowns (1-30 range)
 * - Shows current dimensions
 * - Warns when changing size would affect existing solution
 * - Suggests common sizes based on training examples
 * 
 * HOW THE PROJECT USES IT:
 * - Used in ResponsivePuzzleSolver for dynamic output grid sizing
 * - Enables proper solving of ARC puzzles with size transformations
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SPACE_EMOJIS, EMOJI_SET_INFO, type EmojiSet } from '@/constants/spaceEmojis';
import type { DisplayMode } from '@/types/puzzleDisplayTypes';

interface GridSizeSelectorProps {
  /** Current grid width */
  width: number;
  /** Current grid height */
  height: number;
  /** Callback when size changes */
  onSizeChange: (width: number, height: number) => void;
  /** Whether there's existing solution data that would be lost */
  hasExistingData: boolean;
  /** Suggested sizes from training examples */
  suggestedSizes?: Array<{ width: number; height: number; label: string }>;
  /** Additional CSS classes */
  className?: string;
  
  /** Enhanced display props */
  displayMode?: DisplayMode;
  emojiSet?: EmojiSet;
  selectedValue?: number;
  onDisplayModeChange?: (mode: DisplayMode) => void;
  onEmojiSetChange?: (emojiSet: EmojiSet) => void;
  onValueSelect?: (value: number) => void;
  usedValues?: number[];
}

export function GridSizeSelector({
  width,
  height,
  onSizeChange,
  hasExistingData,
  suggestedSizes = [],
  className = '',
  displayMode = 'emoji',
  emojiSet = 'tech_set1',
  selectedValue = 1,
  onDisplayModeChange,
  onEmojiSetChange,
  onValueSelect,
  usedValues = []
}: GridSizeSelectorProps) {
  
  const handleSizeChange = (newWidth: number, newHeight: number) => {
    if (hasExistingData && (newWidth !== width || newHeight !== height)) {
      const confirmed = confirm(
        `Changing grid size from ${width}×${height} to ${newWidth}×${newHeight} will reset your current solution. Continue?`
      );
      if (!confirmed) return;
    }
    onSizeChange(newWidth, newHeight);
  };

  const handleDisplayModeToggle = () => {
    if (!onDisplayModeChange) return;
    const modes: DisplayMode[] = ['emoji', 'arc-colors', 'hybrid'];
    const currentIndex = modes.indexOf(displayMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onDisplayModeChange(modes[nextIndex]);
  };

  const getDisplayModeLabel = (mode: DisplayMode) => {
    switch (mode) {
      case 'emoji': return '😊 Emoji';
      case 'arc-colors': return '🎨 Colors';
      case 'hybrid': return '🎭 Hybrid';
    }
  };

  // Get ALL emojis from the current set
  const getAllEmojis = () => {
    const emojis = SPACE_EMOJIS[emojiSet];
    return emojis.map((emoji, index) => ({ emoji, value: index }));
  };

  return (
    <div className={`bg-slate-700 rounded-lg p-4 border border-slate-600 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-amber-300 text-sm font-semibold">
          ⚙️ INPUT CONTROLS
        </h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-slate-300 border-slate-500">
            Size: {width}×{height}
          </Badge>
          {onValueSelect && (
            <Badge variant="outline" className="text-slate-300 border-slate-500">
              Selected: {selectedValue}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Size Controls */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-slate-300 text-sm">Width:</label>
          <select
            value={width}
            onChange={(e) => handleSizeChange(parseInt(e.target.value), height)}
            className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-amber-100 text-sm"
          >
            {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-slate-300 text-sm">Height:</label>
          <select
            value={height}
            onChange={(e) => handleSizeChange(width, parseInt(e.target.value))}
            className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-amber-100 text-sm"
          >
            {Array.from({ length: 30 }, (_, i) => i + 1).map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggested Sizes */}
      {suggestedSizes.length > 0 && (
        <div className="space-y-2">
          <div className="text-slate-400 text-xs">Suggested sizes from training examples:</div>
          <div className="flex flex-wrap gap-2">
            {suggestedSizes.map((suggestion, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                onClick={() => handleSizeChange(suggestion.width, suggestion.height)}
              >
                {suggestion.width}×{suggestion.height} {suggestion.label}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Display Controls */}
      {(onDisplayModeChange || onEmojiSetChange) && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="space-y-3">
            {/* Display Mode Toggle */}
            {onDisplayModeChange && (
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-medium">Display Mode:</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisplayModeToggle}
                  className="border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white"
                >
                  {getDisplayModeLabel(displayMode)}
                </Button>
              </div>
            )}
            
            {/* Emoji Set Selector */}
            {onEmojiSetChange && (displayMode === 'emoji' || displayMode === 'hybrid') && (
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Emoji Set:</label>
                <Select value={emojiSet} onValueChange={(value: EmojiSet) => onEmojiSetChange(value)}>
                  <SelectTrigger className="bg-slate-600 border-slate-500 text-amber-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {Object.entries(EMOJI_SET_INFO).map(([key, info]) => (
                      <SelectItem 
                        key={key} 
                        value={key}
                        className="text-amber-100 focus:bg-slate-600 focus:text-amber-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{SPACE_EMOJIS[key as EmojiSet][1]}</span>
                          <div>
                            <div className="font-medium">{info.name}</div>
                            <div className="text-xs text-slate-400">{info.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL EMOJI PALETTE - Show ALL emojis in selected set */}
      {onValueSelect && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="flex items-center justify-between mb-3">
            <label className="text-slate-300 text-sm font-medium">Emoji Palette (Click to select):</label>
            <div className="text-slate-400 text-xs">
              {usedValues.length > 0 && `🔵 = Used in puzzle`}
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-3">
            {getAllEmojis().map(({ emoji, value }) => {
              const isSelected = value === selectedValue;
              const isUsed = usedValues.includes(value);
              
              return (
                <Button
                  key={value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onValueSelect(value)}
                  className={`
                    h-12 w-12 p-0 text-xl font-bold
                    ${isSelected 
                      ? 'bg-amber-600 text-slate-900 hover:bg-amber-700' 
                      : isUsed
                        ? 'border-cyan-400 text-cyan-300 hover:bg-cyan-600 hover:text-white'
                        : 'border-slate-500 text-slate-300 hover:bg-slate-600'
                    }
                  `}
                  title={`Value ${value}: ${emoji} ${isUsed ? '(used in puzzle)' : ''}`}
                >
                  {emoji}
                </Button>
              );
            })}
          </div>
          
          <div className="text-xs text-slate-400 mt-2">
            💡 Click emoji to select • Click grid cells to cycle through values • Drag to flood-fill
          </div>
        </div>
      )}

      {/* Warning for existing data */}
      {hasExistingData && (
        <div className="mt-3 text-xs text-orange-400 bg-orange-900/20 border border-orange-800 rounded p-2">
          ⚠️ You have existing solution data. Changing size will reset your progress.
        </div>
      )}
    </div>
  );
}
