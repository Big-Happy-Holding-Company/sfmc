import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SPACE_EMOJIS, EMOJI_SET_INFO } from "@/constants/spaceEmojis";
import type { EmojiSet } from "@/constants/spaceEmojis";
import { cn } from "@/lib/utils";

interface InteractiveGridProps {
  gridSize: number;
  emojiSet?: EmojiSet;
  onGridChange?: (grid: string[][]) => void;
  initialGrid?: string[][];
  disabled?: boolean;
}

export function InteractiveGrid({ 
  gridSize, 
  emojiSet = "status_main", 
  onGridChange,
  initialGrid,
  disabled = false
}: InteractiveGridProps) {
  const emojis = SPACE_EMOJIS[emojiSet];
  
  const createEmptyGrid = () => 
    Array(gridSize).fill(null).map(() => Array(gridSize).fill(emojis[0]));
  
  const [grid, setGrid] = useState<string[][]>(
    initialGrid || createEmptyGrid()
  );

  const cycleEmoji = (row: number, col: number) => {
    if (disabled) return;
    
    const newGrid = grid.map((gridRow, r) =>
      gridRow.map((cell, c) => {
        if (r === row && c === col) {
          const currentIndex = emojis.indexOf(cell);
          const nextIndex = (currentIndex + 1) % emojis.length;
          return emojis[nextIndex];
        }
        return cell;
      })
    );
    
    setGrid(newGrid);
    onGridChange?.(newGrid);
  };

  const resetGrid = () => {
    if (disabled) return;
    const emptyGrid = createEmptyGrid();
    setGrid(emptyGrid);
    onGridChange?.(emptyGrid);
  };

  const emojiSetInfo = EMOJI_SET_INFO[emojiSet];

  return (
    <div className="space-y-4">
      {/* Emoji Set Information */}
      <div className="bg-slate-800 border border-slate-600 rounded p-3 mb-4">
        <div className="text-center mb-3">
          <h4 className="text-cyan-400 font-semibold text-sm">{emojiSetInfo.name}</h4>
          <p className="text-slate-400 text-xs">{emojiSetInfo.description}</p>
        </div>
        
        {/* Available Emojis Palette */}
        <div className="flex flex-wrap justify-center gap-1 bg-slate-900 p-2 rounded">
          {emojis.map((emoji, index) => (
            <div
              key={index}
              className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded text-sm border border-slate-600"
              title={`Click cells to cycle through these emojis (${index})`}
            >
              {emoji}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">
          Click grid cells to cycle through these symbols
        </p>
      </div>

      {/* Interactive Grid */}
      <div 
        className="grid gap-1 bg-slate-800 p-2 rounded mx-auto w-fit"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Button
              key={`${rowIndex}-${colIndex}`}
              variant="ghost"
              size="sm"
              onClick={() => cycleEmoji(rowIndex, colIndex)}
              disabled={disabled}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded text-xl transition-all duration-200",
                disabled 
                  ? "bg-slate-700 cursor-not-allowed" 
                  : "bg-cyan-400 bg-opacity-20 border border-cyan-400 hover:bg-opacity-30"
              )}
            >
              {cell}
            </Button>
          ))
        )}
      </div>
      
      {!disabled && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={resetGrid}
            className="bg-red-500 hover:bg-red-600 text-slate-50 border-red-500"
          >
            <i className="fas fa-redo mr-2"></i>RESET
          </Button>
        </div>
      )}
    </div>
  );
}
