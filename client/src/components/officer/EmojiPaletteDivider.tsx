/**
 * EmojiPaletteDivider Component
 * =============================
 * Compact 2x5 emoji palette that acts as a visual divider between
 * TEST INPUT and YOUR SOLUTION in the solver interface
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { SPACE_EMOJIS, type EmojiSet } from '@/constants/spaceEmojis';

interface EmojiPaletteDividerProps {
  emojiSet: EmojiSet;
  selectedValue: number;
  onValueSelect: (value: number) => void;
  usedValues?: number[];
  className?: string;
}

export const EmojiPaletteDivider: React.FC<EmojiPaletteDividerProps> = ({
  emojiSet,
  selectedValue,
  onValueSelect,
  usedValues = [],
  className = ''
}) => {
  const getAllEmojis = () => {
    const emojis = SPACE_EMOJIS[emojiSet];
    return emojis.map((emoji, index) => ({ emoji, value: index }));
  };

  const emojis = getAllEmojis();
  
  // Split into 2 rows of 5 emojis each
  const topRow = emojis.slice(0, 5);
  const bottomRow = emojis.slice(5, 10);

  const renderEmojiButton = ({ emoji, value }: { emoji: string; value: number }) => {
    const isSelected = value === selectedValue;
    const isUsed = usedValues.includes(value);
    
    return (
      <Button
        key={value}
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={() => onValueSelect(value)}
        className={`
          h-12 w-12 p-0 text-lg font-bold flex-shrink-0
          ${isSelected 
            ? 'bg-amber-600 text-slate-900 hover:bg-amber-700 ring-2 ring-amber-400' 
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
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-1 ${className}`}>
      {/* Top row (0-4) */}
      <div className="flex gap-1">
        {topRow.map(renderEmojiButton)}
      </div>
      
      {/* Bottom row (5-9) */}
      <div className="flex gap-1">
        {bottomRow.map(renderEmojiButton)}
      </div>
      
      {/* Selected value indicator */}
      <div className="text-amber-400 text-sm font-bold mt-1">
        Selected: {selectedValue}
      </div>
    </div>
  );
};