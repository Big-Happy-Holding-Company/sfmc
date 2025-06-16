import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPlayerSchema, 
  updatePlayerSchema,
  insertGameStateSchema,
  updateGameStateSchema,
  insertPlayerTaskSchema
} from "@shared/schema";
import { z } from "zod";

const validateSolutionSchema = z.object({
  taskId: z.string(),
  solution: z.array(z.array(z.string())),
  timeElapsed: z.number().optional(),
});

const createDefaultPlayerSchema = z.object({
  username: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Player operations
  app.post("/api/players", async (req, res) => {
    try {
      const { username } = createDefaultPlayerSchema.parse(req.body);
      
      // Create a default player without requiring a user account
      const player = await storage.createPlayer({
        userId: null,
        rank: "Specialist 1",
        rankLevel: 1,
        totalPoints: 0,
        completedMissions: 0,
        currentTask: null,
      });
      
      res.json(player);
    } catch (error) {
      res.status(400).json({ message: "Invalid request", error });
    }
  });

  app.get("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const player = await storage.getPlayer(id);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.json(player);
    } catch (error) {
      res.status(400).json({ message: "Invalid player ID" });
    }
  });

  app.patch("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updatePlayerSchema.parse(req.body);
      
      const player = await storage.updatePlayer(id, updates);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.json(player);
    } catch (error) {
      res.status(400).json({ message: "Invalid request", error });
    }
  });

  // Task operations
  app.get("/api/tasks", async (req, res) => {
    try {
      const { category, rankLevel } = req.query;
      
      let tasks;
      if (category) {
        tasks = await storage.getTasksByCategory(category as string);
      } else if (rankLevel) {
        tasks = await storage.getTasksForRank(parseInt(rankLevel as string));
      } else {
        tasks = await storage.getTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Player task progress
  app.get("/api/players/:playerId/tasks", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const playerTasks = await storage.getPlayerTasks(playerId);
      res.json(playerTasks);
    } catch (error) {
      res.status(400).json({ message: "Invalid player ID" });
    }
  });

  app.get("/api/players/:playerId/tasks/:taskId", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const taskId = req.params.taskId;
      
      const playerTask = await storage.getPlayerTask(playerId, taskId);
      
      if (!playerTask) {
        return res.status(404).json({ message: "Player task not found" });
      }
      
      res.json(playerTask);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Game state operations
  app.get("/api/players/:playerId/game-state", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const gameState = await storage.getGameState(playerId);
      res.json(gameState);
    } catch (error) {
      res.status(400).json({ message: "Invalid player ID" });
    }
  });

  app.post("/api/players/:playerId/game-state", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const gameStateData = insertGameStateSchema.parse({
        ...req.body,
        playerId,
      });
      
      const gameState = await storage.createGameState(gameStateData);
      res.json(gameState);
    } catch (error) {
      res.status(400).json({ message: "Invalid request", error });
    }
  });

  app.patch("/api/players/:playerId/game-state", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const updates = updateGameStateSchema.parse(req.body);
      
      const gameState = await storage.updateGameState(playerId, updates);
      res.json(gameState);
    } catch (error) {
      res.status(400).json({ message: "Invalid request", error });
    }
  });

  app.delete("/api/players/:playerId/game-state", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      await storage.deleteGameState(playerId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Invalid player ID" });
    }
  });

  // Solution validation
  app.post("/api/players/:playerId/validate-solution", async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const { taskId, solution, timeElapsed } = validateSolutionSchema.parse(req.body);
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Validate solution
      const expectedOutput = task.testOutput as string[][];
      const isCorrect = JSON.stringify(solution) === JSON.stringify(expectedOutput);
      
      let playerTask = await storage.getPlayerTask(playerId, taskId);
      
      if (!playerTask) {
        playerTask = await storage.createPlayerTask({
          playerId,
          taskId,
          completed: false,
          attempts: 0,
          pointsEarned: 0,
        });
      }
      
      // Update attempts
      await storage.updatePlayerTask(playerId, taskId, {
        attempts: playerTask.attempts + 1,
      });
      
      if (isCorrect) {
        // Calculate points with time bonus
        let points = task.basePoints;
        let speedBonus = 0;
        
        if (timeElapsed && task.timeLimit) {
          const remainingTime = task.timeLimit - timeElapsed;
          if (remainingTime > 0) {
            speedBonus = Math.floor((remainingTime / task.timeLimit) * task.basePoints * 0.5);
            points += speedBonus;
          }
        }
        
        // Update player task
        await storage.updatePlayerTask(playerId, taskId, {
          completed: true,
          pointsEarned: points,
          bestTime: timeElapsed || null,
        });
        
        // Update player stats
        const newTotalPoints = player.totalPoints + points;
        const newCompletedMissions = player.completedMissions + (playerTask.completed ? 0 : 1);
        
        // Calculate new rank
        const { newRank, newRankLevel } = calculateRank(newTotalPoints);
        
        await storage.updatePlayer(playerId, {
          totalPoints: newTotalPoints,
          completedMissions: newCompletedMissions,
          rank: newRank,
          rankLevel: newRankLevel,
        });
        
        res.json({
          success: true,
          correct: true,
          basePoints: task.basePoints,
          speedBonus,
          totalPoints: points,
          newRank,
          rankUp: newRankLevel > player.rankLevel,
        });
      } else {
        res.json({
          success: true,
          correct: false,
          attempts: playerTask.attempts + 1,
        });
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid request", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculateRank(totalPoints: number): { newRank: string; newRankLevel: number } {
  const ranks = [
    { level: 1, name: "Specialist 1", threshold: 0 },
    { level: 2, name: "Specialist 2", threshold: 3600 },
    { level: 3, name: "Specialist 3", threshold: 8000 },
    { level: 4, name: "Specialist 4", threshold: 15000 },
    { level: 5, name: "Sergeant", threshold: 25000 },
    { level: 6, name: "Second Lieutenant", threshold: 40000 },
  ];
  
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (totalPoints >= ranks[i].threshold) {
      return { newRank: ranks[i].name, newRankLevel: ranks[i].level };
    }
  }
  
  return { newRank: "Specialist 1", newRankLevel: 1 };
}
