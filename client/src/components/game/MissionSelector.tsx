import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MISSION_CATEGORIES, DIFFICULTY_COLORS } from "@/data/missions";
import { getRankProgress } from "@/data/ranks";
import type { Task, Player } from "@shared/schema";
import { cn } from "@/lib/utils";

interface MissionSelectorProps {
  player: Player;
  missions: Task[];
  onSelectMission: (task: Task) => void;
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
}

export function MissionSelector({ 
  player, 
  missions, 
  onSelectMission, 
  selectedCategory,
  onSelectCategory 
}: MissionSelectorProps) {
  const { currentRank, nextRank, progress, pointsToNext } = getRankProgress(player.totalPoints);
  
  const availableMissions = missions.filter(mission => 
    mission.requiredRankLevel <= player.rankLevel
  );
  
  const selectedCategoryMissions = selectedCategory 
    ? availableMissions.filter(mission => mission.category === selectedCategory)
    : availableMissions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Mission Categories Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 mb-6">
          <h2 className="text-cyan-400 font-semibold mb-4 flex items-center">
            <i className="fas fa-clipboard-list mr-2"></i>
            TASK CATEGORIES
          </h2>
          
          <div className="space-y-2">
            {MISSION_CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.name;
              const hasAvailableMissions = availableMissions.some(m => m.category === category.name);
              
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "ghost"}
                  onClick={() => onSelectCategory(category.name)}
                  disabled={!hasAvailableMissions}
                  className={cn(
                    "w-full justify-start p-3 h-auto",
                    isSelected 
                      ? "bg-cyan-400 bg-opacity-20 border border-cyan-400 hover:bg-opacity-30" 
                      : "bg-slate-700 border border-slate-600 hover:bg-slate-600",
                    !hasAvailableMissions && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="text-left">
                    <div className={cn(
                      "font-semibold text-sm",
                      isSelected ? "text-cyan-400" : "text-slate-300"
                    )}>
                      {category.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{category.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Rank Progress */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
          <h3 className="text-amber-400 font-semibold mb-3 flex items-center">
            <i className="fas fa-chart-line mr-2"></i>
            RANK PROGRESS
          </h3>
          
          <div className="space-y-3">
            {nextRank ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Next Rank</span>
                  <span className="text-xs text-green-400 font-semibold">
                    {nextRank.icon} {nextRank.name}
                  </span>
                </div>
                
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">
                    {player.totalPoints.toLocaleString()} / {nextRank.threshold.toLocaleString()} pts
                  </span>
                  <span className="text-green-400">{Math.round(progress)}%</span>
                </div>
              </>
            ) : (
              <div className="text-center">
                <span className="text-green-400 font-semibold">Maximum Rank Achieved</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mission Queue */}
      <div className="lg:col-span-3">
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
          <h3 className="text-slate-300 font-semibold mb-4 flex items-center">
            <i className="fas fa-tasks mr-2"></i>
            {selectedCategory ? `${selectedCategory} TASKS` : 'TASK QUEUE'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedCategoryMissions.map((mission) => {
              const difficultyColor = DIFFICULTY_COLORS[mission.difficulty] || "slate";
              const isLocked = mission.requiredRankLevel > player.rankLevel;
              
              return (
                <Button
                  key={mission.id}
                  variant="ghost"
                  onClick={() => !isLocked && onSelectMission(mission)}
                  disabled={isLocked}
                  className={cn(
                    "bg-slate-900 border border-slate-600 rounded p-3 h-auto hover:border-cyan-400 transition-colors duration-200",
                    isLocked && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="w-full text-left">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`text-${difficultyColor} text-lg`}>
                        {mission.category.includes('O₂') ? '🛡️' : 
                         mission.category.includes('Pre-Launch') ? '🚀' :
                         mission.category.includes('Fuel') ? '⚡' : '🎖️'}
                      </div>
                      <div className={cn(
                        "text-xs px-2 py-1 rounded",
                        `bg-${difficultyColor} bg-opacity-20 text-${difficultyColor}`
                      )}>
                        {mission.difficulty.toUpperCase()}
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm text-slate-300 mb-1">{mission.title}</h4>
                    <p className="text-xs text-slate-400 mb-2">
                      {mission.gridSize}×{mission.gridSize} Grid • {mission.basePoints} pts
                    </p>
                    {isLocked ? (
                      <div className="text-xs text-slate-500">🔒 Requires Rank Level {mission.requiredRankLevel}</div>
                    ) : mission.timeLimit ? (
                      <div className="text-xs text-amber-400">⚡ Speed Bonus Available</div>
                    ) : (
                      <div className="text-xs text-slate-400">No Time Limit</div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
          
          {selectedCategoryMissions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate-400 text-lg mb-2">No tasks available</div>
              <div className="text-slate-500 text-sm">
                {selectedCategory ? 'Select a different category or increase your rank' : 'Complete tasks to unlock more'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
