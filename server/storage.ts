import { 
  users, players, tasks, playerTasks, gameState,
  type User, type InsertUser,
  type Player, type InsertPlayer, type UpdatePlayer,
  type Task, type InsertTask,
  type PlayerTask, type InsertPlayerTask,
  type GameState, type InsertGameState, type UpdateGameState
} from "@shared/schema";

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
  getPlayerTask(playerId: number, taskId: string): Promise<PlayerTask | undefined>;
  getPlayerTasks(playerId: number): Promise<PlayerTask[]>;
  createPlayerTask(playerTask: InsertPlayerTask): Promise<PlayerTask>;
  updatePlayerTask(playerId: number, taskId: string, updates: Partial<PlayerTask>): Promise<PlayerTask | undefined>;
  
  // Game state operations
  getGameState(playerId: number): Promise<GameState | undefined>;
  createGameState(gameState: InsertGameState): Promise<GameState>;
  updateGameState(playerId: number, updates: UpdateGameState): Promise<GameState | undefined>;
  deleteGameState(playerId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private players: Map<number, Player>;
  private tasks: Map<string, Task>;
  private playerTasks: Map<string, PlayerTask>; // key: `${playerId}-${taskId}`
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
    
    // Initialize with default tasks
    this.initializeDefaultTasks();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
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
    return Array.from(this.players.values()).find(player => player.userId === userId);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    const now = new Date();
    const player: Player = { 
      userId: insertPlayer.userId || null,
      rank: insertPlayer.rank || "Specialist 1", 
      rankLevel: insertPlayer.rankLevel || 1,
      totalPoints: insertPlayer.totalPoints || 0,
      completedMissions: insertPlayer.completedMissions || 0,
      currentTask: insertPlayer.currentTask || null,
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: number, updates: UpdatePlayer): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer: Player = { 
      ...player, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  // Task operations
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByCategory(category: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.category === category);
  }

  async getTasksForRank(rankLevel: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.requiredRankLevel <= rankLevel);
  }

  async createTask(task: InsertTask): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
  }

  // Player task progress
  async getPlayerTask(playerId: number, taskId: string): Promise<PlayerTask | undefined> {
    return this.playerTasks.get(`${playerId}-${taskId}`);
  }

  async getPlayerTasks(playerId: number): Promise<PlayerTask[]> {
    return Array.from(this.playerTasks.values()).filter(pt => pt.playerId === playerId);
  }

  async createPlayerTask(insertPlayerTask: InsertPlayerTask): Promise<PlayerTask> {
    const id = this.currentPlayerTaskId++;
    const playerTask: PlayerTask = { 
      id,
      playerId: insertPlayerTask.playerId!,
      taskId: insertPlayerTask.taskId!,
      completed: insertPlayerTask.completed || false,
      attempts: insertPlayerTask.attempts || 0,
      bestTime: insertPlayerTask.bestTime || null,
      pointsEarned: insertPlayerTask.pointsEarned || 0,
      lastAttemptAt: new Date() 
    };
    this.playerTasks.set(`${playerTask.playerId}-${playerTask.taskId}`, playerTask);
    return playerTask;
  }

  async updatePlayerTask(playerId: number, taskId: string, updates: Partial<PlayerTask>): Promise<PlayerTask | undefined> {
    const key = `${playerId}-${taskId}`;
    const playerTask = this.playerTasks.get(key);
    if (!playerTask) return undefined;
    
    const updatedPlayerTask: PlayerTask = { 
      ...playerTask, 
      ...updates, 
      lastAttemptAt: new Date() 
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
      updatedAt: now 
    };
    this.gameStates.set(gameState.playerId!, gameState);
    return gameState;
  }

  async updateGameState(playerId: number, updates: UpdateGameState): Promise<GameState | undefined> {
    const gameState = this.gameStates.get(playerId);
    if (!gameState) return undefined;
    
    const updatedGameState: GameState = { 
      ...gameState, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.gameStates.set(playerId, updatedGameState);
    return updatedGameState;
  }

  async deleteGameState(playerId: number): Promise<void> {
    this.gameStates.delete(playerId);
  }

  private initializeDefaultTasks() {
    // Initialize with sample tasks for each category
    const defaultTasks: InsertTask[] = [
      {
        id: "OS-001",
        title: "Oxygen Sensor Calibration",
        description: "The oxygen sensors in Bay 2 are showing irregular patterns. Study the transformation examples and apply the same logic to calibrate the faulty sensor grid.",
        category: "🛡️ O₂ Sensor Check",
        difficulty: "Basic",
        gridSize: 2,
        timeLimit: 60,
        basePoints: 350,
        requiredRankLevel: 1,
        examples: [
          {
            input: [["🟡", "⬛"], ["⬛", "🔴"]],
            output: [["🔴", "⬛"], ["⬛", "🟡"]]
          },
          {
            input: [["🟢", "🔵"], ["⬛", "⬛"]],
            output: [["⬛", "⬛"], ["🔵", "🟢"]]
          }
        ],
        testInput: [["🟣", "⬛"], ["🟠", "⬛"]],
        testOutput: [["⬛", "🟠"], ["⬛", "🟣"]],
        emojiSet: "status_main"
      },
      {
        id: "PL-001",
        title: "Pre-Launch Sequence Alpha",
        description: "Critical pre-launch systems require pattern verification. Analyze the command sequences and complete the missing pattern.",
        category: "🚀 Pre-Launch Ops",
        difficulty: "Intermediate",
        gridSize: 3,
        timeLimit: 180,
        basePoints: 750,
        requiredRankLevel: 2,
        examples: [
          {
            input: [["🟡", "⬛", "🔴"], ["⬛", "🟢", "⬛"], ["🔵", "⬛", "🟣"]],
            output: [["🟣", "⬛", "🔵"], ["⬛", "🟢", "⬛"], ["🔴", "⬛", "🟡"]]
          }
        ],
        testInput: [["🟠", "⬛", "🟢"], ["⬛", "🔵", "⬛"], ["🟣", "⬛", "🟡"]],
        testOutput: [["🟡", "⬛", "🟣"], ["⬛", "🔵", "⬛"], ["🟢", "⬛", "🟠"]],
        emojiSet: "status_main"
      },
      {
        id: "FS-001",
        title: "Fuel Matrix Diagnostics",
        description: "Advanced fuel mixture calculations require precise pattern matching. Complete the complex transformation sequence.",
        category: "⚡ Fuel Systems",
        difficulty: "Advanced",
        gridSize: 4,
        timeLimit: 300,
        basePoints: 1500,
        requiredRankLevel: 5,
        examples: [
          {
            input: [["🟡", "⬛", "🔴", "⬛"], ["⬛", "🟢", "⬛", "🔵"], ["🟣", "⬛", "🟠", "⬛"], ["⬛", "🟤", "⬛", "⚪"]],
            output: [["⚪", "⬛", "🟤", "⬛"], ["⬛", "🟠", "⬛", "🟣"], ["🔵", "⬛", "🟢", "⬛"], ["⬛", "🔴", "⬛", "🟡"]]
          }
        ],
        testInput: [["🔴", "⬛", "🟢", "⬛"], ["⬛", "🟣", "⬛", "🟡"], ["🔵", "⬛", "🟠", "⬛"], ["⬛", "⚪", "⬛", "🟤"]],
        testOutput: [["🟤", "⬛", "⚪", "⬛"], ["⬛", "🟠", "⬛", "🔵"], ["🟡", "⬛", "🟣", "⬛"], ["⬛", "🟢", "⬛", "🔴"]],
        emojiSet: "status_main"
      }
    ];

    defaultTasks.forEach(task => {
      const fullTask: Task = {
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        difficulty: task.difficulty,
        gridSize: task.gridSize,
        timeLimit: task.timeLimit || null,
        basePoints: task.basePoints,
        requiredRankLevel: task.requiredRankLevel || 1,
        examples: task.examples,
        testInput: task.testInput,
        testOutput: task.testOutput,
        emojiSet: task.emojiSet || "status_main"
      };
      this.tasks.set(task.id, fullTask);
    });
  }
}

export const storage = new MemStorage();
