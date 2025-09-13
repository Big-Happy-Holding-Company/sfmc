/**
 * Training Examples Section
 * =========================
 * Responsive layout system for displaying ARC puzzle training examples
 * Handles multiple examples with proper input/output pairing and mobile optimization
 */

import { ResponsiveOfficerDisplayGrid } from '@/components/officer/ResponsiveOfficerGrid';
import type { ARCGrid } from '@/types/arcTypes';
import type { DisplayMode } from '@/types/puzzleDisplayTypes';
import type { EmojiSet } from '@/constants/spaceEmojis';

interface TrainingExample {
  input: ARCGrid;
  output: ARCGrid;
}

interface TrainingExamplesSectionProps {
  examples: TrainingExample[];
  emojiSet?: EmojiSet;
  title?: string;
  className?: string;
  displayMode?: DisplayMode;
}

export function TrainingExamplesSection({ 
  examples, 
  emojiSet = 'tech_set1', 
  title = '📚 TRAINING EXAMPLES',
  className = '',
  displayMode = 'emoji'
}: TrainingExamplesSectionProps) {
  
  if (!examples || examples.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-slate-400">No training examples available</div>
      </div>
    );
  }

  // Light pastel background colors for example cards - non-distracting and readable
  const getExampleBgClass = (index: number) => {
    const bgClasses = [
      'bg-rose-100',
      'bg-sky-100',
      'bg-emerald-100', 
      'bg-purple-100',
      'bg-amber-100'
    ];
    return bgClasses[index % bgClasses.length];
  };

  return (
    <div className={`bg-slate-800 border border-slate-600 rounded-lg p-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-amber-400 text-2xl font-bold flex items-center">
          {title}
        </h2>
        <div className="text-slate-400 text-base">
          {examples.length} example{examples.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4">
          {examples.map((example, index) => {
            // Simplified cell size calculation for compact examples
            const calculateExampleCellSize = (grid: ARCGrid) => {
              const maxDim = Math.max(grid.length, grid[0]?.length || 0);
              if (maxDim > 15) return 16; // Very large grids get small cells
              if (maxDim > 10) return 20; // Large grids
              return 24; // Default for small/medium grids
            };

            const inputCellSize = calculateExampleCellSize(example.input);
            const outputCellSize = calculateExampleCellSize(example.output);

            return (
              <div key={index} className={`flex-shrink-0 ${getExampleBgClass(index)} rounded-lg border-4 border-slate-400 shadow-lg p-3 relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-slate-600 rounded-tl-md"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-slate-600 rounded-tr-md"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-slate-600 rounded-bl-md"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-slate-600 rounded-br-md"></div>
                
                <h3 className="text-slate-800 text-base font-bold mb-2 text-center">
                  EX {index + 1}
                </h3>
                <div className="flex items-center gap-3">
                  <ResponsiveOfficerDisplayGrid
                    grid={example.input}
                    containerType="example"
                    emojiSet={emojiSet}
                    displayMode={displayMode}
                    fixedCellSize={inputCellSize}
                  />
                  <div className="text-slate-700 text-2xl font-bold">→</div>
                  <ResponsiveOfficerDisplayGrid
                    grid={example.output}
                    containerType="example"
                    emojiSet={emojiSet}
                    displayMode={displayMode}
                    fixedCellSize={outputCellSize}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pattern Analysis Hint (if many examples) */}
      {examples.length >= 3 && (
        <div className="mt-6 bg-blue-900 border border-blue-600 rounded-lg p-4">
          <div className="text-blue-300 text-base">
            <strong>💡 Pattern Analysis:</strong> Study these {examples.length} examples to identify the transformation pattern. 
            Look for consistent rules that apply across all input → output pairs.
          </div>
        </div>
      )}
    </div>
  );
}