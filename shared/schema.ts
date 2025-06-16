import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  rank: text("rank").notNull().default("Specialist 1"),
  rankLevel: integer("rank_level").notNull().default(1),
  totalPoints: integer("total_points").notNull().default(0),
  completedMissions: integer("completed_missions").notNull().default(0),
  currentTask: text("current_task"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  gridSize: integer("grid_size").notNull(),
  timeLimit: integer("time_limit"), // in seconds, null for untimed
  basePoints: integer("base_points").notNull(),
  requiredRankLevel: integer("required_rank_level").notNull().default(1),
  examples: jsonb("examples").notNull(), // Array of {input: string[][], output: string[][]}
  testInput: jsonb("test_input").notNull(), // string[][]
  testOutput: jsonb("test_output").notNull(), // string[][]
  emojiSet: text("emoji_set").notNull().default("status_main"),
  hints: jsonb("hints"), // Array of hint strings
});

export const playerTasks = pgTable("player_tasks", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id),
  taskId: text("task_id").references(() => tasks.id),
  completed: boolean("completed").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  bestTime: integer("best_time"), // in seconds
  pointsEarned: integer("points_earned").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow(),
});

export const gameState = pgTable("game_state", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id),
  currentTaskId: text("current_task_id").references(() => tasks.id),
  currentGrid: jsonb("current_grid"), // string[][]
  startTime: timestamp("start_time"),
  timeRemaining: integer("time_remaining"),
  hintsUsed: integer("hints_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks);
export const insertPlayerTaskSchema = createInsertSchema(playerTasks).omit({ id: true });
export const insertGameStateSchema = createInsertSchema(gameState).omit({ id: true, createdAt: true, updatedAt: true });

// Update schemas
export const updatePlayerSchema = createInsertSchema(players).omit({ id: true, userId: true, createdAt: true }).partial();
export const updateGameStateSchema = createInsertSchema(gameState).omit({ id: true, playerId: true, createdAt: true }).partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type UpdatePlayer = z.infer<typeof updatePlayerSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type PlayerTask = typeof playerTasks.$inferSelect;
export type InsertPlayerTask = z.infer<typeof insertPlayerTaskSchema>;

export type GameState = typeof gameState.$inferSelect;
export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type UpdateGameState = z.infer<typeof updateGameStateSchema>;
