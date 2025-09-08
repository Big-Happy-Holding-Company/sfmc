/**
 * Leaderboard Stats Component
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Single responsibility: Display statistical summary of leaderboard data.
 * Pure UI component that renders stats in a clean, readable format.
 * 
 * HOW IT WORKS:
 * - Receives stats object from parent container
 * - Renders total players, highest score, average, and player position
 * - Handles cases where player is not ranked
 * - Uses consistent styling with project theme
 * 
 * HOW THE PROJECT USES IT:
 * - Used by LeaderboardContainer to show leaderboard overview
 * - Reusable across different leaderboard types
 */

interface LeaderboardStatsProps {
  stats: {
    totalPlayers: number;
    highestScore: number;
    averageScore: number;
    playerRank?: number;
    playerScore?: number;
  };
}

export function LeaderboardStats({ stats }: LeaderboardStatsProps) {
  return (
    <div className="p-6 bg-slate-900/20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.totalPlayers}</div>
          <div className="text-sm text-blue-200">Total Players</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {stats.highestScore.toLocaleString()}
          </div>
          <div className="text-sm text-green-200">Highest Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {stats.averageScore.toLocaleString()}
          </div>
          <div className="text-sm text-yellow-200">Average Score</div>
        </div>
        
        <div className="text-center">
          {stats.playerRank ? (
            <>
              <div className="text-2xl font-bold text-purple-400">
                #{stats.playerRank}
              </div>
              <div className="text-sm text-purple-200">Your Rank</div>
              {stats.playerScore && (
                <div className="text-xs text-purple-300 mt-1">
                  {stats.playerScore.toLocaleString()} pts
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-400">--</div>
              <div className="text-sm text-gray-400">Not Ranked</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
