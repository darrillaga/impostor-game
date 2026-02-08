import { EventLogger } from "./EventLogger";
import { GameEvent, JudgeAnalysis, GameMemory } from "../types";
import { generateChatCompletion } from "@/lib/openai";

export interface GameSnapshot {
  roomId: string;
  gameId: string;
  players: Map<string, PlayerState>;
  impostors: Set<string>;
  word: string;
  category: string;
  gameMode: string;
  roundNumber: number;
  phase: string;
  startTime: number;
  endTime?: number;
}

export interface PlayerState {
  id: string;
  name: string;
  isImpostor: boolean;
  isAlive: boolean;
  votesReceived: number;
  votesGiven: string[];
  statements: string[];
  recordedVideo: boolean;
}

export interface VotingRound {
  roundNumber: number;
  votes: Map<string, string>; // voterId -> targetId
  eliminated: string | null;
  wasImpostor: boolean;
}

export class JudgeAgent {
  private eventLogger: EventLogger;
  private gameSnapshots: Map<string, GameSnapshot> = new Map();
  private activeGames: Set<string> = new Set();

  constructor(eventLogger: EventLogger) {
    this.eventLogger = eventLogger;
  }

  /**
   * Initialize game observation
   */
  startObserving(
    roomId: string,
    gameId: string,
    players: string[],
    impostorIds: string[],
    word: string,
    category: string,
    gameMode: string
  ): void {
    const playerStates = new Map<string, PlayerState>();

    players.forEach((playerId) => {
      playerStates.set(playerId, {
        id: playerId,
        name: `Player-${playerId.slice(0, 6)}`,
        isImpostor: impostorIds.includes(playerId),
        isAlive: true,
        votesReceived: 0,
        votesGiven: [],
        statements: [],
        recordedVideo: false,
      });
    });

    const snapshot: GameSnapshot = {
      roomId,
      gameId,
      players: playerStates,
      impostors: new Set(impostorIds),
      word,
      category,
      gameMode,
      roundNumber: 1,
      phase: "setup",
      startTime: Date.now(),
    };

    this.gameSnapshots.set(gameId, snapshot);
    this.activeGames.add(gameId);

    console.log(`[JudgeAgent] Started observing game ${gameId} in room ${roomId}`);
    console.log(`[JudgeAgent] Players: ${players.length}, Impostors: ${impostorIds.length}`);
    console.log(`[JudgeAgent] Word: "${word}", Category: "${category}", Mode: "${gameMode}"`);
  }

  /**
   * Record player action
   */
  recordPlayerAction(
    gameId: string,
    playerId: string,
    action: "statement" | "vote" | "video",
    data: any
  ): void {
    const snapshot = this.gameSnapshots.get(gameId);
    if (!snapshot) return;

    const player = snapshot.players.get(playerId);
    if (!player) return;

    switch (action) {
      case "statement":
        player.statements.push(data.statement);
        break;
      case "vote":
        player.votesGiven.push(data.targetId);
        const target = snapshot.players.get(data.targetId);
        if (target) target.votesReceived++;
        break;
      case "video":
        player.recordedVideo = true;
        break;
    }

    console.log(`[JudgeAgent] Recorded ${action} from ${player.name}`);
  }

  /**
   * Record phase change
   */
  recordPhaseChange(gameId: string, phase: string, roundNumber?: number): void {
    const snapshot = this.gameSnapshots.get(gameId);
    if (!snapshot) return;

    snapshot.phase = phase;
    if (roundNumber) {
      snapshot.roundNumber = roundNumber;
    }

    console.log(`[JudgeAgent] Game ${gameId} phase: ${phase}, round: ${snapshot.roundNumber}`);
  }

  /**
   * Record player elimination
   */
  recordElimination(gameId: string, playerId: string): void {
    const snapshot = this.gameSnapshots.get(gameId);
    if (!snapshot) return;

    const player = snapshot.players.get(playerId);
    if (!player) return;

    player.isAlive = false;
    console.log(`[JudgeAgent] Player ${player.name} (impostor: ${player.isImpostor}) eliminated in round ${snapshot.roundNumber}`);
  }

  /**
   * End game observation and analyze
   */
  async endObserving(
    gameId: string,
    winner: "impostors" | "normals"
  ): Promise<JudgeAnalysis> {
    const snapshot = this.gameSnapshots.get(gameId);
    if (!snapshot) {
      throw new Error(`No game snapshot found for ${gameId}`);
    }

    snapshot.endTime = Date.now();
    this.activeGames.delete(gameId);

    console.log(`[JudgeAgent] Analyzing game ${gameId}...`);

    // Generate comprehensive analysis
    const analysis = await this.analyzeGame(snapshot, winner);

    console.log(`[JudgeAgent] Analysis complete for game ${gameId}`);
    console.log(`[JudgeAgent] Overall assessment: ${analysis.overallAssessment}`);

    return analysis;
  }

  /**
   * Analyze game and generate report
   */
  private async analyzeGame(
    snapshot: GameSnapshot,
    winner: "impostors" | "normals"
  ): Promise<JudgeAnalysis> {
    const duration = snapshot.endTime! - snapshot.startTime;
    const players = Array.from(snapshot.players.values());
    const impostors = players.filter((p) => p.isImpostor);
    const normals = players.filter((p) => !p.isImpostor);

    // Calculate voting accuracy
    const votingAccuracy = this.calculateVotingAccuracy(snapshot);

    // Generate AI analysis
    const aiInsights = await this.generateAIAnalysis(snapshot, winner, votingAccuracy);

    // Detect potential issues
    const issues = this.detectIssues(snapshot, votingAccuracy);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(snapshot, issues, aiInsights);

    const analysis: JudgeAnalysis = {
      gameId: snapshot.gameId,
      roomId: snapshot.roomId,
      timestamp: Date.now(),
      gameMetrics: {
        duration,
        roundsPlayed: snapshot.roundNumber,
        playerCount: players.length,
        impostorCount: impostors.length,
        winner,
        impostorWinRate: winner === "impostors" ? 1 : 0,
        averageRoundDuration: duration / snapshot.roundNumber,
      },
      votingPatterns: {
        accuracy: votingAccuracy,
        totalVotes: players.reduce((sum, p) => sum + p.votesGiven.length, 0),
        votesPerPlayer: players.reduce((sum, p) => sum + p.votesGiven.length, 0) / players.length,
        impostorsIdentifiedCorrectly: this.countCorrectImpostorIdentifications(snapshot),
        innocentsEliminated: this.countInnocentEliminations(snapshot),
      },
      playerPerformance: players.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        role: player.isImpostor ? "impostor" : "normal",
        survived: player.isAlive,
        votesReceived: player.votesReceived,
        votingAccuracy: this.calculatePlayerVotingAccuracy(player, snapshot),
        suspicionLevel: player.votesReceived / Math.max(1, players.filter(p => p.isAlive).length - 1),
      })),
      balanceMetrics: {
        gameMode: snapshot.gameMode,
        category: snapshot.category,
        word: snapshot.word,
        impostorAdvantage: this.calculateImpostorAdvantage(snapshot, winner),
        firstPlayerAdvantage: this.calculateFirstPlayerAdvantage(snapshot),
        videoUsageRate: players.filter((p) => p.recordedVideo).length / players.length,
      },
      issues,
      recommendations,
      aiInsights,
      overallAssessment: this.generateOverallAssessment(snapshot, winner, votingAccuracy, issues),
      eventSummary: this.generateEventSummary(),
    };

    return analysis;
  }

  /**
   * Calculate voting accuracy (how often players voted for impostors)
   */
  private calculateVotingAccuracy(snapshot: GameSnapshot): number {
    const players = Array.from(snapshot.players.values());
    let totalVotes = 0;
    let correctVotes = 0;

    players.forEach((player) => {
      player.votesGiven.forEach((targetId) => {
        totalVotes++;
        const target = snapshot.players.get(targetId);
        if (target && target.isImpostor) {
          correctVotes++;
        }
      });
    });

    return totalVotes > 0 ? correctVotes / totalVotes : 0;
  }

  /**
   * Calculate player's voting accuracy
   */
  private calculatePlayerVotingAccuracy(player: PlayerState, snapshot: GameSnapshot): number {
    if (player.votesGiven.length === 0) return 0;

    const correctVotes = player.votesGiven.filter((targetId) => {
      const target = snapshot.players.get(targetId);
      return target && target.isImpostor;
    }).length;

    return correctVotes / player.votesGiven.length;
  }

  /**
   * Count correct impostor identifications
   */
  private countCorrectImpostorIdentifications(snapshot: GameSnapshot): number {
    const players = Array.from(snapshot.players.values());
    const eliminatedImpostors = players.filter((p) => p.isImpostor && !p.isAlive);
    return eliminatedImpostors.length;
  }

  /**
   * Count innocent eliminations
   */
  private countInnocentEliminations(snapshot: GameSnapshot): number {
    const players = Array.from(snapshot.players.values());
    const eliminatedInnocents = players.filter((p) => !p.isImpostor && !p.isAlive);
    return eliminatedInnocents.length;
  }

  /**
   * Calculate impostor advantage metric
   */
  private calculateImpostorAdvantage(snapshot: GameSnapshot, winner: "impostors" | "normals"): number {
    // Positive value = impostor advantage, negative = normal advantage
    const impostorCount = snapshot.impostors.size;
    const totalPlayers = snapshot.players.size;
    const expectedImpostorWinRate = impostorCount / totalPlayers; // Rough estimate

    const actualOutcome = winner === "impostors" ? 1 : 0;
    return actualOutcome - expectedImpostorWinRate;
  }

  /**
   * Calculate first player advantage
   */
  private calculateFirstPlayerAdvantage(snapshot: GameSnapshot): number {
    // Check if first player (if we track order) was eliminated
    // For now, return 0 as we need more data
    return 0;
  }

  /**
   * Detect potential issues
   */
  private detectIssues(snapshot: GameSnapshot, votingAccuracy: number): string[] {
    const issues: string[] = [];
    const players = Array.from(snapshot.players.values());
    const duration = snapshot.endTime! - snapshot.startTime;

    // Game too short
    if (duration < 60000) {
      issues.push("Game ended very quickly (<1 minute) - possible balance issue or bug");
    }

    // Game too long
    if (duration > 900000) {
      issues.push("Game lasted very long (>15 minutes) - possible stalemate or indecision");
    }

    // Low voting accuracy
    if (votingAccuracy < 0.3) {
      issues.push(`Very low voting accuracy (${(votingAccuracy * 100).toFixed(1)}%) - players struggling to identify impostors`);
    }

    // High voting accuracy (might be too easy)
    if (votingAccuracy > 0.8) {
      issues.push(`Very high voting accuracy (${(votingAccuracy * 100).toFixed(1)}%) - game might be too easy for normals`);
    }

    // Too many rounds
    if (snapshot.roundNumber > 5) {
      issues.push(`Many rounds played (${snapshot.roundNumber}) - consider game length balance`);
    }

    // No one recorded video
    const videoCount = players.filter((p) => p.recordedVideo).length;
    if (videoCount === 0) {
      issues.push("No players recorded videos - video feature not being used");
    }

    // Check for inactive players (no votes)
    const inactivePlayers = players.filter((p) => p.votesGiven.length === 0);
    if (inactivePlayers.length > 0) {
      issues.push(`${inactivePlayers.length} player(s) did not vote - possible AFK or UI issue`);
    }

    return issues;
  }

  /**
   * Generate AI-powered analysis insights
   */
  private async generateAIAnalysis(
    snapshot: GameSnapshot,
    winner: "impostors" | "normals",
    votingAccuracy: number
  ): Promise<string> {
    const players = Array.from(snapshot.players.values());
    const duration = (snapshot.endTime! - snapshot.startTime) / 1000; // seconds

    const prompt = `Analyze this Impostor game session:

**Game Details:**
- Players: ${players.length} (${snapshot.impostors.size} impostors)
- Winner: ${winner}
- Duration: ${duration.toFixed(0)} seconds
- Rounds: ${snapshot.roundNumber}
- Mode: ${snapshot.gameMode}
- Category: ${snapshot.category}
- Voting accuracy: ${(votingAccuracy * 100).toFixed(1)}%

**Player Performance:**
${players.map((p, i) => `${i + 1}. ${p.name} (${p.isImpostor ? "IMPOSTOR" : "normal"}) - ${p.isAlive ? "survived" : "eliminated"}, received ${p.votesReceived} votes, voted ${p.votesGiven.length} times`).join("\n")}

**Video Recording:**
${players.filter((p) => p.recordedVideo).length}/${players.length} players recorded videos

Provide 2-3 key insights about:
1. What patterns emerged in this game?
2. Did the game mode/category affect the outcome?
3. Any interesting player behaviors?

Keep response under 150 words.`;

    try {
      const insights = await generateChatCompletion(
        [
          {
            role: "system",
            content: "You are an expert game analyst specializing in social deduction games. Provide concise, data-driven insights.",
          },
          { role: "user", content: prompt },
        ],
        { temperature: 0.5, maxTokens: 200 }
      );

      return insights;
    } catch (error) {
      console.error("[JudgeAgent] Error generating AI insights:", error);
      return "AI analysis unavailable - error during generation.";
    }
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    snapshot: GameSnapshot,
    issues: string[],
    aiInsights: string
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (issues.length === 0) {
      recommendations.push("Game session ran smoothly with no major issues detected");
    } else {
      // Generate AI recommendations based on issues
      const prompt = `Given these issues in an Impostor game session:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

And these AI insights:
${aiInsights}

Suggest 2-3 specific, actionable recommendations to improve the game. Keep it concise.`;

      try {
        const aiRecommendations = await generateChatCompletion(
          [
            {
              role: "system",
              content: "You are a game designer specializing in social deduction games. Provide specific, actionable recommendations.",
            },
            { role: "user", content: prompt },
          ],
          { temperature: 0.6, maxTokens: 150 }
        );

        // Split by newlines and filter
        const recs = aiRecommendations
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .map((line) => line.replace(/^\d+\.\s*/, "").trim())
          .filter((line) => line.length > 10);

        recommendations.push(...recs);
      } catch (error) {
        console.error("[JudgeAgent] Error generating recommendations:", error);
        recommendations.push("Review game issues and adjust balance parameters");
      }
    }

    return recommendations;
  }

  /**
   * Generate overall assessment
   */
  private generateOverallAssessment(
    snapshot: GameSnapshot,
    winner: "impostors" | "normals",
    votingAccuracy: number,
    issues: string[]
  ): string {
    const duration = (snapshot.endTime! - snapshot.startTime) / 60000; // minutes
    const players = Array.from(snapshot.players.values());

    let assessment = `Game completed in ${duration.toFixed(1)} minutes over ${snapshot.roundNumber} round(s). `;
    assessment += `${winner === "impostors" ? "Impostors" : "Normals"} won. `;
    assessment += `Voting accuracy was ${(votingAccuracy * 100).toFixed(1)}%. `;

    if (issues.length === 0) {
      assessment += "No major issues detected. Game balance appears healthy.";
    } else if (issues.length <= 2) {
      assessment += `Minor issues detected (${issues.length}). Overall game flow was acceptable.`;
    } else {
      assessment += `Multiple issues detected (${issues.length}). Review recommended.`;
    }

    return assessment;
  }

  /**
   * Generate event summary from EventLogger
   */
  private generateEventSummary(): any {
    return this.eventLogger.getSummary();
  }

  /**
   * Get active games
   */
  getActiveGames(): string[] {
    return Array.from(this.activeGames);
  }

  /**
   * Check if observing a specific game
   */
  isObserving(gameId: string): boolean {
    return this.activeGames.has(gameId);
  }

  /**
   * Get game snapshot (for debugging)
   */
  getGameSnapshot(gameId: string): GameSnapshot | undefined {
    return this.gameSnapshots.get(gameId);
  }
}
