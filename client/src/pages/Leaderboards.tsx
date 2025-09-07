/**
 * Leaderboards Page
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Single responsibility: Display leaderboard interface and coordinate user interactions.
 * Clean page-level component that orchestrates leaderboard display without business logic.
 * 
 * HOW IT WORKS:
 * - Uses LeaderboardService for all data operations
 * - Renders modular components for different leaderboard types
 * - Handles user navigation between Officer Track and Global leaderboards
 * - Maintains simple state for current view selection
 * 
 * HOW THE PROJECT USES IT:
 * - Main leaderboards interface accessed via /leaderboards route
 * - Integrates with existing PlayFab service architecture
 * - Follows project's local state management pattern (no React Query)
 */

import { useState, useEffect } from "react";
import { Header } from "@/components/game/Header";
import { LeaderboardContainer } from "@/components/leaderboards/LeaderboardContainer";
import { LeaderboardTabs } from "@/components/leaderboards/LeaderboardTabs";
import { LeaderboardType, getEnabledLeaderboards } from "@/services/playfab/leaderboard-types";
import { playFabService } from "@/services/playfab";
import type { LeaderboardConfig } from "@/services/playfab/leaderboard-types";
import type { PlayFabPlayer } from "@/services/playfab";

export default function Leaderboards() {
  const [selectedType, setSelectedType] = useState<LeaderboardType>(LeaderboardType.OFFICER_TRACK);
  const [availableLeaderboards, setAvailableLeaderboards] = useState<LeaderboardConfig[]>([]);
  const [player, setPlayer] = useState<PlayFabPlayer | null>(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        // Get available leaderboard configurations
        const leaderboards = getEnabledLeaderboards();
        setAvailableLeaderboards(leaderboards);
        
        // Set default to Officer Track (priority #1) or first available
        const defaultType = leaderboards.find(lb => lb.type === LeaderboardType.OFFICER_TRACK)?.type 
          || leaderboards[0]?.type 
          || LeaderboardType.GLOBAL;
        
        setSelectedType(defaultType);

        // Load player data for Header component
        const [playerData, tasksData] = await Promise.all([
          playFabService.getPlayerData(),
          playFabService.getAllTasks()
        ]);

        setPlayer(playerData);
        setTotalTasks(tasksData.length);
      } catch (error) {
        console.error('Failed to load page data:', error);
        // Set minimal values if loading fails
        setPlayer({ 
          id: 'unknown', 
          username: 'Officer', 
          rank: 'Cadet', 
          rankLevel: 1, 
          totalPoints: 0, 
          completedMissions: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setTotalTasks(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadPageData();
  }, []);

  const handleTabChange = (type: LeaderboardType) => {
    setSelectedType(type);
  };

  if (isLoading || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-white text-lg">Loading leaderboards...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Header player={player} totalTasks={totalTasks} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏆 Space Force Leaderboards
          </h1>
          <p className="text-blue-200 text-lg">
            See how you rank among the galaxy's finest
          </p>
        </div>

        <LeaderboardTabs
          availableLeaderboards={availableLeaderboards}
          selectedType={selectedType}
          onTabChange={handleTabChange}
        />

        <LeaderboardContainer
          type={selectedType}
          key={selectedType} // Force re-render when type changes
        />
      </div>
    </div>
  );
}
