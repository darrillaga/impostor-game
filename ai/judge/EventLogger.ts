import { GameEvent } from "../types";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";

export class EventLogger {
  private events: GameEvent[] = [];
  private gameId: string;
  private logsDir: string;

  constructor(gameId: string, logsDir: string = "./logs/games") {
    this.gameId = gameId;
    this.logsDir = logsDir;
  }

  /**
   * Log an event
   */
  logEvent(
    type: GameEvent["type"],
    roomId: string,
    data: any
  ): GameEvent {
    const event: GameEvent = {
      eventId: uuidv4(),
      timestamp: Date.now(),
      type,
      roomId,
      data,
    };

    this.events.push(event);

    console.log(`[EventLogger] ${type}:`, data);

    return event;
  }

  /**
   * Log phase change
   */
  logPhaseChange(roomId: string, phase: string, roundNumber?: number): GameEvent {
    return this.logEvent("phase_change", roomId, { phase, roundNumber });
  }

  /**
   * Log player joined
   */
  logPlayerJoined(roomId: string, playerId: string, playerName: string): GameEvent {
    return this.logEvent("player_joined", roomId, { playerId, playerName });
  }

  /**
   * Log vote cast
   */
  logVoteCast(roomId: string, voterId: string, targetId: string): GameEvent {
    return this.logEvent("vote_cast", roomId, { voterId, targetId });
  }

  /**
   * Log player eliminated
   */
  logPlayerEliminated(
    roomId: string,
    playerId: string,
    isImpostor: boolean,
    roundNumber: number
  ): GameEvent {
    return this.logEvent("player_eliminated", roomId, {
      playerId,
      isImpostor,
      roundNumber,
    });
  }

  /**
   * Log game start
   */
  logGameStart(
    roomId: string,
    playerCount: number,
    impostorCount: number,
    gameMode: string
  ): GameEvent {
    return this.logEvent("game_start", roomId, {
      playerCount,
      impostorCount,
      gameMode,
      startTime: Date.now(),
    });
  }

  /**
   * Log game end
   */
  logGameEnd(
    roomId: string,
    winner: "impostors" | "normals",
    roundsPlayed: number,
    duration: number
  ): GameEvent {
    return this.logEvent("game_end", roomId, {
      winner,
      roundsPlayed,
      duration,
      endTime: Date.now(),
    });
  }

  /**
   * Get all events
   */
  getEvents(): GameEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(type: GameEvent["type"]): GameEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Get events in time range
   */
  getEventsInRange(startTime: number, endTime: number): GameEvent[] {
    return this.events.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );
  }

  /**
   * Get event count
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    console.log(`[EventLogger] Cleared all events for game ${this.gameId}`);
  }

  /**
   * Save events to file
   */
  async saveToFile(): Promise<string> {
    try {
      // Ensure logs directory exists
      await fs.mkdir(this.logsDir, { recursive: true });

      const filename = `game-${this.gameId}-${Date.now()}.json`;
      const filepath = path.join(this.logsDir, filename);

      const logData = {
        gameId: this.gameId,
        eventCount: this.events.length,
        timestamp: Date.now(),
        events: this.events,
      };

      await fs.writeFile(filepath, JSON.stringify(logData, null, 2), "utf-8");

      console.log(`[EventLogger] Saved ${this.events.length} events to ${filepath}`);

      return filepath;
    } catch (error) {
      console.error(`[EventLogger] Error saving events:`, error);
      throw error;
    }
  }

  /**
   * Load events from file
   */
  static async loadFromFile(filepath: string): Promise<EventLogger> {
    try {
      const content = await fs.readFile(filepath, "utf-8");
      const logData = JSON.parse(content);

      const logger = new EventLogger(logData.gameId);
      logger.events = logData.events;

      console.log(`[EventLogger] Loaded ${logger.events.length} events from ${filepath}`);

      return logger;
    } catch (error) {
      console.error(`[EventLogger] Error loading events:`, error);
      throw error;
    }
  }

  /**
   * Export events as CSV
   */
  async exportToCSV(): Promise<string> {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });

      const filename = `game-${this.gameId}-${Date.now()}.csv`;
      const filepath = path.join(this.logsDir, filename);

      const headers = "eventId,timestamp,type,roomId,data\n";
      const rows = this.events.map((event) =>
        [
          event.eventId,
          event.timestamp,
          event.type,
          event.roomId,
          JSON.stringify(event.data),
        ].join(",")
      );

      const csv = headers + rows.join("\n");

      await fs.writeFile(filepath, csv, "utf-8");

      console.log(`[EventLogger] Exported ${this.events.length} events to ${filepath}`);

      return filepath;
    } catch (error) {
      console.error(`[EventLogger] Error exporting to CSV:`, error);
      throw error;
    }
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalEvents: number;
    eventTypes: Record<string, number>;
    duration: number;
    firstEvent: number;
    lastEvent: number;
  } {
    const eventTypes: Record<string, number> = {};

    this.events.forEach((event) => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });

    const timestamps = this.events.map((e) => e.timestamp);
    const firstEvent = Math.min(...timestamps);
    const lastEvent = Math.max(...timestamps);

    return {
      totalEvents: this.events.length,
      eventTypes,
      duration: lastEvent - firstEvent,
      firstEvent,
      lastEvent,
    };
  }
}
