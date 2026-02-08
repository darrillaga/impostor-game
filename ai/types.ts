export type AgentPersonality =
  | "aggressive"    // Votes quickly, accuses others
  | "defensive"     // Defends self, cautious voting
  | "analytical"    // Takes time, logical reasoning
  | "random"        // Unpredictable behavior
  | "silent"        // Says little, observes
  | "chaotic";      // Erratic, confusing behavior

export interface AgentConfig {
  agentId: string;
  name: string;
  personality: AgentPersonality;
  creativityLevel: number; // 0-1, affects GPT temperature
}

export interface GameAction {
  type: "discussion" | "vote" | "reveal";
  playerId: string;
  timestamp: number;
  data: any;
}

export interface GameMemory {
  gameId: string;
  agentId: string;
  role: "impostor" | "normal";
  word?: string;
  category: string;
  actions: GameAction[];
  outcome: "win" | "loss";
  eliminated: boolean;
  roundNumber: number;
  strategy: string; // What the agent tried to do
  effectiveness: number; // 0-1, how well it worked
  metadata: {
    timestamp: number;
    playerCount: number;
    impostorCount: number;
    gameMode: string;
  };
}

export interface MemoryQuery {
  role?: "impostor" | "normal";
  outcome?: "win" | "loss";
  category?: string;
  limit: number;
}

export interface AgentDecision {
  action: string;
  reasoning: string;
  confidence: number; // 0-1
}

export interface GameEvent {
  eventId: string;
  timestamp: number;
  type: "phase_change" | "player_joined" | "vote_cast" | "player_eliminated" | "game_start" | "game_end";
  roomId: string;
  data: any;
}

export interface JudgeAnalysis {
  gameId: string;
  timestamp: number;
  duration: number; // Game duration in seconds
  playerCount: number;
  impostorCount: number;
  gameMode: string;
  winner: "impostors" | "normals";
  roundsPlayed: number;

  // Behavioral analysis
  votingPatterns: {
    playerId: string;
    votedFor: string[];
    wasEliminated: boolean;
    role: "impostor" | "normal";
  }[];

  // Balance metrics
  impostorWinRate: number;
  averageGameDuration: number;
  eliminationAccuracy: number; // % of correct impostor eliminations

  // Issues detected
  issues: {
    type: "balance" | "bug" | "exploit" | "timing";
    severity: "low" | "medium" | "high";
    description: string;
    affectedPlayers?: string[];
  }[];

  // Recommendations
  recommendations: string[];

  // Raw data
  events: GameEvent[];
}

export interface TestConfig {
  testId: string;
  numberOfGames: number;
  agentConfigs: AgentConfig[];
  gameMode: "clue-random" | "category-nofirst";
  impostorCount: number;
}

export interface TestResults {
  testId: string;
  config: TestConfig;
  gamesPlayed: number;
  analyses: JudgeAnalysis[];
  aggregateStats: {
    impostorWinRate: number;
    averageGameDuration: number;
    averageRounds: number;
    mostCommonIssues: string[];
  };
  timestamp: number;
}
