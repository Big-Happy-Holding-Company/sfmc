/**
 * LLM Comparison Page
 * Wrapper page for the LLM comparison selector component
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/game/Header';
import { LLMComparisonSelector } from '@/components/officer/LLMComparisonSelector';
import type { AIPuzzlePerformance } from '@/services/arcExplainerAPI';

export function LLMComparisonPage() {
  const [location, setLocation] = useLocation();

  const handlePuzzleSelect = (puzzleId: string, aiPerformance: AIPuzzlePerformance) => {
    // Navigate to solve this puzzle
    setLocation(`/officer-track/solve/${puzzleId}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-amber-400 mb-4">
              🤖 AI vs Human Challenge
            </h1>
            <p className="text-slate-300">
              Select puzzles where AI models struggled or failed completely. 
              Can you solve what AI couldn't? All data comes from real AI performance testing.
            </p>
          </div>

          <LLMComparisonSelector 
            onPuzzleSelect={handlePuzzleSelect}
            className="mb-8"
          />

          <div className="text-center">
            <button
              onClick={() => setLocation('/officer-track')}
              className="px-4 py-2 bg-slate-700 border border-amber-700 rounded text-amber-400 hover:bg-slate-600 hover:border-amber-500 transition-colors"
            >
              ← Back to Officer Track
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}