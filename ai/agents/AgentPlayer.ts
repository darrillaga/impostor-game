import { io, Socket } from "socket.io-client";
import { AgentConfig, AgentDecision, GameMemory, GameAction } from "../types";
import { AgentMemory } from "./AgentMemory";
import { generateChatCompletion } from "@/lib/openai";
import {
  getSystemPrompt,
  getDiscussionPrompt,
  getVotingPrompt,
  getReflectionPrompt,
} from "./prompts";
import { v4 as uuidv4 } from "uuid";

export class AgentPlayer {
  private config: AgentConfig;
  private memory: AgentMemory;
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private playerId: string | null = null;

  // Game state
  private role: "impostor" | "normal" | null = null;
  private word: string | null = null;
  private category: string | null = null;
  private clue: string | null = null;
  private isAlive: boolean = true;
  private hasVoted: boolean = false;

  // Round data
  private currentGameId: string;
  private currentStrategy: string = "";
  private observations: string[] = [];
  private playerStatements: Map<string, string> = new Map();
  private roundNumber: number = 0;

  constructor(config: AgentConfig, serverUrl: string = "http://localhost:3000") {
    this.config = config;
    this.memory = new AgentMemory(config.agentId);
    this.currentGameId = uuidv4();

    // Connect to server
    this.socket = io(serverUrl, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log(`[${this.config.name}] Connected to server`);
    });

    this.socket.on("joinedRoom", (data) => {
      this.playerId = data.playerId;
      console.log(`[${this.config.name}] Joined room as ${this.playerId}`);
    });

    this.socket.on("gameStarted", async (data) => {
      this.role = data.isImpostor ? "impostor" : "normal";
      this.word = data.word || null;
      this.category = data.category;
      this.clue = data.impostorClue || null;
      this.roundNumber = 1;
      this.isAlive = true;
      this.observations = [];
      this.playerStatements.clear();

      console.log(`[${this.config.name}] Game started - Role: ${this.role}, Category: ${this.category}`);

      // Automatically reveal word
      await this.delay(1000);
      this.socket?.emit("wordRevealed", { roomId: this.roomId });

      // Automatically ready
      await this.delay(2000);
      this.socket?.emit("playerReady", { roomId: this.roomId });
    });

    this.socket.on("phaseChanged", async (data) => {
      console.log(`[${this.config.name}] Phase changed to: ${data.phase}`);

      if (data.phase === "discussion" && this.isAlive) {
        await this.handleDiscussion();
      } else if (data.phase === "voting" && this.isAlive && !this.hasVoted) {
        await this.handleVoting();
      }

      if (data.roundNumber) {
        this.roundNumber = data.roundNumber;
      }
    });

    this.socket.on("votingComplete", async (data) => {
      const { eliminatedPlayer, gameOver, impostorsWin } = data;

      if (eliminatedPlayer && eliminatedPlayer.id === this.playerId) {
        this.isAlive = false;
        console.log(`[${this.config.name}] I was eliminated`);
      }

      if (gameOver) {
        const won = (this.role === "impostor" && impostorsWin) ||
                     (this.role === "normal" && !impostorsWin);
        await this.handleGameEnd(won);
      }

      this.hasVoted = false;
    });

    this.socket.on("gameReset", () => {
      this.resetGameState();
    });

    this.socket.on("error", (data) => {
      console.error(`[${this.config.name}] Error:`, data.message);
    });
  }

  /**
   * Join a game room
   */
  async joinRoom(roomId: string, roomPassword: string): Promise<void> {
    this.roomId = roomId;

    return new Promise((resolve) => {
      this.socket?.emit("joinRoom", {
        roomId,
        playerName: this.config.name,
        roomPassword,
      });

      this.socket?.once("joinedRoom", () => {
        resolve();
      });
    });
  }

  /**
   * Handle discussion phase
   */
  private async handleDiscussion(): Promise<void> {
    try {
      // Wait a bit to simulate thinking
      await this.delay(2000 + Math.random() * 3000);

      // Get past experiences
      const pastExperiences = await this.getPastExperiences();

      // Generate statement using AI
      const prompt = getDiscussionPrompt(
        this.role!,
        this.word,
        this.category!,
        this.clue,
        this.observations,
        pastExperiences
      );

      const systemPrompt = getSystemPrompt(this.config.personality);

      const statement = await generateChatCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        {
          temperature: this.config.creativityLevel,
          maxTokens: 50,
        }
      );

      this.currentStrategy = `Said: "${statement}" to ${this.role === "impostor" ? "blend in" : "prove I know the word"}`;
      this.playerStatements.set(this.playerId!, statement);

      console.log(`[${this.config.name}] Discussion: "${statement}"`);

      // Note: In a real implementation, this would be sent to other players
      // For now, we just log it
    } catch (error) {
      console.error(`[${this.config.name}] Error in discussion:`, error);
    }
  }

  /**
   * Handle voting phase
   */
  private async handleVoting(): Promise<void> {
    try {
      // Wait a bit to simulate thinking
      await this.delay(3000 + Math.random() * 4000);

      // Get list of other players
      const players = Array.from(this.playerStatements.entries())
        .filter(([id]) => id !== this.playerId)
        .map(([id, statement], index) => ({
          id,
          name: `Player${index + 1}`,
          statement,
        }));

      if (players.length === 0) {
        console.log(`[${this.config.name}] No other players to vote for`);
        return;
      }

      // Get past experiences
      const pastExperiences = await this.getPastExperiences();

      // Generate vote using AI
      const myStatement = this.playerStatements.get(this.playerId!) || "";
      const prompt = getVotingPrompt(
        this.role!,
        players,
        myStatement,
        pastExperiences
      );

      const systemPrompt = getSystemPrompt(this.config.personality);

      const voteResponse = await generateChatCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        {
          temperature: this.config.creativityLevel,
          maxTokens: 10,
        }
      );

      // Parse vote (should be a number)
      const voteNumber = parseInt(voteResponse.trim());
      if (isNaN(voteNumber) || voteNumber < 1 || voteNumber > players.length) {
        // Default to random if parsing fails
        const targetPlayer = players[Math.floor(Math.random() * players.length)];
        this.socket?.emit("vote", {
          roomId: this.roomId,
          targetId: targetPlayer.id,
        });
        console.log(`[${this.config.name}] Voted for ${targetPlayer.name} (random fallback)`);
      } else {
        const targetPlayer = players[voteNumber - 1];
        this.socket?.emit("vote", {
          roomId: this.roomId,
          targetId: targetPlayer.id,
        });
        console.log(`[${this.config.name}] Voted for ${targetPlayer.name}`);
      }

      this.hasVoted = true;
    } catch (error) {
      console.error(`[${this.config.name}] Error in voting:`, error);
    }
  }

  /**
   * Handle game end and store memory
   */
  private async handleGameEnd(won: boolean): Promise<void> {
    try {
      console.log(`[${this.config.name}] Game ended - ${won ? "WON" : "LOST"}`);

      // Reflect on effectiveness
      const reflectionPrompt = getReflectionPrompt(
        this.role!,
        won,
        !this.isAlive,
        this.currentStrategy,
        this.roundNumber
      );

      const systemPrompt = getSystemPrompt(this.config.personality);

      const effectivenessStr = await generateChatCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: reflectionPrompt },
        ],
        {
          temperature: 0.3,
          maxTokens: 10,
        }
      );

      const effectiveness = Math.max(0, Math.min(1, parseFloat(effectivenessStr) || 0.5));

      // Store memory
      const memory: GameMemory = {
        gameId: this.currentGameId,
        agentId: this.config.agentId,
        role: this.role!,
        word: this.word || undefined,
        category: this.category!,
        actions: [],
        outcome: won ? "win" : "loss",
        eliminated: !this.isAlive,
        roundNumber: this.roundNumber,
        strategy: this.currentStrategy,
        effectiveness,
        metadata: {
          timestamp: Date.now(),
          playerCount: this.playerStatements.size,
          impostorCount: 1, // Simplified
          gameMode: "test",
        },
      };

      await this.memory.storeMemory(memory);
      console.log(`[${this.config.name}] Memory stored with effectiveness: ${effectiveness}`);

      // Reset for next game
      this.currentGameId = uuidv4();
    } catch (error) {
      console.error(`[${this.config.name}] Error handling game end:`, error);
    }
  }

  /**
   * Get past experiences as text
   */
  private async getPastExperiences(): Promise<string> {
    const memories = await this.memory.getSuccessfulStrategies(this.role!, 3);

    if (memories.length === 0) {
      return "No past experiences yet. This is a learning opportunity.";
    }

    const experiences = memories.map(
      (m, i) =>
        `${i + 1}. As ${m.role} in ${m.category}: ${m.strategy} (effectiveness: ${m.effectiveness.toFixed(2)})`
    );

    return `Past successful strategies:\n${experiences.join("\n")}`;
  }

  /**
   * Reset game state
   */
  private resetGameState(): void {
    this.role = null;
    this.word = null;
    this.category = null;
    this.clue = null;
    this.isAlive = true;
    this.hasVoted = false;
    this.currentStrategy = "";
    this.observations = [];
    this.playerStatements.clear();
    this.roundNumber = 0;
    console.log(`[${this.config.name}] Game state reset`);
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.socket?.disconnect();
    console.log(`[${this.config.name}] Disconnected`);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get player ID
   */
  getId(): string | null {
    return this.playerId;
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get agent config
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Check if alive
   */
  getIsAlive(): boolean {
    return this.isAlive;
  }

  /**
   * Get current role
   */
  getRole(): "impostor" | "normal" | null {
    return this.role;
  }
}
