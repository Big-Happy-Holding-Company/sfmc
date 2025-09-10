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
  hasLargeGrids?: boolean;
  /** Enhanced display mode - defaults to emoji for backward compatibility */
  displayMode?: DisplayMode;
}

interface ExampleCardProps {
  example: TrainingExample;
  index: number;
  emojiSet: EmojiSet;
  hasLargeGrids?: boolean;
  displayMode?: DisplayMode;
}

function ExampleCard({ example, index, emojiSet, hasLargeGrids, displayMode = 'emoji' }: ExampleCardProps) {
  if (hasLargeGrids) {
    // Large grid layout: Vertical stacking, no scrollbars, use full width
    return (
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600 flex-shrink-0 w-80">
        <h3 className="text-amber-300 text-sm font-semibold mb-4 text-center">
          TRAINING EXAMPLE {index + 1}
        </h3>
        
        <div className="space-y-4">
          {/* Input - Full width, no scrollbars */}
          <div className="text-center">
            <h4 className="text-slate-300 text-xs font-medium mb-2">INPUT</h4>
            <ResponsiveOfficerDisplayGrid
              grid={example.input}
              containerType="example"
              emojiSet={emojiSet}
              displayMode={displayMode}
              className="w-full max-w-none"
            />
          </div>
          
          {/* Arrow */}
          <div className="text-center">
            <div className="text-cyan-400 text-lg font-bold">↓</div>
          </div>
          
          {/* Output - Full width, no scrollbars */}
          <div className="text-center">
            <h4 className="text-slate-300 text-xs font-medium mb-2">OUTPUT</h4>
            <ResponsiveOfficerDisplayGrid
              grid={example.output}
              containerType="example"
              emojiSet={emojiSet}
              displayMode={displayMode}
              className="w-full max-w-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // Small grid layout: Compact side-by-side
  return (
    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
      <h3 className="text-amber-300 text-sm font-semibold mb-4 text-center">
        TRAINING EXAMPLE {index + 1}
      </h3>
      
      <div className="flex items-center justify-center gap-4">
        <div className="flex-1 text-center">
          <ResponsiveOfficerDisplayGrid
            grid={example.input}
            title="INPUT"
            containerType="example"
            emojiSet={emojiSet}
            displayMode={displayMode}
          />
        </div>
            
        {/* Transformation Indicator */}
        <div className="text-cyan-400 text-2xl font-bold px-2">
          →
        </div>
        
        <div className="flex-1 text-center">
          <ResponsiveOfficerDisplayGrid
            grid={example.output}
            title="OUTPUT"
            containerType="example"
            emojiSet={emojiSet}
            displayMode={displayMode}
          />
        </div>
      </div>
    </div>
  );
}

export function TrainingExamplesSection({ 
  examples, 
  emojiSet = 'tech_set1', 
  title = '📚 TRAINING EXAMPLES',
  className = '',
  hasLargeGrids = false,
  displayMode = 'emoji'
}: TrainingExamplesSectionProps) {
  
  if (!examples || examples.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-slate-400">No training examples available</div>
      </div>
    );
  }

  // Determine grid layout based on number of examples
  const getGridCols = () => {
    const count = examples.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2';
    // For 5+ examples, use 2 columns on tablet, 3 on desktop
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  // Different background shades for example cards
  const exampleCardBgColors = [
    'bg-slate-700',
    'bg-slate-700/90',
    'bg-slate-700/80',
    'bg-slate-700/70',
    'bg-slate-700/60'
  ];

  return (
    <div className={`bg-slate-800 border border-slate-600 rounded-lg p-6 ${className}`}>
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-amber-300 text-3xl font-bold mb-2">
          {title}
        </h2>
        <p className="text-slate-300 text-lg">
          Apply what you learn from these examples to solve the puzzle
        </p>
        <div className="text-slate-400 text-sm mt-2">
          {examples.length} example{examples.length !== 1 ? 's' : ''} provided
        </div>
      </div>
      
      {/* Compact Horizontal Layout for ALL grid sizes */}
      <div className="overflow-x-auto">
        <div className="flex gap-6 pb-4 px-2">
          {examples.map((example, index) => {
            // Calculate cell size for training examples (smaller, more compact)
            const maxInputDim = Math.max(example.input.length, example.input[0]?.length || 1);
            const maxOutputDim = Math.max(example.output.length, example.output[0]?.length || 1);
            const maxDim = Math.max(maxInputDim, maxOutputDim);
            
            // Use bigger cell sizes for training examples - much more visible
            const cellSize = maxDim > 20 ? 24 : maxDim > 15 ? 32 : maxDim > 10 ? 40 : 48;
            const bgColor = exampleCardBgColors[index % exampleCardBgColors.length];
            
            return (
              <div 
                key={index} 
                className={`flex-shrink-0 ${bgColor} rounded-lg border border-slate-600 p-4 shadow-md w-64`}
              >
                <h3 className="text-amber-300 text-lg font-bold mb-3 text-center border-b border-slate-600 pb-2">
                  Training Example {index + 1}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-cyan-400 text-sm font-medium mb-1">Input Grid</div>
                    <div className="flex justify-center">
                      <ResponsiveOfficerDisplayGrid
                        grid={example.input}
                        containerType="example"
                        emojiSet={emojiSet}
                        displayMode={displayMode}
                        fixedCellSize={cellSize}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="text-cyan-400 text-xl font-bold rotate-90 sm:rotate-0">
                      ↓
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-emerald-400 text-sm font-medium mb-1">Output Grid</div>
                    <div className="flex justify-center">
                      <ResponsiveOfficerDisplayGrid
                        grid={example.output}
                        containerType="example"
                        emojiSet={emojiSet}
                        displayMode={displayMode}
                        fixedCellSize={cellSize}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pattern Analysis Hint (if many examples) */}
      {examples.length >= 3 && (
        <div className="mt-6 bg-blue-900 border border-blue-600 rounded-lg p-4">
          <div className="text-blue-300 text-sm">
            <strong>💡 Pattern Analysis:</strong> Study these {examples.length} examples to identify the transformation pattern. 
            Look for consistent rules that apply across all input → output pairs.
          </div>
        </div>
      )}
    </div>
  );
}