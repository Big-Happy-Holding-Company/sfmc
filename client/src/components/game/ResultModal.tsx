/**
 * ResultModal Component
 * --------------------------------------------------------
 * Author: Cascade AI
 * Description: 
 *   Shows the result of puzzle attempt with Sgt Wyatt providing encouragement.
 *   For incorrect solutions, allows the player to try again without penalty.
 *   For correct solutions, displays score information and congratulations.
 */
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GameResult } from "@/types/game";

interface ResultModalProps {
  open: boolean;
  onClose: () => void;
  result: GameResult | null;
  
  /**
   * Optional retry handler that allows player to try the puzzle again
   * Returns to puzzle view instead of queue screen
   */
  onRetry?: () => void;
}

export function ResultModal({ open, onClose, result, onRetry }: ResultModalProps) {
  if (!result?.success) return null;

  const isSuccess = result.correct;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-800 border border-slate-600 text-slate-50">
        <div className="text-center space-y-4">
          <img 
            src="/wyatt-space-force.jpg" 
            alt="Sgt Wyatt" 
            className={`mx-auto w-24 h-24 rounded-full border-4 ${isSuccess ? 'border-green-400' : 'border-amber-400'} object-cover`} 
          />
          <div className={`text-4xl mb-4 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
            {isSuccess ? '✅' : '❌'}
          </div>
          
          <h3 className={`text-xl font-bold mb-2 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
            {isSuccess ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
          </h3>
          
          <p className="text-slate-300 mb-4">
            {isSuccess 
              ? 'Excellent pattern recognition, Cadet! Your visual analysis skills are impressive.' 
              : "Don't worry, Cadet! Even the best Space Force operatives face challenges. Let's try a different approach!"
            }
          </p>
          
          {isSuccess && result.basePoints && (
            <div className="bg-slate-900 border border-slate-600 rounded p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-amber-400 font-semibold">Base Points</div>
                  <div className="text-slate-300">{result.basePoints}</div>
                </div>
                <div>
                  <div className="text-amber-400 font-semibold">Speed Bonus</div>
                  <div className="text-slate-300">+{result.speedBonus || 0}</div>
                </div>
                {result.hintPenalty && result.hintPenalty > 0 && (
                  <div>
                    <div className="text-yellow-400 font-semibold">Hint Penalty</div>
                    <div className="text-slate-300">-{result.hintPenalty}</div>
                  </div>
                )}
                {result.hintsUsed && result.hintsUsed > 0 && (
                  <div>
                    <div className="text-yellow-400 font-semibold">Hints Used</div>
                    <div className="text-slate-300">{result.hintsUsed}</div>
                  </div>
                )}
                <div className="col-span-2 border-t border-slate-600 pt-2">
                  <div className="text-green-400 font-semibold text-lg">
                    Total: <span>{result.totalPoints} pts</span>
                  </div>
                </div>
              </div>
              
              {result.rankUp && (
                <div className="mt-4 p-2 bg-green-400 bg-opacity-20 border border-green-400 rounded">
                  <div className="text-green-400 font-semibold">🎉 RANK UP!</div>
                  <div className="text-sm text-slate-300">Promoted to {result.newRank}</div>
                </div>
              )}
            </div>
          )}
          
                    {isSuccess ? (
            <Button 
              onClick={onClose}
              className="bg-cyan-400 hover:bg-blue-500 text-slate-900 font-semibold py-2 px-6"
            >
              CONTINUE
            </Button>
          ) : (
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={onRetry || onClose}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold py-2 px-6"
              >
                TRY AGAIN
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="border-slate-400 text-slate-200 hover:bg-slate-700"
              >
                BACK TO QUEUE
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
