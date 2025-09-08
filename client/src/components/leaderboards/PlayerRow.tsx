/**
 * Player Row Component
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Single responsibility: Render individual player entry in leaderboard table.
 * Pure UI component focused solely on displaying one player's data.
 * 
 * HOW IT WORKS:
 * - Receives LeaderboardEntry and styling props from parent table
 * - Renders rank, player name, and score with appropriate styling
 * - Highlights current player's row if it matches their PlayFabId
 * - Uses alternating row colors for readability
 * 
 * HOW THE PROJECT USES IT:
 * - Used by LeaderboardTable to render each player row
 * - Reusable across all leaderboard types
 * - Handles rank badges and score formatting consistently
 */

import { playFabAuth } from "@/services/playfab/auth";
import type { LeaderboardEntry } from "@/types/playfab";

interface PlayerRowProps {
  entry: LeaderboardEntry;
  isEven: boolean;
}

export function PlayerRow({ entry, isEven }: PlayerRowProps) {
  const currentPlayerId = playFabAuth.getPlayFabId();
  const isCurrentPlayer = entry.PlayFabId === currentPlayerId;

  const getRankBadge = (position: number) => {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  const getMilestoneMessage = (score: number) => {
    if (score >= 100000) return "🚀 COSMIC LEGEND!";
    if (score >= 50000) return "⭐ STELLAR CHAMPION!";
    if (score >= 20000) return "🌟 RISING STAR!";
    if (score >= 10000) return "✨ ELITE OFFICER!";
    return null;
  };

  const rowClasses = `
    transition-colors duration-200 border-b border-slate-700/30
    ${isCurrentPlayer 
      ? 'bg-blue-900/30 hover:bg-blue-900/40' 
      : isEven 
        ? 'bg-slate-800/20 hover:bg-slate-800/40' 
        : 'hover:bg-slate-800/20'
    }
  `;

  return (
    <tr className={rowClasses}>
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8">
            {getRankBadge(entry.Position) || (
              <span className={`
                text-sm font-bold
                ${isCurrentPlayer ? 'text-blue-300' : 'text-gray-400'}
              `}>
                #{entry.Position}
              </span>
            )}
          </div>
        </div>
      </td>
      
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${isCurrentPlayer 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-600 text-slate-200'
            }
          `}>
            {entry.DisplayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={`
              font-medium
              ${isCurrentPlayer ? 'text-blue-200' : 'text-white'}
            `}>
              {entry.DisplayName}
              {isCurrentPlayer && (
                <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">
                  YOU
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      
      <td className="py-4 px-6 text-right">
        <div className={`
          text-lg font-bold
          ${isCurrentPlayer ? 'text-blue-300' : 'text-green-400'}
        `}>
          {formatScore(entry.StatValue)}
        </div>
        <div className="text-xs text-gray-400">points</div>
        {getMilestoneMessage(entry.StatValue) && (
          <div className="text-xs text-yellow-400 font-semibold mt-1 animate-pulse">
            {getMilestoneMessage(entry.StatValue)}
          </div>
        )}
      </td>
      <td className="py-4 px-6 text-right">
        <div className={`
          text-sm font-medium
          ${isCurrentPlayer ? 'text-blue-300' : 'text-gray-500'}
        `}>
          {entry.AttemptCount !== undefined ? entry.AttemptCount : '-'}
        </div>
        <div className="text-xs text-gray-400">attempts</div>
      </td>
    </tr>
  );
}
