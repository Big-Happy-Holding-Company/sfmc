/**
 * Leaderboard Table Component
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Single responsibility: Render leaderboard entries in a table format.
 * Pure UI component that displays player data without business logic.
 * 
 * HOW IT WORKS:
 * - Receives array of LeaderboardEntry from parent
 * - Renders table header and player rows using PlayerRow component
 * - Handles empty state when no entries available
 * - Uses consistent styling with project theme
 * 
 * HOW THE PROJECT USES IT:
 * - Used by LeaderboardContainer to display player rankings
 * - Delegates individual row rendering to PlayerRow component (SRP)
 */

import { PlayerRow } from "./PlayerRow";
import type { LeaderboardEntry } from "@/types/playfab";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 text-lg mb-2">📊</div>
        <div className="text-gray-400">No rankings available yet</div>
        <div className="text-gray-500 text-sm mt-1">
          Be the first to earn points and claim your spot!
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left py-3 px-6 text-blue-200 font-medium">Rank</th>
            <th className="text-left py-3 px-6 text-blue-200 font-medium">Player</th>
            <th className="text-right py-3 px-6 text-blue-200 font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <PlayerRow 
              key={entry.PlayFabId} 
              entry={entry} 
              isEven={index % 2 === 0}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
