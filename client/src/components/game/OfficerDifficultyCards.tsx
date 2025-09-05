/**
 * Officer Difficulty Cards Component
 * 
 * Shows AI difficulty statistics from arc-explainer API
 * Displays trustworthiness data for officer training curation
 * 
 * Uses existing SFMC component patterns and shadcn/ui
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brain, Zap, AlertTriangle, Target } from "lucide-react";
import { useDifficultyStats } from "@/hooks/useWorstPerformingPuzzles";

interface OfficerDifficultyCardsProps {
  onCategorySelect: (category: 'impossible' | 'extremely_hard' | 'very_hard' | 'challenging') => void;
  selectedCategory?: string;
}

export function OfficerDifficultyCards({ 
  onCategorySelect, 
  selectedCategory 
}: OfficerDifficultyCardsProps) {
  
  const { stats, isLoading, error, refetch } = useDifficultyStats();

  if (error) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-red-400 font-semibold mb-2">Failed to Load AI Difficulty Data</h3>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <Button onClick={refetch} variant="outline" size="sm">
            <i className="fas fa-redo mr-2"></i>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const difficultyCategories = [
    {
      id: 'impossible' as const,
      name: 'Impossible for AI',
      icon: <Brain className="h-6 w-6 text-red-500" />,
      emoji: '🤖❌',
      count: stats.impossible,
      description: '0% AI Success Rate',
      subtitle: 'Ultimate Challenge',
      bgColor: 'bg-red-900 bg-opacity-20',
      borderColor: 'border-red-500',
      textColor: 'text-red-400',
      hoverColor: 'hover:bg-red-900 hover:bg-opacity-30'
    },
    {
      id: 'extremely_hard' as const,
      name: 'Extremely Hard',
      icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
      emoji: '🤖😰',
      count: stats.extremely_hard,
      description: '0-25% AI Success Rate',
      subtitle: 'Advanced Training',
      bgColor: 'bg-orange-900 bg-opacity-20',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-400',
      hoverColor: 'hover:bg-orange-900 hover:bg-opacity-30'
    },
    {
      id: 'very_hard' as const,
      name: 'Very Hard',
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      emoji: '🤖😅',
      count: stats.very_hard,
      description: '25-50% AI Success Rate',
      subtitle: 'Expert Level',
      bgColor: 'bg-yellow-900 bg-opacity-20',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-400',
      hoverColor: 'hover:bg-yellow-900 hover:bg-opacity-30'
    },
    {
      id: 'challenging' as const,
      name: 'Challenging',
      icon: <Target className="h-6 w-6 text-blue-500" />,
      emoji: '🤖🤔',
      count: stats.challenging,
      description: '50-75% AI Success Rate',
      subtitle: 'Officer Training',
      bgColor: 'bg-blue-900 bg-opacity-20',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-400',
      hoverColor: 'hover:bg-blue-900 hover:bg-opacity-30'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-cyan-400 font-semibold flex items-center">
            <Brain className="mr-2" />
            AI DIFFICULTY ANALYSIS
          </h2>
          <div className="text-slate-400 text-sm">
            Total Analyzed: {stats.total.toLocaleString()} puzzles
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-700 border border-slate-600 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-slate-600 rounded mb-3"></div>
                <div className="h-8 bg-slate-600 rounded mb-2"></div>
                <div className="h-4 bg-slate-600 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {difficultyCategories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                onClick={() => onCategorySelect(category.id)}
                className={cn(
                  "h-auto p-4 flex flex-col items-center space-y-3 transition-all duration-200",
                  category.bgColor,
                  "border border-slate-600",
                  category.hoverColor,
                  selectedCategory === category.id && `${category.borderColor} ${category.bgColor}`
                )}
              >
                {/* Icon and Emoji */}
                <div className="flex items-center space-x-2">
                  {category.icon}
                  <span className="text-2xl">{category.emoji}</span>
                </div>

                {/* Category Name */}
                <h3 className={cn("font-semibold text-center", category.textColor)}>
                  {category.name}
                </h3>

                {/* Count */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-200">
                    {category.count.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400">puzzles</div>
                </div>

                {/* Description */}
                <div className="text-center space-y-1">
                  <div className="text-xs text-slate-400">
                    {category.description}
                  </div>
                  <div className={cn("text-xs font-medium", category.textColor)}>
                    {category.subtitle}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>
            Data from arc-explainer AI performance analysis • Updated in real-time
          </p>
          <p className="mt-1">
            <span className="text-red-400">Red puzzles</span> represent the ultimate test of human reasoning beyond AI capabilities
          </p>
        </div>
      </div>
    </div>
  );
}