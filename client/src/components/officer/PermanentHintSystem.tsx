/**
 * Permanent Hint System
 * =====================
 * Character-based hint system that provides helpful guidance during puzzle solving
 * Features rotating characters and always-available output size hints
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { OfficerTrackPuzzle } from '@/types/arcTypes';

interface PermanentHintSystemProps {
  puzzle: OfficerTrackPuzzle;
  tutorialMode?: boolean;
  className?: string;
}

// =============================================================================
// DESIGNER INPUT: CHARACTER CONFIGURATION
// =============================================================================
// Add or modify characters and their hint specialties here

interface HintCharacter {
  name: string;
  rank: string;
  image: string;
  specialty: string;
  hintTypes: string[];
}

const HINT_CHARACTERS: HintCharacter[] = [
  {
    name: "Yvonne",
    rank: "Cadet",
    image: "/Cadet-Yvonne.PNG",
    specialty: "Pattern Recognition",
    hintTypes: ["pattern", "basic", "tutorial"]
  },
  {
    name: "Wyatt", 
    rank: "Master Chief",
    image: "/master-chief-wyatt.png",
    specialty: "Grid Analysis",
    hintTypes: ["size", "structure", "advanced"]
  },
  {
    name: "Divyapriya",
    rank: "Captain", 
    image: "/captain-divyapriya.PNG",
    specialty: "Strategic Thinking",
    hintTypes: ["strategy", "multi-test", "validation"]
  },
  {
    name: "Kim",
    rank: "Colonel",
    image: "/col-kim.png", 
    specialty: "Problem Solving",
    hintTypes: ["logic", "complex", "troubleshooting"]
  },
  {
    name: "Luz",
    rank: "Lt. Colonel",
    image: "/ltcol-Luz.png",
    specialty: "Training & Development", 
    hintTypes: ["learning", "progression", "motivation"]
  }
];

export function PermanentHintSystem({ puzzle, tutorialMode = false, className = "" }: PermanentHintSystemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [showOutputSizeHint, setShowOutputSizeHint] = useState(true);

  const currentCharacter = HINT_CHARACTERS[currentCharacterIndex];

  // Rotate character every 30 seconds when expanded
  useEffect(() => {
    if (!isExpanded) return;

    const interval = setInterval(() => {
      setCurrentCharacterIndex(prev => (prev + 1) % HINT_CHARACTERS.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [isExpanded]);

  // =============================================================================
  // HINT GENERATION FUNCTIONS
  // =============================================================================

  // Always available: Output size hint from puzzle data
  const getOutputSizeHint = (): string => {
    if (!puzzle.test || puzzle.test.length === 0) return "";
    
    const testCase = puzzle.test[0];
    if (!testCase?.output) return "";
    
    const height = testCase.output.length;
    const width = testCase.output[0]?.length || 0;
    
    return `💡 **Output Size Hint**: The solution grid should be ${width}×${height} (${width} columns, ${height} rows)`;
  };

  // DESIGNER INPUT: Add more hint types here
  const getPatternHints = (): string[] => {
    const hints: string[] = [];
    
    if (puzzle.train && puzzle.train.length > 0) {
      hints.push(`🔍 **Pattern Analysis**: Study all ${puzzle.train.length} training examples to identify the transformation rule`);
      
      // Check for size changes
      const inputSizes = puzzle.train.map(ex => `${ex.input[0]?.length || 0}×${ex.input.length}`);
      const outputSizes = puzzle.train.map(ex => `${ex.output[0]?.length || 0}×${ex.output.length}`);
      
      if (inputSizes[0] !== outputSizes[0]) {
        hints.push(`📏 **Size Changes**: Notice how the grid size changes from input to output`);
      }
    }
    
    return hints;
  };

  const getStrategicHints = (): string[] => {
    const hints: string[] = [];
    
    if (puzzle.test && puzzle.test.length > 1) {
      hints.push(`🎯 **Multi-Test Strategy**: This puzzle has ${puzzle.test.length} test cases - solve them systematically`);
      hints.push(`✅ **Validation Tip**: Complete all test cases before submitting for PlayFab validation`);
    }
    
    return hints;
  };

  const getToolHints = (): string[] => {
    return [
      `🎨 **Tools Available**: Use Copy Input to start, or create from scratch`,
      `🔄 **Display Modes**: Switch between Number, Emoji, or Hybrid view for better pattern recognition`,
      `📐 **Grid Sizing**: Use suggested sizes from training examples when changing output dimensions`
    ];
  };

  // DESIGNER INPUT: Customize hint selection based on character specialty
  const getCurrentHints = (): string[] => {
    const allHints: string[] = [];
    
    // Always include output size hint
    const sizeHint = getOutputSizeHint();
    if (sizeHint) allHints.push(sizeHint);
    
    // Add hints based on character specialty
    switch (currentCharacter.specialty) {
      case "Pattern Recognition":
        allHints.push(...getPatternHints());
        break;
      case "Strategic Thinking":
        allHints.push(...getStrategicHints());
        break;
      case "Grid Analysis":
        allHints.push(...getToolHints());
        break;
      default:
        // Mix of all hint types
        allHints.push(...getPatternHints().slice(0, 1));
        allHints.push(...getStrategicHints().slice(0, 1));
        allHints.push(...getToolHints().slice(0, 1));
    }
    
    return allHints.slice(0, 3); // Limit to 3 hints at a time
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const rotateCharacter = () => {
    setCurrentCharacterIndex(prev => (prev + 1) % HINT_CHARACTERS.length);
  };

  return (
    <div className={`bg-slate-800 border border-slate-600 rounded-lg ${className}`}>
      {/* Compact Hint Bar - Always Visible */}
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={toggleExpanded}>
        <div className="flex items-center space-x-3">
          <img 
            src={currentCharacter.image}
            alt={`${currentCharacter.rank} ${currentCharacter.name}`}
            className="w-8 h-8 rounded-full border-2 border-amber-400"
          />
          <div className="text-amber-400 text-sm font-medium">
            💡 Hints Available ({getCurrentHints().length})
          </div>
          {showOutputSizeHint && (
            <div className="text-slate-300 text-xs truncate max-w-xs">
              {getOutputSizeHint()}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              rotateCharacter();
            }}
            className="text-amber-400 hover:text-amber-300 text-xs"
          >
            🔄 Change Helper
          </Button>
          <div className="text-amber-400">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </div>

      {/* Expanded Hint Panel */}
      {isExpanded && (
        <Card className="bg-slate-900 border-slate-600 m-3">
          <CardContent className="p-4">
            {/* Character Header */}
            <div className="flex items-center space-x-4 mb-4 pb-3 border-b border-slate-600">
              <img 
                src={currentCharacter.image}
                alt={`${currentCharacter.rank} ${currentCharacter.name}`}
                className="w-16 h-16 rounded-full border-4 border-amber-400"
              />
              <div>
                <h3 className="text-amber-400 font-bold text-lg">
                  {currentCharacter.rank} {currentCharacter.name}
                </h3>
                <p className="text-slate-300 text-sm">
                  🎯 Specialty: {currentCharacter.specialty}
                </p>
              </div>
            </div>

            {/* Hints List */}
            <div className="space-y-3">
              <h4 className="text-amber-300 font-semibold">Helpful Hints:</h4>
              {getCurrentHints().map((hint, index) => (
                <div key={index} className="bg-slate-800 p-3 rounded border-l-4 border-amber-400">
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {hint}
                  </p>
                </div>
              ))}
            </div>

            {/* DESIGNER INPUT: Tutorial Mode Special Messages */}
            {tutorialMode && (
              <div className="mt-4 pt-3 border-t border-slate-600">
                <div className="bg-blue-900 border border-blue-600 rounded p-3">
                  <p className="text-blue-300 text-sm">
                    🎓 <strong>Tutorial Mode:</strong> DESIGNER INPUT - Add special tutorial guidance here.
                    This message appears only during the tutorial and can provide context-specific help.
                  </p>
                </div>
              </div>
            )}

            {/* Character Rotation Info */}
            <div className="mt-4 pt-3 border-t border-slate-600">
              <p className="text-slate-400 text-xs">
                💭 Different characters provide different perspectives. 
                Hints rotate automatically every 30 seconds, or click "Change Helper" above.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}