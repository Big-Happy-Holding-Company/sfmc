import { RANK_ICONS } from "@/data/missions";
import type { Player } from "@shared/schema";

interface RankBadgeProps {
  player: Player;
}

export function RankBadge({ player }: RankBadgeProps) {
  const rankIcon = RANK_ICONS[player.rank] || "🪖";
  
  return (
    <div className="bg-slate-900 border border-green-400 rounded px-3 py-1">
      <div className="flex items-center space-x-2">
        <span className="text-green-400">{rankIcon}</span>
        <div className="text-xs">
          <div className="text-green-400 font-semibold">{player.rank}</div>
          <div className="text-slate-400 font-mono">{player.totalPoints.toLocaleString()} pts</div>
        </div>
      </div>
    </div>
  );
}
