import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MISSION_CATEGORIES, DIFFICULTY_COLORS } from "@/data/missions";
import { getRankProgress } from "@/data/ranks";
import type { Task, Player } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

interface MissionSelectorProps {
  player: Player;
  missions: Task[];
  onSelectMission: (task: Task) => void;
}

export function MissionSelector({ 
  player, 
  missions, 
  onSelectMission
}: MissionSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { currentRank, nextRank, progress, pointsToNext } = getRankProgress(player.totalPoints);
  
  const availableMissions = missions.filter(mission => 
    mission.requiredRankLevel <= player.rankLevel
  );
  
  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };
  
  // Return missions whose ID starts with the category prefix (e.g. "FS-", "COM-")
  const getCategoryMissions = (categoryId: string) => {
    return availableMissions.filter(mission => mission.id.startsWith(`${categoryId}-`));
  };

  return (
    <div className="space-y-6">
      {/* Mission Categories with Expandable Tasks */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-cyan-400 font-semibold flex items-center">
            <i className="fas fa-clipboard-list mr-2"></i>
            MISSION CONTROL DASHBOARD
          </h2>
          <Link href="/fiq-test">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm px-4 py-2">
              <i className="fas fa-brain mr-2"></i>
              TEST FIQ
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          {MISSION_CATEGORIES.map((category) => {
            const categoryMissions = getCategoryMissions(category.id);
            const hasAvailableMissions = categoryMissions.length > 0;
            const isExpanded = expandedCategories.has(category.id);
            
            return (
              <div key={category.id} className="border border-slate-600 rounded-lg overflow-hidden">
                {/* Category Header */}
                <Button
                  variant="ghost"
                  onClick={() => toggleCategory(category.id)}
                  disabled={!hasAvailableMissions}
                  className={cn(
                    "w-full justify-between p-4 h-auto rounded-none",
                    "bg-slate-700 hover:bg-slate-600 border-0",
                    !hasAvailableMissions && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center">
                    
                    <div className="text-left">
                      <div className="font-semibold text-slate-300">{category.name}</div>
                      <div className="text-xs text-slate-400">{category.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-cyan-400 font-semibold">
                      {categoryMissions.length} {categoryMissions.length === 1 ? 'task' : 'tasks'}
                    </span>
                    {hasAvailableMissions && (
                      isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />
                    )}
                  </div>
                </Button>
                
                {/* Expanded Tasks */}
                {isExpanded && hasAvailableMissions && (
                  <div className="bg-slate-900 p-4 border-t border-slate-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryMissions.map((mission) => {
                        const difficultyColor = DIFFICULTY_COLORS[mission.difficulty] || "slate";
                        const isLocked = mission.requiredRankLevel > player.rankLevel;
                        
                        return (
                          <Button
                            key={mission.id}
                            variant="ghost"
                            onClick={() => {
                              if (!isLocked) {
                                onSelectMission(mission);
                              }
                            }}
                            disabled={isLocked}
                            className={cn(
                              "bg-slate-800 border border-slate-600 rounded p-3 h-auto hover:border-cyan-400 transition-colors duration-200",
                              isLocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="w-full text-left">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm text-slate-300">{mission.title}</h4>
                                <div className={cn(
                                  "text-xs px-2 py-1 rounded",
                                  `bg-${difficultyColor} bg-opacity-20 text-${difficultyColor}`
                                )}>
                                  {mission.difficulty.toUpperCase()}
                                </div>
                              </div>
                              <p className="text-xs text-slate-400 mb-2">
                                {mission.gridSize}×{mission.gridSize} Grid • {mission.basePoints} pts
                              </p>
                              {isLocked ? (
                                <div className="text-xs text-slate-500">🔒 Requires Rank Level {mission.requiredRankLevel}</div>
                              ) : mission.timeLimit ? (
                                <div className="text-xs text-red-400">⏱️ Time Limited</div>
                              ) : (
                                <div className="text-xs text-amber-400">⚡ Speed Bonus Available</div>
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Rank Progress - Moved to Bottom */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
        <h3 className="text-amber-400 font-semibold mb-3 flex items-center">
          <i className="fas fa-chart-line mr-2"></i>
          CADET PROGRESS
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
  );
}
