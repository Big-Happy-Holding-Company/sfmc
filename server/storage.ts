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

    // Initialize tasks from JSON files asynchronously
    this.initializeTasks().catch(console.error);
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
      userId: insertPlayer.userId || null,
      rank: insertPlayer.rank || "Specialist 1",
      rankLevel: insertPlayer.rankLevel || 1,
      totalPoints: insertPlayer.totalPoints || 0,
      completedMissions: insertPlayer.completedMissions || 0,
      currentTask: insertPlayer.currentTask || null,
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
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByCategory(category: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.category === category,
    );
  }

  async getTasksForRank(rankLevel: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.requiredRankLevel <= rankLevel,
    );
  }

  async createTask(task: InsertTask): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
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
      (pt) => pt.playerId === playerId,
    );
  }

  async createPlayerTask(
    insertPlayerTask: InsertPlayerTask,
  ): Promise<PlayerTask> {
    const id = this.currentPlayerTaskId++;
    const playerTask: PlayerTask = {
      id,
      playerId: insertPlayerTask.playerId!,
      taskId: insertPlayerTask.taskId!,
      completed: insertPlayerTask.completed || false,
      attempts: insertPlayerTask.attempts || 0,
      bestTime: insertPlayerTask.bestTime || null,
      pointsEarned: insertPlayerTask.pointsEarned || 0,
      lastAttemptAt: new Date(),
    };
    this.playerTasks.set(
      `${playerTask.playerId}-${playerTask.taskId}`,
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
      lastAttemptAt: new Date(),
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
    this.gameStates.set(gameState.playerId!, gameState);
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

  private initializeDefaultTasks() {
    // Legacy method - now replaced by JSON task loading
    console.log('Legacy task initialization method called - use JSON files instead');
  }
  
  private legacyHardcodedTasks() {
    // All hardcoded task data removed - replaced with modular JSON files
    console.log('Legacy hardcoded task method - replaced by JSON loader');
  }
}

export const storage = new MemStorage();
            input: [
              ["🟡", "⬛"],
              ["⬛", "🔴"],
            ],
            output: [
              ["🔴", "⬛"],
              ["⬛", "🟡"],
            ],
          },
          {
            input: [
              ["🟢", "🔵"],
              ["⬛", "⬛"],
            ],
            output: [
              ["⬛", "⬛"],
              ["🔵", "🟢"],
            ],
          },
        ],
        testInput: [
          ["🟣", "⬛"],
          ["🟠", "⬛"],
        ],
        testOutput: [
          ["⬛", "🟠"],
          ["⬛", "🟣"],
        ],
        emojiSet: "status_main",
      },
      {
        id: "OS-002",
        title: "Recalibration",
        description:
          "Secondary oxygen sensors need recalibration. Here's what worked before, can you recalibrate our setting to restore proper atmospheric readings?",
        category: "🛡️ O₂ Sensor Check",
        difficulty: "Basic",
        gridSize: 2,
        timeLimit: null,
        basePoints: 400,
        requiredRankLevel: 1,
        examples: [
          {
            input: [
              ["🔴", "🟢"],
              ["🔵", "🟡"],
            ],
            output: [
              ["🟡", "🔵"],
              ["🟢", "🔴"],
            ],
          },
        ],
        testInput: [
          ["🟣", "🟠"],
          ["⬛", "🔴"],
        ],
        testOutput: [
          ["🔴", "⬛"],
          ["🟠", "🟣"],
        ],
        emojiSet: "status_main",
      },
      {
        id: "OS-003",
        title: "Life Support Diagnostics",
        description:
          "Critical life support systems require advanced pattern analysis. Complete the 3x3 oxygen flow calibration.",
        category: "🛡️ O₂ Sensor Check",
        difficulty: "Intermediate",
        gridSize: 3,
        timeLimit: null,
        basePoints: 650,
        requiredRankLevel: 2,
        examples: [
          {
            input: [
              ["🟡", "⬛", "🔴"],
              ["⬛", "🟢", "⬛"],
              ["🔵", "⬛", "🟣"],
            ],
            output: [
              ["🟣", "⬛", "🔵"],
              ["⬛", "🟢", "⬛"],
              ["🔴", "⬛", "🟡"],
            ],
          },
        ],
        testInput: [
          ["🟠", "⬛", "🔴"],
          ["⬛", "🟢", "⬛"],
          ["🔵", "⬛", "🟡"],
        ],
        testOutput: [
          ["🟡", "⬛", "🔵"],
          ["⬛", "🟢", "⬛"],
          ["🔴", "⬛", "🟠"],
        ],
        emojiSet: "status_main",
      },
      {
        id: "OS-004",
        title: "Emergency O₂ Protocol",
        description:
          "Emergency oxygen systems detected anomalies. Execute advanced pattern correction.",
        category: "🛡️ O₂ Sensor Check",
        difficulty: "Advanced",
        gridSize: 4,
        timeLimit: null,
        basePoints: 1200,
        requiredRankLevel: 4,
        examples: [
          {
            input: [
              ["🟡", "⬛", "🔴", "⬛"],
              ["⬛", "🟢", "⬛", "🔵"],
              ["🟣", "⬛", "🟠", "⬛"],
              ["⬛", "🟤", "⬛", "⚪"],
            ],
            output: [
              ["⚪", "⬛", "🟤", "⬛"],
              ["⬛", "🟠", "⬛", "🟣"],
              ["🔵", "⬛", "🟢", "⬛"],
              ["⬛", "🔴", "⬛", "🟡"],
            ],
          },
        ],
        testInput: [
          ["🔴", "⬛", "🟢", "⬛"],
          ["⬛", "🟣", "⬛", "🟡"],
          ["🔵", "⬛", "🟠", "⬛"],
          ["⬛", "⚪", "⬛", "🟤"],
        ],
        testOutput: [
          ["🟤", "⬛", "⚪", "⬛"],
          ["⬛", "🟠", "⬛", "🔵"],
          ["🟡", "⬛", "🟣", "⬛"],
          ["⬛", "🟢", "⬛", "🔴"],
        ],
        emojiSet: "status_main",
      },

      // PRE-LAUNCH OPS TASKS - Using tech_set1 emoji set for authentic space equipment
      {
        id: "PL-001",
        title: "Pre-Launch Sequence Alpha",
        description:
          "Critical pre-launch systems require pattern verification. Study the radar and equipment positioning patterns.",
        category: "🚀 Pre-Launch Ops",
        difficulty: "Basic",
        gridSize: 2,
        timeLimit: null,
        basePoints: 450,
        requiredRankLevel: 1,
        examples: [
          {
            input: [
              ["🛩️", "⬛"],
              ["⬛", "📡"],
            ],
            output: [
              ["📡", "⬛"],
              ["⬛", "🛩️"],
            ],
          },
          {
            input: [
              ["🔭", "⚡"],
              ["⬛", "⬛"],
            ],
            output: [
              ["⬛", "⬛"],
              ["⚡", "🔭"],
            ],
          },
        ],
        testInput: [
          ["🔋", "⬛"],
          ["💻", "⬛"],
        ],
        testOutput: [
          ["⬛", "💻"],
          ["⬛", "🔋"],
        ],
        emojiSet: "tech_set1",
      },
      {
        id: "PL-002",
        title: "Launch Pad Systems Check",
        description:
          "Launch pad systems require sequential verification. Analyze the equipment transformation sequence.",
        category: "🚀 Pre-Launch Ops",
        difficulty: "Intermediate",
        gridSize: 3,
        timeLimit: null,
        basePoints: 750,
        requiredRankLevel: 2,
        examples: [
          {
            input: [
              ["🛩️", "⬛", "📡"],
              ["⬛", "🔭", "⬛"],
              ["⚡", "⬛", "🔋"],
            ],
            output: [
              ["🔋", "⬛", "⚡"],
              ["⬛", "🔭", "⬛"],
              ["📡", "⬛", "🛩️"],
            ],
          },
        ],
        testInput: [
          ["💻", "⬛", "📱"],
          ["⬛", "🖥️", "⬛"],
          ["⌨️", "⬛", "🔭"],
        ],
        testOutput: [
          ["🔭", "⬛", "⌨️"],
          ["⬛", "🖥️", "⬛"],
          ["📱", "⬛", "💻"],
        ],
        emojiSet: "tech_set1",
      },
      {
        id: "PL-003",
        title: "Rocket Engine Alignment",
        description:
          "Main engine thrust vectors need calibration. Complete the complex equipment alignment pattern.",
        category: "🚀 Pre-Launch Ops",
        difficulty: "Advanced",
        gridSize: 4,
        timeLimit: null,
        basePoints: 1400,
        requiredRankLevel: 4,
        examples: [
          {
            input: [
              ["🛩️", "⬛", "📡", "⬛"],
              ["⬛", "🔭", "⬛", "⚡"],
              ["🔋", "⬛", "💻", "⬛"],
              ["⬛", "📱", "⬛", "🖥️"],
            ],
            output: [
              ["🖥️", "⬛", "📱", "⬛"],
              ["⬛", "💻", "⬛", "🔋"],
              ["⚡", "⬛", "🔭", "⬛"],
              ["⬛", "📡", "⬛", "🛩️"],
            ],
          },
        ],
        testInput: [
          ["⌨️", "⬛", "🔭", "⬛"],
          ["⬛", "📡", "⬛", "🛩️"],
          ["⚡", "⬛", "💻", "⬛"],
          ["⬛", "🔋", "⬛", "📱"],
        ],
        testOutput: [
          ["📱", "⬛", "🔋", "⬛"],
          ["⬛", "💻", "⬛", "⚡"],
          ["🛩️", "⬛", "📡", "⬛"],
          ["⬛", "🔭", "⬛", "⌨️"],
        ],
        emojiSet: "tech_set1",
      },

      // FUEL SYSTEMS TASKS - Using tech_set2 emoji set for mechanical equipment
      {
        id: "FS-001",
        title: "Basic Fuel Flow Check",
        description:
          "Primary fuel lines showing irregular flow patterns. Study the mechanical component patterns.",
        category: "⚡ Fuel Systems",
        difficulty: "Basic",
        gridSize: 2,
        timeLimit: null,
        basePoints: 500,
        requiredRankLevel: 1,
        examples: [
          {
            input: [
              ["⚙️", "⬛"],
              ["⬛", "🔧"],
            ],
            output: [
              ["🔧", "⬛"],
              ["⬛", "⚙️"],
            ],
          },
          {
            input: [
              ["🔨", "🛠️"],
              ["⬛", "⬛"],
            ],
            output: [
              ["⬛", "⬛"],
              ["🛠️", "🔨"],
            ],
          },
        ],
        testInput: [
          ["⚛️", "⬛"],
          ["🎛️", "⬛"],
        ],
        testOutput: [
          ["⬛", "🎛️"],
          ["⬛", "⚛️"],
        ],
        emojiSet: "tech_set2",
      },
      {
        id: "FS-002",
        title: "Fuel Mixture Analysis",
        description:
          "Fuel mixture ratios require adjustment. Follow the mechanical transformation pattern.",
        category: "⚡ Fuel Systems",
        difficulty: "Intermediate",
        gridSize: 3,
        timeLimit: null,
        basePoints: 800,
        requiredRankLevel: 3,
        examples: [
          {
            input: [
              ["⚙️", "⬛", "🔧"],
              ["⬛", "🔨", "⬛"],
              ["🛠️", "⬛", "⚛️"],
            ],
            output: [
              ["⚛️", "⬛", "🛠️"],
              ["⬛", "🔨", "⬛"],
              ["🔧", "⬛", "⚙️"],
            ],
          },
        ],
        testInput: [
          ["🖱️", "⬛", "📺"],
          ["⬛", "📻", "⬛"],
          ["🎛️", "⬛", "⚙️"],
        ],
        testOutput: [
          ["⚙️", "⬛", "🎛️"],
          ["⬛", "📻", "⬛"],
          ["📺", "⬛", "🖱️"],
        ],
        emojiSet: "tech_set2",
      },
      {
        id: "FS-003",
        title: "Fuel Matrix Diagnostics",
        description:
          "Advanced fuel mixture calculations require precise pattern matching. Complete the complex mechanical sequence.",
        category: "⚡ Fuel Systems",
        difficulty: "Advanced",
        gridSize: 4,
        timeLimit: 30000,
        basePoints: 1500,
        requiredRankLevel: 5,
        examples: [
          {
            input: [
              ["⚙️", "⬛", "🔧", "⬛"],
              ["⬛", "🔨", "⬛", "🛠️"],
              ["⚛️", "⬛", "🖱️", "⬛"],
              ["⬛", "📺", "⬛", "📻"],
            ],
            output: [
              ["📻", "⬛", "📺", "⬛"],
              ["⬛", "🖱️", "⬛", "⚛️"],
              ["🛠️", "⬛", "🔨", "⬛"],
              ["⬛", "🔧", "⬛", "⚙️"],
            ],
          },
        ],
        testInput: [
          ["🎛️", "⬛", "⚙️", "⬛"],
          ["⬛", "🔧", "⬛", "🔨"],
          ["🛠️", "⬛", "⚛️", "⬛"],
          ["⬛", "🖱️", "⬛", "📺"],
        ],
        testOutput: [
          ["📺", "⬛", "🖱️", "⬛"],
          ["⬛", "⚛️", "⬛", "🛠️"],
          ["🔨", "⬛", "🔧", "⬛"],
          ["⬛", "⚙️", "⬛", "🎛️"],
        ],
        emojiSet: "tech_set2",
      },

      // NAVIGATION TASKS - Using nav_alerts emoji set
      {
        id: "NAV-001",
        title: "Navigation Vector Check",
        description:
          "Navigation systems require directional calibration. Study the arrow transformation patterns.",
        category: "🧭 Navigation",
        difficulty: "Basic",
        gridSize: 2,
        timeLimit: null,
        basePoints: 420,
        requiredRankLevel: 1,
        examples: [
          {
            input: [
              ["⬆️", "⬛"],
              ["⬛", "⬇️"],
            ],
            output: [
              ["⬇️", "⬛"],
              ["⬛", "⬆️"],
            ],
          },
          {
            input: [
              ["⬅️", "➡️"],
              ["⬛", "⬛"],
            ],
            output: [
              ["⬛", "⬛"],
              ["➡️", "⬅️"],
            ],
          },
        ],
        testInput: [
          ["↗️", "⬛"],
          ["🧭", "⬛"],
        ],
        testOutput: [
          ["⬛", "🧭"],
          ["⬛", "↗️"],
        ],
        emojiSet: "nav_alerts",
      },
      {
        id: "NAV-002",
        title: "Compass Alignment Protocol",
        description:
          "Advanced navigation requires complex directional transformations. Analyze the compass pattern.",
        category: "🧭 Navigation",
        difficulty: "Intermediate",
        gridSize: 3,
        timeLimit: null,
        basePoints: 720,
        requiredRankLevel: 2,
        examples: [
          {
            input: [
              ["⬆️", "⬛", "⬇️"],
              ["⬛", "🧭", "⬛"],
              ["⬅️", "⬛", "➡️"],
            ],
            output: [
              ["➡️", "⬛", "⬅️"],
              ["⬛", "🧭", "⬛"],
              ["⬇️", "⬛", "⬆️"],
            ],
          },
        ],
        testInput: [
          ["↗️", "⬛", "↖️"],
          ["⬛", "🧭", "⬛"],
          ["↘️", "⬛", "↙️"],
        ],
        testOutput: [
          ["↙️", "⬛", "↘️"],
          ["⬛", "🧭", "⬛"],
          ["↖️", "⬛", "↗️"],
        ],
        emojiSet: "nav_alerts",
      },

      // CELESTIAL OBSERVATION TASKS - Using celestial_set1 emoji set
      {
        id: "CEL-001",
        title: "Planetary Alignment Check",
        description:
          "Celestial bodies require observation and pattern analysis for navigation calibration.",
        category: "🌍 Celestial Obs",
        difficulty: "Intermediate",
        gridSize: 3,
        timeLimit: null,
        basePoints: 850,
        requiredRankLevel: 3,
        examples: [
          {
            input: [
              ["🌍", "⬛", "🌎"],
              ["⬛", "🌏", "⬛"],
              ["🌕", "⬛", "🌖"],
            ],
            output: [
              ["🌖", "⬛", "🌕"],
              ["⬛", "🌏", "⬛"],
              ["🌎", "⬛", "🌍"],
            ],
          },
        ],
        testInput: [
          ["🌗", "⬛", "🌘"],
          ["⬛", "🌑", "⬛"],
          ["🌒", "⬛", "🌍"],
        ],
        testOutput: [
          ["🌍", "⬛", "🌒"],
          ["⬛", "🌑", "⬛"],
          ["🌘", "⬛", "🌗"],
        ],
        emojiSet: "celestial_set1",
      },

      // STELLAR NAVIGATION TASKS - Using celestial_set2 emoji set
      {
        id: "STAR-001",
        title: "Stellar Navigation Array",
        description:
          "Deep space navigation requires stellar pattern recognition and complex transformations.",
        category: "⭐ Stellar Nav",
        difficulty: "Advanced",
        gridSize: 4,
        timeLimit: 360,
        basePoints: 1800,
        requiredRankLevel: 6,
        examples: [
          {
            input: [
              ["☀️", "⬛", "⭐", "⬛"],
              ["⬛", "🌟", "⬛", "✨"],
              ["💫", "⬛", "🌠", "⬛"],
              ["⬛", "🪐", "⬛", "🌓"],
            ],
            output: [
              ["🌓", "⬛", "🪐", "⬛"],
              ["⬛", "🌠", "⬛", "💫"],
              ["✨", "⬛", "🌟", "⬛"],
              ["⬛", "⭐", "⬛", "☀️"],
            ],
          },
        ],
        testInput: [
          ["🌔", "⬛", "☀️", "⬛"],
          ["⬛", "⭐", "⬛", "🌟"],
          ["✨", "⬛", "💫", "⬛"],
          ["⬛", "🌠", "⬛", "🪐"],
        ],
        testOutput: [
          ["🪐", "⬛", "🌠", "⬛"],
          ["⬛", "💫", "⬛", "✨"],
          ["🌟", "⬛", "⭐", "⬛"],
          ["⬛", "☀️", "⬛", "🌔"],
        ],
        emojiSet: "celestial_set2",
      },
    ];

    // Legacy hardcoded tasks removed - now using JSON task files
    console.log('Legacy task initialization method called - use JSON files instead');
  }
}

export const storage = new MemStorage();
