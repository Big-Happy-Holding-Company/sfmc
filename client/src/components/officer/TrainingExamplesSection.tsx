/**
 * Training Examples Section
 * =========================
 * Responsive layout system for displaying ARC puzzle training examples
 * Handles multiple examples with proper input/output pairing and mobile optimization
 */

import { ResponsiveOfficerDisplayGrid } from '@/components/officer/ResponsiveOfficerGrid';
import type { ARCGrid } from '@/types/arcTypes';

interface TrainingExample {
  input: ARCGrid;
  output: ARCGrid;
}

interface TrainingExamplesSectionProps {
  examples: TrainingExample[];
  emojiSet?: string;
  title?: string;
  className?: string;
}

interface ExampleCardProps {
  example: TrainingExample;
  index: number;
  emojiSet: string;
}

function ExampleCard({ example, index, emojiSet }: ExampleCardProps) {
  return (
    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
      {/* Example Header */}
      <h3 className="text-amber-300 text-sm font-semibold mb-4 text-center">
        TRAINING EXAMPLE {index + 1}
      </h3>
      
      {/* Input/Output Layout */}
      <div className="space-y-4">
        {/* Desktop and Tablet: Try side-by-side if space allows */}
        <div className="hidden md:block">
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 text-center">
              <ResponsiveOfficerDisplayGrid
                grid={example.input}
                title="INPUT"
                containerType="example"
                emojiSet={emojiSet}
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
              />
            </div>
          </div>
        </div>

        {/* Mobile: Stacked layout */}
        <div className="md:hidden space-y-4">
          <div className="text-center">
            <ResponsiveOfficerDisplayGrid
              grid={example.input}
              title="INPUT"
              containerType="example"
              emojiSet={emojiSet}
            />
          </div>
          
          <div className="text-center">
            <div className="text-cyan-400 text-xl font-bold mb-2">
              ↓ TRANSFORMS TO ↓
            </div>
          </div>
          
          <div className="text-center">
            <ResponsiveOfficerDisplayGrid
              grid={example.output}
              title="OUTPUT"
              containerType="example"
              emojiSet={emojiSet}
            />
          </div>
        </div>
      </div>
      
      {/* Size Info (development only) - improved styling to prevent overlap */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-slate-400 mt-3 p-2 bg-slate-800 rounded border border-slate-600 text-center font-mono">
          Input: {example.input.length}×{example.input[0]?.length || 0} → 
          Output: {example.output.length}×{example.output[0]?.length || 0}
        </div>
      )}
    </div>
  );
}

export function TrainingExamplesSection({ 
  examples, 
  emojiSet = 'tech_set1', 
  title = '📚 TRAINING EXAMPLES',
  className = ''
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

  return (
    <div className={`bg-slate-800 border border-slate-600 rounded-lg p-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-amber-400 font-semibold flex items-center">
          {title}
        </h2>
        <div className="text-slate-400 text-sm">
          {examples.length} example{examples.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Examples Grid */}
      <div className={`grid gap-6 ${getGridCols()}`}>
        {examples.map((example, index) => (
          <ExampleCard
            key={index}
            example={example}
            index={index}
            emojiSet={emojiSet}
          />
        ))}
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