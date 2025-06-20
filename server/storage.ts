import {
  users,
  players,
  tasks,
  playerTasks,
  gameState,
  type User,
  type InsertUser,
  type Player,
  type InsertPlayer,
  type UpdatePlayer,
  type Task,
  type InsertTask,
  type PlayerTask,
  type InsertPlayerTask,
  type GameState,
  type InsertGameState,
  type UpdateGameState,
} from "@shared/schema";
import { taskLoader } from "./services/taskLoader";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Player operations
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayerByUserId(userId: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, updates: UpdatePlayer): Promise<Player | undefined>;

  // Task operations
  getTask(id: string): Promise<Task | undefined>;
  getTasks(): Promise<Task[]>;
  getTasksByCategory(category: string): Promise<Task[]>;
  getTasksForRank(rankLevel: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;

  // Player task progress
  getPlayerTask(
    playerId: number,
    taskId: string,
  ): Promise<PlayerTask | undefined>;
  getPlayerTasks(playerId: number): Promise<PlayerTask[]>;
  createPlayerTask(playerTask: InsertPlayerTask): Promise<PlayerTask>;
  updatePlayerTask(
    playerId: number,
    taskId: string,
    updates: Partial<PlayerTask>,
  ): Promise<PlayerTask | undefined>;

  // Game state operations
  getGameState(playerId: number): Promise<GameState | undefined>;
  createGameState(gameState: InsertGameState): Promise<GameState>;
  updateGameState(
    playerId: number,
    updates: UpdateGameState,
  ): Promise<GameState | undefined>;
  deleteGameState(playerId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private players: Map<number, Player>;
  private tasks: Map<string, Task>;
  private playerTasks: Map<string, PlayerTask>; // key: `${playerId}-${taskId}`
  /**
   * Promise that resolves once task initialization has completed. This is critical
   * for serverless environments where the storage instance is constructed lazily
   * for each request. Route handlers will await this promise to guarantee that
   * task data is available before continuing.
   */
  private tasksInitPromise: Promise<void> = Promise.resolve();
  private gameStates: Map<number, GameState>; // key: playerId
  private currentUserId: number;
  private currentPlayerId: number;
  private currentPlayerTaskId: number;
  private currentGameStateId: number;

  constructor() {
    this.users = new Map();
    this.players = new Map();
    this.tasks = new Map();
    this.playerTasks = new Map();
    this.gameStates = new Map();
    this.currentUserId = 1;
    this.currentPlayerId = 1;
    this.currentPlayerTaskId = 1;
    this.currentGameStateId = 1;

    // Initialize tasks from JSON files asynchronously and store the promise so
    // that other methods can await it.
    this.tasksInitPromise = this.initializeTasks();
    this.tasksInitPromise.catch(console.error);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Player operations
  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayerByUserId(userId: number): Promise<Player | undefined> {
    return Array.from(this.players.values()).find(
      (player) => player.userId === userId,
    );
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    const now = new Date();
    const player: Player = {
      ...insertPlayer,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(
    id: number,
    updates: UpdatePlayer,
  ): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;

    const updatedPlayer: Player = {
      ...player,
      ...updates,
      updatedAt: new Date(),
    };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  // Task operations
  private async ensureTasksLoaded(): Promise<void> {
    await this.tasksInitPromise;
  }

  async getTask(id: string): Promise<Task | undefined> {
    await this.ensureTasksLoaded();
    return this.tasks.get(id);
  }

  async getTasks(): Promise<Task[]> {
    await this.ensureTasksLoaded();
    return Array.from(this.tasks.values());
  }

  async getTasksByCategory(category: string): Promise<Task[]> {
    await this.ensureTasksLoaded();
    return Array.from(this.tasks.values()).filter(
      (task) => task.category === category,
    );
  }

  async getTasksForRank(rankLevel: number): Promise<Task[]> {
    await this.ensureTasksLoaded();
    return Array.from(this.tasks.values()).filter(
      (task) => task.requiredRankLevel <= rankLevel,
    );
  }

  async createTask(task: InsertTask): Promise<Task> {
    const fullTask: Task = {
      ...task,
      timeLimit: task.timeLimit ?? null,
      requiredRankLevel: task.requiredRankLevel ?? 1,
      emojiSet: task.emojiSet ?? 'status_main',
      hints: task.hints ?? []
    };
    this.tasks.set(task.id, fullTask);
    return fullTask;
  }

  // Player task progress
  async getPlayerTask(
    playerId: number,
    taskId: string,
  ): Promise<PlayerTask | undefined> {
    return this.playerTasks.get(`${playerId}-${taskId}`);
  }

  async getPlayerTasks(playerId: number): Promise<PlayerTask[]> {
    return Array.from(this.playerTasks.values()).filter(
      (playerTask) => playerTask.playerId === playerId,
    );
  }

  async createPlayerTask(
    insertPlayerTask: InsertPlayerTask,
  ): Promise<PlayerTask> {
    const id = this.currentPlayerTaskId++;
    const playerTask: PlayerTask = {
      ...insertPlayerTask,
      id,
    };
    this.playerTasks.set(
      `${insertPlayerTask.playerId}-${insertPlayerTask.taskId}`,
      playerTask,
    );
    return playerTask;
  }

  async updatePlayerTask(
    playerId: number,
    taskId: string,
    updates: Partial<PlayerTask>,
  ): Promise<PlayerTask | undefined> {
    const key = `${playerId}-${taskId}`;
    const playerTask = this.playerTasks.get(key);
    if (!playerTask) return undefined;

    const updatedPlayerTask: PlayerTask = {
      ...playerTask,
      ...updates,
    };
    this.playerTasks.set(key, updatedPlayerTask);
    return updatedPlayerTask;
  }

  // Game state operations
  async getGameState(playerId: number): Promise<GameState | undefined> {
    return this.gameStates.get(playerId);
  }

  async createGameState(insertGameState: InsertGameState): Promise<GameState> {
    const id = this.currentGameStateId++;
    const now = new Date();
    const gameState: GameState = {
      ...insertGameState,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.gameStates.set(insertGameState.playerId!, gameState);
    return gameState;
  }

  async updateGameState(
    playerId: number,
    updates: UpdateGameState,
  ): Promise<GameState | undefined> {
    const gameState = this.gameStates.get(playerId);
    if (!gameState) return undefined;

    const updatedGameState: GameState = {
      ...gameState,
      ...updates,
      updatedAt: new Date(),
    };
    this.gameStates.set(playerId, updatedGameState);
    return updatedGameState;
  }

  async deleteGameState(playerId: number): Promise<void> {
    this.gameStates.delete(playerId);
  }

  private async initializeTasks() {
    try {
      const loadedTasks = await taskLoader.loadAllTasks();
      
      loadedTasks.forEach(task => {
        this.tasks.set(task.id, task);
      });
      
      console.log(`Loaded ${loadedTasks.length} tasks from JSON files`);
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Fallback to prevent empty task list
      console.log('Falling back to empty task list - add JSON files to server/data/tasks/');
    }
  }
}

export const storage = new MemStorage();