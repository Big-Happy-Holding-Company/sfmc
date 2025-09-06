/**
 * Puzzle Display Controls Component
 * =================================
 * Master control panel for emoji sets, display modes, and value selection
 * Follows GridSizeSelector pattern for consistent professional design
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SPACE_EMOJIS, EMOJI_SET_INFO, type EmojiSet } from '@/constants/spaceEmojis';
import type { PuzzleDisplayControlsProps, DisplayMode } from '@/types/puzzleDisplayTypes';

export function PuzzleDisplayControls({
  displayMode,
  emojiSet,
  selectedValue,
  onDisplayModeChange,
  onEmojiSetChange,
  onValueSelect,
  className = ''
}: PuzzleDisplayControlsProps) {

  const handleDisplayModeToggle = () => {
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

  const getDisplayModeDescription = (mode: DisplayMode) => {
    switch (mode) {
      case 'emoji': return 'Space-themed emojis only';
      case 'arc-colors': return 'Official ARC colors with numbers';
      case 'hybrid': return 'Emojis over colored backgrounds';
    }
  };

  return (
    <div className={`bg-slate-700 rounded-lg p-4 border border-slate-600 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-amber-300 text-sm font-semibold">
          🎛️ DISPLAY CONTROLS
        </h3>
        <Badge variant="outline" className="text-slate-300 border-slate-500">
          Selected: {selectedValue}
        </Badge>
      </div>

      {/* Display Mode Toggle */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
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
        <div className="text-xs text-slate-400 bg-slate-800 rounded p-2">
          {getDisplayModeDescription(displayMode)}
        </div>
      </div>

      {/* Emoji Set Selector */}
      {(displayMode === 'emoji' || displayMode === 'hybrid') && (
        <div className="mb-4">
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

      {/* Quick Value Selector */}
      <div className="mb-3">
        <label className="text-slate-300 text-sm font-medium mb-2 block">Quick Value Select:</label>
        <div className="grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => {
            const isSelected = value === selectedValue;
            let preview = value.toString();
            
            if (displayMode === 'emoji' || displayMode === 'hybrid') {
              const emojis = SPACE_EMOJIS[emojiSet];
              preview = emojis[value];
            }
            
            return (
              <Button
                key={value}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onValueSelect(value)}
                className={`
                  h-8 w-8 p-0 text-xs font-bold
                  ${isSelected 
                    ? 'bg-amber-600 text-slate-900 hover:bg-amber-700' 
                    : 'border-slate-500 text-slate-300 hover:bg-slate-600'
                  }
                `}
                title={`Value ${value} - Click to select for painting`}
              >
                {preview}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="text-xs text-slate-400 bg-slate-800 rounded p-2">
        💡 Select a value above, then click grid cells to paint with that value. 
        {displayMode === 'hybrid' && ' Hybrid mode shows emojis over ARC colors.'}
      </div>
    </div>
  );
}