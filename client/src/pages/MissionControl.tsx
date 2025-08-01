/**
 * MissionControl Page (Game Interface)
 * --------------------------------------------------------
 * Author: Cascade AI
 * Description:
 *   Handles the core game UI including mission selection, grid interaction,
 *   timer controls, and hint system. This modification enhances the hint UI:
 *     - Removes explicit point penalty text from the hint button and guidance.
 *     - Displays Sergeant Wyatt avatar alongside hint header and each hint
 *       message to create a narrative delivery experience.
 *   All functionality remains unchanged aside from visual/UX updates.
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Header } from "@/components/game/Header";
import { MissionSelector } from "@/components/game/MissionSelector";
import { Timer } from "@/components/game/Timer";
import { SpeedTimer } from "@/components/game/SpeedTimer";
import { InteractiveGrid } from "@/components/game/InteractiveGrid";
import { ResultModal } from "@/components/game/ResultModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SPACE_EMOJIS } from "@/constants/spaceEmojis";
import type { Task, Player } from "@shared/schema";
import type { GameResult, MissionExample } from "@/types/game";
import type { EmojiSet } from "@/constants/spaceEmojis";

export default function MissionControl() {
  // State management


  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [playerGrid, setPlayerGrid] = useState<string[][]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);

  // Create default player on load
  const createPlayerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/players", { username: "Wyatt" });
      return response.json();
    },
    onSuccess: (player: Player) => {
      setCurrentPlayer(player);
    },
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !!currentPlayer,
  });

  // Validate solution mutation
  const validateSolutionMutation = useMutation({
    mutationFn: async ({ playerId, taskId, solution, timeElapsed, hintsUsed }: {
      playerId: number;
      taskId: string;
      solution: string[][];
      timeElapsed?: number;
      hintsUsed?: number;
    }) => {
      const response = await apiRequest("POST", `/api/players/${playerId}/validate-solution`, {
        taskId,
        solution,
        timeElapsed,
        hintsUsed,
      });
      return response.json();
    },
    onSuccess: (result: GameResult) => {
      setGameResult(result);
      setShowResult(true);
      setIsTimerActive(false);
      
      // Refresh player data
      if (result.correct && currentPlayer) {
        queryClient.invalidateQueries({ queryKey: [`/api/players/${currentPlayer.id}`] });
      }
    },
  });

  // Initialize player on mount
  useEffect(() => {
    if (!currentPlayer) {
      createPlayerMutation.mutate();
    }
  }, []);

  // Fetch updated player data
  const { data: updatedPlayer } = useQuery<Player>({
    queryKey: [`/api/players/${currentPlayer?.id}`],
    enabled: !!currentPlayer,
  });

  const activePlayer = updatedPlayer || currentPlayer;

  const handleSelectTask = (task: Task) => {
    setCurrentTask(task);
    setStartTime(Date.now());
    setIsTimerActive(true); // Always start timer for speed tracking
    
    // Reset hint state
    setHintsUsed(0);
    setCurrentHintIndex(-1);
    
    // Initialize empty grid
    const emptyGrid = Array(task.gridSize).fill(null).map(() => 
      Array(task.gridSize).fill(SPACE_EMOJIS[task.emojiSet as EmojiSet][0])
    );
    setPlayerGrid(emptyGrid);
  };

  const handleSolveTask = () => {
    if (!currentTask || !activePlayer || !startTime) return;
    
    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    
    validateSolutionMutation.mutate({
      playerId: activePlayer.id,
      taskId: currentTask.id,
      solution: playerGrid,
      timeElapsed,
      hintsUsed,
    });
  };

  const handleTimeUp = () => {
    // Auto-submit when time runs out
    if (currentTask && activePlayer) {
      handleSolveTask();
    }
  };

  const handleUseHint = () => {
    if (!currentTask || !currentTask.hints || !Array.isArray(currentTask.hints)) return;
    
    const nextHintIndex = currentHintIndex + 1;
    if (nextHintIndex < currentTask.hints.length) {
      setCurrentHintIndex(nextHintIndex);
      setHintsUsed(hintsUsed + 1);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setGameResult(null);
    setCurrentTask(null);
    setPlayerGrid([]);
    setStartTime(null);
    setIsTimerActive(false);
  };

  const renderExampleGrid = (grid: string[][], title: string) => (
    <div>
      <div className="text-xs text-slate-400 mb-2 text-center">{title}</div>
      <div 
        className="grid gap-1 bg-slate-800 p-2 rounded"
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 1}, 1fr)` }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded text-lg"
            >
              {cell}
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (!activePlayer) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading Operations Center...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "20px 20px"
          }}
        />
      </div>



      <Header player={activePlayer} totalTasks={tasks.length} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!currentTask ? (
          <MissionSelector
            player={activePlayer}
            missions={tasks}
            onSelectMission={handleSelectTask}
          />
        ) : (
          <div className="space-y-6">
            {/* Active Mission Panel */}
            <Card className="bg-slate-800 border-cyan-400">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-cyan-400 mb-1">
                      TASK {currentTask.id}: {currentTask.title}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Difficulty: <span className="text-green-400">{currentTask.difficulty}</span> • 
                      Grid: <span className="text-amber-400">{currentTask.gridSize}×{currentTask.gridSize}</span>
                      {currentTask.timeLimit && (
                        <span> • Time Limit: <span className="text-red-400">{currentTask.timeLimit}s</span></span>
                      )}
                    </p>
                  </div>
                  
                  {/* Show countdown timer only for advanced tasks with time limits, otherwise show speed timer */}
                  {currentTask.timeLimit ? (
                    <Timer
                      initialTime={currentTask.timeLimit}
                      onTimeUp={handleTimeUp}
                      isActive={isTimerActive}
                    />
                  ) : (
                    <SpeedTimer isActive={isTimerActive} />
                  )}
                </div>
                
                <div className="bg-slate-900 border border-slate-600 rounded p-4 mb-6">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="text-amber-400 font-semibold">Task Brief:</span> 
                    {currentTask.description}
                  </p>
                </div>
                
                {/* Example Transformations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {((currentTask.examples || []) as MissionExample[]).map((example, index) => (
                    <div key={index} className="bg-slate-900 border border-slate-600 rounded p-4">
                      <h3 className="text-green-400 font-semibold mb-3 flex items-center">
                        <i className="fas fa-eye mr-2"></i>
                        EXAMPLE {index + 1}
                      </h3>
                      
                      <div className="flex items-center justify-center space-x-4">
                        {renderExampleGrid(example.input, "INPUT")}
                        <div className="text-cyan-400 text-xl">→</div>
                        {renderExampleGrid(example.output, "OUTPUT")}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Hints Section */}
                {currentTask.hints && Array.isArray(currentTask.hints) && currentTask.hints.length > 0 && (
                  <div className="bg-slate-800 border border-yellow-500 rounded p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-yellow-400 font-semibold flex items-center">
                        <img src="/wyatt-space-force.jpg" alt="Sgt Wyatt" className="w-10 h-10 rounded-full border-2 border-cyan-400 mr-2" />
                        <i className="fas fa-lightbulb mr-2"></i>
                        MISSION HINTS ({hintsUsed}/{currentTask.hints.length})
                      </h3>
                      {currentHintIndex < currentTask.hints.length - 1 && (
                        <Button
                          onClick={handleUseHint}
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-slate-900"
                        >
                          <i className="fas fa-lightbulb mr-1"></i>
                          GET HINT
                        </Button>
                      )}
                    </div>
                    
                    {currentHintIndex >= 0 && (
                      <div className="space-y-2">
                        {currentTask.hints.slice(0, currentHintIndex + 1).map((hint, index) => (
                          <div key={index} className="bg-slate-700 p-3 rounded border-l-4 border-yellow-400">
                            <div className="text-xs text-yellow-400 mb-1">HINT {index + 1}</div>
                            <div className="flex items-start space-x-2">
                              <img src="/wyatt-space-force.jpg" alt="Sgt Wyatt" className="w-8 h-8 rounded-full border-2 border-cyan-400" />
                              <span className="text-slate-200 text-sm">{hint}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {currentHintIndex === -1 && (
                      <div className="flex items-center text-slate-400 text-sm italic">
                        <img src="/wyatt-space-force.jpg" alt="Sgt Wyatt" className="w-8 h-8 rounded-full border-2 border-cyan-400 mr-2" />
                        Click 'GET HINT' and Sergeant Wyatt will guide you through the mission.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Interactive Test Grid */}
                <div className="bg-slate-900 border border-amber-400 rounded p-4">
                  <h3 className="text-amber-400 font-semibold mb-3 flex items-center">
                    <i className="fas fa-crosshairs mr-2"></i>
                    YOUR TASK: SOLVE THE PATTERN
                  </h3>
                  
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <div>
                      {renderExampleGrid(currentTask.testInput as string[][], "TEST INPUT")}
                    </div>
                    
                    <div className="text-cyan-400 text-2xl">→</div>
                    
                    <div>
                      <div className="text-xs text-slate-400 mb-2 text-center">YOUR OUTPUT</div>
                      <InteractiveGrid
                        gridSize={currentTask.gridSize}
                        emojiSet={currentTask.emojiSet as EmojiSet}
                        onGridChange={setPlayerGrid}
                        disabled={validateSolutionMutation.isPending}
                        inputGrid={currentTask.testInput as string[][]}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={handleSolveTask}
                      disabled={validateSolutionMutation.isPending}
                      className="bg-green-400 hover:bg-green-500 text-slate-900"
                    >
                      <i className="fas fa-check mr-2"></i>EXECUTE TASK
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCloseResult()}
                      className="bg-red-500 hover:bg-red-600 text-slate-50 border-red-500"
                    >
                      <i className="fas fa-arrow-left mr-2"></i>BACK TO QUEUE
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <ResultModal
        open={showResult}
        onClose={handleCloseResult}
        onRetry={() => setShowResult(false)}
        result={gameResult}
      />
    </div>
  );
}
