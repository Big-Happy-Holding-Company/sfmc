/**
 * Leaderboard Tabs Component
 * Author: Cascade
 * Date: 2025-09-07
 * 
 * PURPOSE:
 * Single responsibility: Render tab navigation for leaderboard types.
 * No business logic, pure UI component that handles tab switching.
 * 
 * HOW IT WORKS:
 * - Receives available leaderboards from parent
 * - Renders tabs with icons and display names
 * - Calls parent callback when tab is selected
 * - Highlights currently selected tab
 * 
 * HOW THE PROJECT USES IT:
 * - Used by Leaderboards page for navigation between Officer Track and Global
 * - Fully configurable via props, no hardcoded leaderboard types
 */

import { LeaderboardType, type LeaderboardConfig } from "@/services/playfab/leaderboard-types";

interface LeaderboardTabsProps {
  availableLeaderboards: LeaderboardConfig[];
  selectedType: LeaderboardType;
  onTabChange: (type: LeaderboardType) => void;
}

export function LeaderboardTabs({ 
  availableLeaderboards, 
  selectedType, 
  onTabChange 
}: LeaderboardTabsProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-slate-800/50 rounded-lg p-1 backdrop-blur-sm">
        {availableLeaderboards.map((config) => (
          <button
            key={config.type}
            onClick={() => onTabChange(config.type)}
            className={`
              px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2
              ${selectedType === config.type
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-blue-200 hover:text-white hover:bg-slate-700/50'
              }
            `}
          >
            {config.icon && <span className="text-lg">{config.icon}</span>}
            <span>{config.displayName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
