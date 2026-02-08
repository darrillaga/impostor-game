import { EventLogger } from "@/ai/judge/EventLogger";
import * as fs from "fs/promises";

// Mock fs
jest.mock("fs/promises");

describe("EventLogger", () => {
  let logger: EventLogger;

  beforeEach(() => {
    logger = new EventLogger("test-game-123");
    jest.clearAllMocks();
  });

  describe("Event Logging", () => {
    it("should log game start event", () => {
      const event = logger.logGameStart("room-1", 6, 1, "category-nofirst");

      expect(event.type).toBe("game_start");
      expect(event.roomId).toBe("room-1");
      expect(event.data.playerCount).toBe(6);
      expect(event.data.impostorCount).toBe(1);
      expect(event.data.gameMode).toBe("category-nofirst");
      expect(event.eventId).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });

    it("should log player joined event", () => {
      const event = logger.logPlayerJoined("room-1", "player-1", "Alice");

      expect(event.type).toBe("player_joined");
      expect(event.data.playerId).toBe("player-1");
      expect(event.data.playerName).toBe("Alice");
    });

    it("should log phase change", () => {
      const event = logger.logPhaseChange("room-1", "discussion", 1);

      expect(event.type).toBe("phase_change");
      expect(event.data.phase).toBe("discussion");
      expect(event.data.roundNumber).toBe(1);
    });

    it("should log vote cast", () => {
      const event = logger.logVoteCast("room-1", "player-1", "player-2");

      expect(event.type).toBe("vote_cast");
      expect(event.data.voterId).toBe("player-1");
      expect(event.data.targetId).toBe("player-2");
    });

    it("should log player elimination", () => {
      const event = logger.logPlayerEliminated("room-1", "player-2", true, 1);

      expect(event.type).toBe("player_eliminated");
      expect(event.data.playerId).toBe("player-2");
      expect(event.data.isImpostor).toBe(true);
      expect(event.data.roundNumber).toBe(1);
    });

    it("should log game end", () => {
      const event = logger.logGameEnd("room-1", "normals", 3, 120000);

      expect(event.type).toBe("game_end");
      expect(event.data.winner).toBe("normals");
      expect(event.data.roundsPlayed).toBe(3);
      expect(event.data.duration).toBe(120000);
    });
  });

  describe("Event Retrieval", () => {
    beforeEach(() => {
      logger.logGameStart("room-1", 6, 1, "category-nofirst");
      logger.logPlayerJoined("room-1", "player-1", "Alice");
      logger.logPlayerJoined("room-1", "player-2", "Bob");
      logger.logPhaseChange("room-1", "discussion");
      logger.logVoteCast("room-1", "player-1", "player-2");
    });

    it("should return all events", () => {
      const events = logger.getEvents();
      expect(events).toHaveLength(5);
    });

    it("should filter events by type", () => {
      const playerEvents = logger.getEventsByType("player_joined");
      expect(playerEvents).toHaveLength(2);
      expect(playerEvents.every((e) => e.type === "player_joined")).toBe(true);
    });

    it("should filter events by time range", () => {
      const now = Date.now();
      const events = logger.getEventsInRange(now - 10000, now + 10000);
      expect(events).toHaveLength(5);
    });

    it("should return correct event count", () => {
      expect(logger.getEventCount()).toBe(5);
    });
  });

  describe("Event Management", () => {
    it("should clear all events", () => {
      logger.logGameStart("room-1", 6, 1, "category-nofirst");
      logger.logPlayerJoined("room-1", "player-1", "Alice");

      expect(logger.getEventCount()).toBe(2);

      logger.clearEvents();

      expect(logger.getEventCount()).toBe(0);
      expect(logger.getEvents()).toHaveLength(0);
    });
  });

  describe("Summary Statistics", () => {
    beforeEach(() => {
      logger.logGameStart("room-1", 6, 1, "category-nofirst");
      logger.logPlayerJoined("room-1", "player-1", "Alice");
      logger.logPlayerJoined("room-1", "player-2", "Bob");
      logger.logPhaseChange("room-1", "discussion");
      logger.logVoteCast("room-1", "player-1", "player-2");
      logger.logGameEnd("room-1", "normals", 3, 120000);
    });

    it("should generate summary statistics", () => {
      const summary = logger.getSummary();

      expect(summary.totalEvents).toBe(6);
      expect(summary.eventTypes["game_start"]).toBe(1);
      expect(summary.eventTypes["player_joined"]).toBe(2);
      expect(summary.eventTypes["phase_change"]).toBe(1);
      expect(summary.eventTypes["vote_cast"]).toBe(1);
      expect(summary.eventTypes["game_end"]).toBe(1);
      expect(summary.duration).toBeGreaterThanOrEqual(0);
      expect(summary.firstEvent).toBeDefined();
      expect(summary.lastEvent).toBeDefined();
    });
  });

  describe("File Operations", () => {
    it("should save events to JSON file", async () => {
      logger.logGameStart("room-1", 6, 1, "category-nofirst");
      logger.logGameEnd("room-1", "normals", 3, 120000);

      const mockMkdir = fs.mkdir as jest.Mock;
      const mockWriteFile = fs.writeFile as jest.Mock;

      await logger.saveToFile();

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();

      const writeCall = mockWriteFile.mock.calls[0];
      const filepath = writeCall[0];
      const content = writeCall[1];

      expect(filepath).toContain("game-test-game-123");
      expect(filepath).toContain(".json");

      const data = JSON.parse(content);
      expect(data.gameId).toBe("test-game-123");
      expect(data.eventCount).toBe(2);
      expect(data.events).toHaveLength(2);
    });

    it("should export events to CSV", async () => {
      logger.logGameStart("room-1", 6, 1, "category-nofirst");
      logger.logPlayerJoined("room-1", "player-1", "Alice");

      const mockMkdir = fs.mkdir as jest.Mock;
      const mockWriteFile = fs.writeFile as jest.Mock;

      await logger.exportToCSV();

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();

      const writeCall = mockWriteFile.mock.calls[0];
      const filepath = writeCall[0];
      const content = writeCall[1];

      expect(filepath).toContain(".csv");
      expect(content).toContain("eventId,timestamp,type,roomId,data");
      expect(content).toContain("game_start");
      expect(content).toContain("player_joined");
    });
  });
});
