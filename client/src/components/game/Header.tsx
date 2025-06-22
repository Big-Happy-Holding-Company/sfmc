/**
 * Header Component
 * --------------------------------------------------------
 * Author: Cascade AI
 * Description:
 *   Displays the main game header with player rank, branding, and mission completion stats.
 *   Updated to accept a dynamic `totalTasks` prop so the completed missions count reflects
 *   real data rather than a hard-coded value.
 */
import { RankBadge } from "./RankBadge";
import type { Player } from "@shared/schema";

interface HeaderProps {
  player: Player;
  /** Total number of tasks available in the game */
  totalTasks: number;
}

export function Header({ player, totalTasks }: HeaderProps) {
  return (
    <header className="bg-slate-800 border-b border-cyan-400 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="text-cyan-400 text-2xl">🚀</div>
            <div>
              <h1 className="text-xl font-bold text-cyan-400">Mission Control 2050</h1>
              <p className="text-xs text-amber-400 font-mono">OPERATIONS CENTER</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <RankBadge player={player} />
            
            <div className="bg-slate-900 border border-amber-400 rounded px-3 py-1">
              <div className="text-xs">
                <div className="text-amber-400 font-semibold">Completed Tasks</div>
                <div className="text-slate-400 font-mono">{player.completedMissions}/{totalTasks}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
