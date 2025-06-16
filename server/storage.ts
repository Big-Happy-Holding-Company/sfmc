import { 
  users, players, missions, playerMissions, gameState,
  type User, type InsertUser,
  type Player, type InsertPlayer, type UpdatePlayer,
  type Mission, type InsertMission,
  type PlayerMission, type InsertPlayerMission,
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
  
  // Mission operations
  getMission(id: string): Promise<Mission | undefined>;
  getMissions(): Promise<Mission[]>;
  getMissionsByCategory(category: string): Promise<Mission[]>;
  getMissionsForRank(rankLevel: number): Promise<Mission[]>;
  createMission(mission: InsertMission): Promise<Mission>;
  
  // Player mission progress
  getPlayerMission(playerId: number, missionId: string): Promise<PlayerMission | undefined>;
  getPlayerMissions(playerId: number): Promise<PlayerMission[]>;
  createPlayerMission(playerMission: InsertPlayerMission): Promise<PlayerMission>;
  updatePlayerMission(playerId: number, missionId: string, updates: Partial<PlayerMission>): Promise<PlayerMission | undefined>;
  
  // Game state operations
  getGameState(playerId: number): Promise<GameState | undefined>;
  createGameState(gameState: InsertGameState): Promise<GameState>;
  updateGameState(playerId: number, updates: UpdateGameState): Promise<GameState | undefined>;
  deleteGameState(playerId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private players: Map<number, Player>;
  private missions: Map<string, Mission>;
  private playerMissions: Map<string, PlayerMission>; // key: `${playerId}-${missionId}`
  private gameStates: Map<number, GameState>; // key: playerId
  private currentUserId: number;
  private currentPlayerId: number;
  private currentPlayerMissionId: number;
  private currentGameStateId: number;

  constructor() {
    this.users = new Map();
    this.players = new Map();
    this.missions = new Map();
    this.playerMissions = new Map();
    this.gameStates = new Map();
    this.currentUserId = 1;
    this.currentPlayerId = 1;
    this.currentPlayerMissionId = 1;
    this.currentGameStateId = 1;
    
    // Initialize with default missions
    this.initializeDefaultMissions();
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
      ...insertPlayer, 
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

  // Mission operations
  async getMission(id: string): Promise<Mission | undefined> {
    return this.missions.get(id);
  }

  async getMissions(): Promise<Mission[]> {
    return Array.from(this.missions.values());
  }

  async getMissionsByCategory(category: string): Promise<Mission[]> {
    return Array.from(this.missions.values()).filter(mission => mission.category === category);
  }

  async getMissionsForRank(rankLevel: number): Promise<Mission[]> {
    return Array.from(this.missions.values()).filter(mission => mission.requiredRankLevel <= rankLevel);
  }

  async createMission(mission: InsertMission): Promise<Mission> {
    this.missions.set(mission.id, mission);
    return mission;
  }

  // Player mission progress
  async getPlayerMission(playerId: number, missionId: string): Promise<PlayerMission | undefined> {
    return this.playerMissions.get(`${playerId}-${missionId}`);
  }

  async getPlayerMissions(playerId: number): Promise<PlayerMission[]> {
    return Array.from(this.playerMissions.values()).filter(pm => pm.playerId === playerId);
  }

  async createPlayerMission(insertPlayerMission: InsertPlayerMission): Promise<PlayerMission> {
    const id = this.currentPlayerMissionId++;
    const playerMission: PlayerMission = { 
      ...insertPlayerMission, 
      id, 
      lastAttemptAt: new Date() 
    };
    this.playerMissions.set(`${playerMission.playerId}-${playerMission.missionId}`, playerMission);
    return playerMission;
  }

  async updatePlayerMission(playerId: number, missionId: string, updates: Partial<PlayerMission>): Promise<PlayerMission | undefined> {
    const key = `${playerId}-${missionId}`;
    const playerMission = this.playerMissions.get(key);
    if (!playerMission) return undefined;
    
    const updatedPlayerMission: PlayerMission = { 
      ...playerMission, 
      ...updates, 
      lastAttemptAt: new Date() 
    };
    this.playerMissions.set(key, updatedPlayerMission);
    return updatedPlayerMission;
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

  private initializeDefaultMissions() {
    // Initialize with sample missions for each category
    const defaultMissions: InsertMission[] = [
      {
        id: "OS-001",
        title: "Oxygen Sensor Calibration",
        description: "The oxygen sensors in Bay 2 are showing irregular patterns. Study the transformation examples and apply the same logic to calibrate the faulty sensor grid.",
        category: "O₂ Sensor Check",
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
        category: "Pre-Launch Ops",
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
        category: "Fuel Systems",
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

    defaultMissions.forEach(mission => {
      this.missions.set(mission.id, mission);
    });
  }
}

export const storage = new MemStorage();
