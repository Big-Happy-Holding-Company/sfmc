/**
 * Value Palette Component
 * =======================
 * Interactive value selector (0-9) with visual previews in current display mode
 * Provides click selection and keyboard shortcuts for intuitive value picking
 */

import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { SPACE_EMOJIS, getARCColorCSS } from '@/constants/spaceEmojis';
import type { ValuePaletteProps } from '@/types/puzzleDisplayTypes';

export function ValuePalette({
  selectedValue,
  displayMode,
  emojiSet,
  onValueSelect,
  usedValues = [],
  className = ''
}: ValuePaletteProps) {

  // Handle keyboard shortcuts (0-9 keys)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = event.key;
      if (key >= '0' && key <= '9') {
        event.preventDefault();
        const value = parseInt(key);
        onValueSelect(value);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onValueSelect]);

  const getValuePreview = (value: number) => {
    switch (displayMode) {
      case 'emoji':
        return SPACE_EMOJIS[emojiSet][value];
      case 'arc-colors':
        return value.toString();
      case 'hybrid':
        return SPACE_EMOJIS[emojiSet][value];
    }
  };

  const getValueStyles = (value: number) => {
    const baseStyles = `
      w-10 h-10 rounded border-2 cursor-pointer transition-all duration-200
      flex items-center justify-center font-bold text-sm
      hover:scale-110 active:scale-95
    `;

    const isSelected = value === selectedValue;
    const isUsed = usedValues.includes(value);

    if (displayMode === 'arc-colors' || displayMode === 'hybrid') {
      const backgroundColor = getARCColorCSS(value);
      const isDark = value === 0 || value === 5 || value === 9; // Black, Grey, Maroon
      const textColor = isDark ? 'white' : 'black';
      
      return `
        ${baseStyles}
        ${isSelected 
          ? 'border-amber-400 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-700' 
          : isUsed
            ? 'border-cyan-400'
            : 'border-slate-500 hover:border-slate-400'
        }
      `.trim();
    } else {
      // Emoji mode
      return `
        ${baseStyles}
        bg-slate-600 text-amber-100
        ${isSelected 
          ? 'border-amber-400 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-700 bg-slate-500' 
          : isUsed
            ? 'border-cyan-400 bg-slate-500'
            : 'border-slate-500 hover:border-slate-400 hover:bg-slate-500'
        }
      `.trim();
    }
  };

  const getValueBackground = (value: number) => {
    if (displayMode === 'arc-colors' || displayMode === 'hybrid') {
      return { backgroundColor: getARCColorCSS(value) };
    }
    return {};
  };

  const getValueTextColor = (value: number) => {
    if (displayMode === 'arc-colors') {
      const isDark = value === 0 || value === 5 || value === 9; // Black, Grey, Maroon
      return { color: isDark ? 'white' : 'black' };
    }
    return {};
  };

  return (
    <div className={`bg-slate-700 rounded-lg p-4 border border-slate-600 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-amber-300 text-sm font-semibold">
          🎨 VALUE PALETTE
        </h3>
        <Badge variant="outline" className="text-slate-300 border-slate-500">
          Selected: {selectedValue}
        </Badge>
      </div>

      {/* Value Grid */}
      <div className="grid grid-cols-5 gap-3 mb-3">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => {
          const isSelected = value === selectedValue;
          const isUsed = usedValues.includes(value);
          
          return (
            <div
              key={value}
              className={getValueStyles(value)}
              style={{
                ...getValueBackground(value),
                ...getValueTextColor(value)
              }}
              onClick={() => onValueSelect(value)}
              title={`Value ${value} - Click to select (or press ${value} key)`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onValueSelect(value);
                }
              }}
            >
              {getValuePreview(value)}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border border-slate-700"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="text-xs text-slate-400 bg-slate-800 rounded p-2 space-y-1">
        <div>🖱️ Click values to select • ⌨️ Press 0-9 keys for quick selection</div>
        {usedValues.length > 0 && (
          <div>🔵 Cyan borders show values used in this puzzle</div>
        )}
        {displayMode === 'hybrid' && (
          <div>🎭 Hybrid mode: emojis shown over ARC color backgrounds</div>
        )}
      </div>
    </div>
  );
}