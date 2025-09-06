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
    <div className={`bg-slate-700 rounded-lg p-6 border border-slate-600 ${className}`}>
      {/* Centered Header with Grid Size */}
      <div className="text-center mb-6">
        <h3 className="text-amber-300 text-4xl font-bold mb-4">⚙️ INPUT CONTROLS</h3>
        
        {/* Ultra Compact Grid Size */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-slate-300 text-2xl font-medium">Grid Size:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={width}
              min="1"
              max="30"
              onChange={(e) => handleSizeChange(parseInt(e.target.value) || 1, height)}
              className="w-16 h-12 px-2 bg-slate-600 border border-slate-500 rounded text-amber-100 text-center text-2xl font-bold"
            />
            <span className="text-slate-400 text-3xl font-bold">×</span>
            <input
              type="number"
              value={height}
              min="1"
              max="30"
              onChange={(e) => handleSizeChange(width, parseInt(e.target.value) || 1)}
              className="w-16 h-12 px-2 bg-slate-600 border border-slate-500 rounded text-amber-100 text-center text-2xl font-bold"
            />
          </div>
          
          {onValueSelect && (
            <Badge variant="outline" className="text-slate-300 border-slate-500 text-2xl px-4 py-2 ml-4">
              Selected: {selectedValue}
            </Badge>
          )}
        </div>
      </div>

      {/* Suggested Sizes - Centered */}
      {suggestedSizes.length > 0 && (
        <div className="text-center mb-6">
          <div className="text-slate-400 text-2xl font-semibold mb-4">Quick Sizes from Examples:</div>
          <div className="flex flex-wrap justify-center gap-3">
            {suggestedSizes.map((suggestion, index) => (
              <Button
                key={index}
                size="lg"
                variant="outline"
                className="h-12 px-6 text-xl font-bold border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                onClick={() => handleSizeChange(suggestion.width, suggestion.height)}
              >
                {suggestion.width}×{suggestion.height}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Display Controls - Centered */}
      {(onDisplayModeChange || onEmojiSetChange) && (
        <div className="border-t border-slate-600 pt-6 mt-6">
          <div className="space-y-6">
            {/* Display Mode Toggle - Centered */}
            {onDisplayModeChange && (
              <div className="text-center">
                <label className="text-slate-300 text-2xl font-bold block mb-4">Display Mode:</label>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDisplayModeToggle}
                  className="border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white text-2xl px-8 py-4 font-bold"
                >
                  {getDisplayModeLabel(displayMode)}
                </Button>
              </div>
            )}
            
            {/* Emoji Set Selector - Centered */}
            {onEmojiSetChange && (displayMode === 'emoji' || displayMode === 'hybrid') && (
              <div className="text-center">
                <label className="text-slate-300 text-2xl font-bold mb-4 block">Emoji Set:</label>
                <div className="max-w-md mx-auto">
                  <Select value={emojiSet} onValueChange={(value: EmojiSet) => onEmojiSetChange(value)}>
                    <SelectTrigger className="bg-slate-600 border-slate-500 text-amber-100 h-14 text-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {Object.entries(EMOJI_SET_INFO).map(([key, info]) => (
                        <SelectItem 
                          key={key} 
                          value={key}
                          className="text-amber-100 focus:bg-slate-600 focus:text-amber-200 py-4"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{SPACE_EMOJIS[key as EmojiSet][1]}</span>
                            <div>
                              <div className="font-bold text-xl">{info.name}</div>
                              <div className="text-lg text-slate-400">{info.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMOJI PALETTE - Centered */}
      {onValueSelect && (
        <div className="border-t border-slate-600 pt-6 mt-6">
          <div className="text-center mb-6">
            <label className="text-slate-300 text-2xl font-bold block mb-2">Emoji Palette</label>
            <div className="text-slate-400 text-xl">
              {usedValues.length > 0 && `🔵 = Used in puzzle`}
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {getAllEmojis().map(({ emoji, value }) => {
              const isSelected = value === selectedValue;
              const isUsed = usedValues.includes(value);
              
              return (
                <Button
                  key={value}
                  variant={isSelected ? "default" : "outline"}
                  size="lg"
                  onClick={() => onValueSelect(value)}
                  className={`
                    h-16 w-16 p-0 text-2xl font-bold flex-shrink-0
                    ${isSelected 
                      ? 'bg-amber-600 text-slate-900 hover:bg-amber-700 ring-4 ring-amber-400' 
                      : isUsed
                        ? 'border-cyan-400 text-cyan-300 hover:bg-cyan-600 hover:text-white border-2'
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
          
          <div className="text-center text-xl text-slate-400 mt-6 max-w-3xl mx-auto">
            💡 Click emoji to select • Click grid cells to cycle through values • Drag to flood-fill
          </div>
        </div>
      )}

      {/* Warning for existing data - Centered */}
      {hasExistingData && (
        <div className="mt-6 text-center">
          <div className="inline-block text-2xl text-orange-400 bg-orange-900/20 border border-orange-800 rounded-lg p-4 font-bold">
            ⚠️ You have existing solution data. Changing size will reset your progress.
          </div>
        </div>
      )}
    </div>
  );
}
