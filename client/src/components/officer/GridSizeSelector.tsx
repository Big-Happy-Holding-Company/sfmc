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
}

export function GridSizeSelector({
  width,
  height,
  onSizeChange,
  hasExistingData,
  suggestedSizes = [],
  className = ''
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

  return (
    <div className={`bg-slate-700 rounded-lg p-4 border border-slate-600 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-amber-300 text-sm font-semibold">
          📐 OUTPUT GRID SIZE
        </h3>
        <Badge variant="outline" className="text-slate-300 border-slate-500">
          Current: {width}×{height}
        </Badge>
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
      
      {/* Warning for existing data */}
      {hasExistingData && (
        <div className="mt-3 text-xs text-orange-400 bg-orange-900/20 border border-orange-800 rounded p-2">
          ⚠️ You have existing solution data. Changing size will reset your progress.
        </div>
      )}
    </div>
  );
}
