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
  currentMission: text("current_mission"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const missions = pgTable("missions", {
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
});

export const playerMissions = pgTable("player_missions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id),
  missionId: text("mission_id").references(() => missions.id),
  completed: boolean("completed").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
  bestTime: integer("best_time"), // in seconds
  pointsEarned: integer("points_earned").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at").defaultNow(),
});

export const gameState = pgTable("game_state", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id),
  currentMissionId: text("current_mission_id").references(() => missions.id),
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
export const insertMissionSchema = createInsertSchema(missions);
export const insertPlayerMissionSchema = createInsertSchema(playerMissions).omit({ id: true });
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

export type Mission = typeof missions.$inferSelect;
export type InsertMission = z.infer<typeof insertMissionSchema>;

export type PlayerMission = typeof playerMissions.$inferSelect;
export type InsertPlayerMission = z.infer<typeof insertPlayerMissionSchema>;

export type GameState = typeof gameState.$inferSelect;
export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type UpdateGameState = z.infer<typeof updateGameStateSchema>;
