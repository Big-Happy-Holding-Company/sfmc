/**
 * Leaderboard Container Component
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Single responsibility: Manage leaderboard data fetching and state for a specific type.
 * Coordinates between service layer and display components.
 * 
 * HOW IT WORKS:
 * - Fetches leaderboard data using LeaderboardService
 * - Manages loading and error states
 * - Passes data to LeaderboardTable for display
 * - Handles refresh functionality
 * 
 * HOW THE PROJECT USES IT:
 * - Used by Leaderboards page to display specific leaderboard type
 * - Follows project's local state management pattern
 * - Provides loading states and error handling
 */

import { useState, useEffect } from "react";
import { leaderboards } from "@/services/playfab/leaderboards";
import { LeaderboardTable } from "./LeaderboardTable";
import { LeaderboardStats } from "./LeaderboardStats";
import { LeaderboardType, getLeaderboardConfig } from "@/services/playfab/leaderboard-types";
import type { LeaderboardEntry } from "@/types/playfab";

interface LeaderboardContainerProps {
  type: LeaderboardType;
}

interface LeaderboardStats {
  totalPlayers: number;
  highestScore: number;
  averageScore: number;
  playerRank?: number;
  playerScore?: number;
}

export function LeaderboardContainer({ type }: LeaderboardContainerProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const config = getLeaderboardConfig(type);

  const loadLeaderboard = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [leaderboardData, statsData] = await Promise.all([
        refresh 
          ? leaderboards.refreshLeaderboard(type, 20)
          : leaderboards.getLeaderboard(type, 20),
        leaderboards.getLeaderboardStats(type)
      ]);

      setEntries(leaderboardData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [type]);

  const handleRefresh = () => {
    loadLeaderboard(true);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/30 rounded-lg p-8 backdrop-blur-sm">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⭐</div>
          <div className="text-white text-lg">Loading {config.displayName}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-8 backdrop-blur-sm">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
          <div className="text-red-200 mb-4">{error}</div>
          <button
            onClick={() => loadLeaderboard()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/30 rounded-lg backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {config.icon && <span>{config.icon}</span>}
                {config.displayName}
              </h2>
              <p className="text-blue-200 mt-1">{config.description}</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {stats && <LeaderboardStats stats={stats} />}
        
        <LeaderboardTable entries={entries} />
      </div>
    </div>
  );
}
