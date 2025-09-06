/**
 * Responsive Officer Grid Component
 * =================================
 * Enhanced version of OfficerGrid with responsive sizing capabilities
 * Uses useResponsiveGridSize hook to adapt to screen size and grid dimensions
 */

import { useState, useEffect } from 'react';
import type { ARCGrid, ARCDisplayGrid } from '@/types/arcTypes';
import { SPACE_EMOJIS } from '@/constants/spaceEmojis';
import { useResponsiveGridSize, getContainerConfig } from '@/hooks/useResponsiveGridSize';

interface ResponsiveOfficerGridProps {
  /** Initial grid values (integers 0-9) */
  initialGrid: ARCGrid;
  /** Emoji set to use for visual representation */
  emojiSet?: string;
  /** Whether the grid is interactive or display-only */
  interactive?: boolean;
  /** Callback when grid values change */
  onChange?: (grid: ARCGrid) => void;
  /** Whether the grid is disabled */
  disabled?: boolean;
  /** Optional title for the grid */
  title?: string;
  /** Container type affects sizing strategy */
  containerType?: 'example' | 'solver' | 'display';
  /** Additional CSS classes */
  className?: string;
  /** Override cell size calculation (for specific use cases) */
  fixedCellSize?: number;
}

export function ResponsiveOfficerGrid({
  initialGrid,
  emojiSet = 'tech_set1',
  interactive = true,
  onChange,
  disabled = false,
  title,
  containerType = 'display',
  className = '',
  fixedCellSize
}: ResponsiveOfficerGridProps) {
  const [grid, setGrid] = useState<ARCGrid>(initialGrid);

  // Get responsive sizing
  const gridHeight = initialGrid.length;
  const gridWidth = initialGrid[0]?.length || 0;
  const containerConfig = getContainerConfig(containerType);
  
  const responsiveSize = useResponsiveGridSize({
    gridWidth,
    gridHeight,
    containerType,
    ...containerConfig
  });

  // Use fixed size if provided, otherwise use responsive calculation
  const cellSize = fixedCellSize || responsiveSize.cellSize;
  const fontSize = Math.max(10, Math.floor(cellSize * 0.5));

  // Update grid when initialGrid changes
  useEffect(() => {
    setGrid(initialGrid);
  }, [initialGrid]);

  /**
   * Handle cell click - cycle through values 0-9
   */
  const handleCellClick = (row: number, col: number) => {
    if (!interactive || disabled) return;

    const newGrid = grid.map((gridRow, rowIndex) =>
      gridRow.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          // Cycle to next value (0-9, then back to 0)
          return (cell + 1) % 10;
        }
        return cell;
      })
    );

    setGrid(newGrid);
    onChange?.(newGrid);
  };

  /**
   * Transform integer grid to emoji display
   */
  const getDisplayGrid = (): ARCDisplayGrid => {
    const emojis = SPACE_EMOJIS[emojiSet as keyof typeof SPACE_EMOJIS];
    if (!emojis) {
      console.warn(`Unknown emoji set: ${emojiSet}, using default`);
      const defaultEmojis = SPACE_EMOJIS.tech_set1;
      return grid.map(row => 
        row.map(cell => {
          const safeCell = Math.max(0, Math.min(9, cell));
          return defaultEmojis[safeCell];
        })
      );
    }

    return grid.map(row => 
      row.map(cell => {
        const safeCell = Math.max(0, Math.min(9, cell));
        return emojis[safeCell];
      })
    );
  };

  const displayGrid = getDisplayGrid();

  if (gridHeight === 0 || gridWidth === 0) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <div className="text-amber-400 text-sm">No grid data</div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      {/* Title */}
      {title && (
        <div className="text-xs text-amber-300 mb-2 font-semibold uppercase tracking-wide">
          {title}
        </div>
      )}

      {/* Responsive Grid */}
      <div 
        className={`
          inline-grid gap-1 p-3 rounded border-2 mx-auto
          ${interactive ? 'bg-slate-800 border-amber-400' : 'bg-slate-700 border-amber-600'}
          ${disabled ? 'opacity-50' : ''}
        `}
        style={fixedCellSize ? {
          gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`
        } : responsiveSize.gridStyle}
      >
        {displayGrid.map((row, rowIndex) =>
          row.map((emoji, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                flex items-center justify-center rounded font-bold
                border transition-all duration-200
                ${interactive && !disabled
                  ? 'cursor-pointer bg-slate-700 border-amber-700 hover:bg-slate-600 hover:border-amber-500 hover:scale-105 active:scale-95'
                  : 'bg-slate-600 border-amber-800'
                }
                ${disabled ? 'cursor-not-allowed' : ''}
              `}
              style={{ 
                width: `${cellSize}px`, 
                height: `${cellSize}px`,
                fontSize: `${fontSize}px`,
                minHeight: `${Math.max(cellSize, 16)}px`,
                minWidth: `${Math.max(cellSize, 16)}px`
              }}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              title={interactive ? `Click to change (currently: ${grid[rowIndex][colIndex]})` : undefined}
            >
              {emoji}
            </div>
          ))
        )}
      </div>

      {/* Interactive instructions */}
      {interactive && !disabled && (
        <div className="text-xs text-amber-600 mt-2">
          Click cells to cycle through values (0-9)
        </div>
      )}

      {/* Grid info and responsive debug - improved styling to prevent overlap */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-slate-400 mt-3 p-2 bg-slate-800 rounded border border-slate-600 space-y-1">
          <div className="font-mono">{gridHeight}×{gridWidth} • {emojiSet}</div>
          <div className="font-mono">Cell: {cellSize}px • Type: {containerType}</div>
          <div className="font-mono">Total: {responsiveSize.totalWidth}×{responsiveSize.totalHeight}px</div>
        </div>
      )}
    </div>
  );
}

/**
 * Display-only version with responsive sizing
 */
export function ResponsiveOfficerDisplayGrid({
  grid,
  title,
  emojiSet = 'tech_set1',
  containerType = 'example',
  className = '',
  fixedCellSize
}: {
  grid: ARCGrid;
  title?: string;
  emojiSet?: string;
  containerType?: 'example' | 'solver' | 'display';
  className?: string;
  fixedCellSize?: number;
}) {
  return (
    <ResponsiveOfficerGrid
      initialGrid={grid}
      emojiSet={emojiSet}
      interactive={false}
      title={title}
      containerType={containerType}
      className={className}
      fixedCellSize={fixedCellSize}
    />
  );
}