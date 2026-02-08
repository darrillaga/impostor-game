import { TestRoomManager } from "@/ai/testing/TestRoomManager";

describe("TestRoomManager", () => {
  let manager: TestRoomManager;

  beforeEach(() => {
    manager = new TestRoomManager();
  });

  describe("Room Creation", () => {
    it("should create a test room with valid config", async () => {
      const room = await manager.createTestRoom({
        name: "Test Room 1",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      expect(room.id).toContain("test-");
      expect(room.name).toBe("Test Room 1");
      expect(room.playerCount).toBe(6);
      expect(room.impostorCount).toBe(1);
      expect(room.gameMode).toBe("category-nofirst");
      expect(room.password).toBeDefined();
      expect(room.password.length).toBeGreaterThan(0);
      expect(room.status).toBe("waiting");
      expect(room.createdAt).toBeDefined();
    });

    it("should create rooms with optional category and word", async () => {
      const room = await manager.createTestRoom({
        name: "Test Room 2",
        playerCount: 8,
        impostorCount: 2,
        gameMode: "clue-random",
        category: "Animals",
        word: "Elephant",
      });

      expect(room.category).toBe("Animals");
      expect(room.word).toBe("Elephant");
    });
  });

  describe("Room Retrieval", () => {
    it("should get room by ID", async () => {
      const created = await manager.createTestRoom({
        name: "Test Room",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      const retrieved = manager.getRoom(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(created.name);
    });

    it("should return undefined for non-existent room", () => {
      const room = manager.getRoom("non-existent");
      expect(room).toBeUndefined();
    });

    it("should get all rooms", async () => {
      await manager.createTestRoom({
        name: "Room 1",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      await manager.createTestRoom({
        name: "Room 2",
        playerCount: 8,
        impostorCount: 2,
        gameMode: "clue-random",
      });

      const rooms = manager.getAllRooms();

      expect(rooms).toHaveLength(2);
      expect(rooms.map((r) => r.name)).toContain("Room 1");
      expect(rooms.map((r) => r.name)).toContain("Room 2");
    });

    it("should get only active rooms", async () => {
      const room1 = await manager.createTestRoom({
        name: "Active Room",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      const room2 = await manager.createTestRoom({
        name: "Completed Room",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      manager.updateRoomStatus(room2.id, "completed");

      const activeRooms = manager.getActiveRooms();

      expect(activeRooms).toHaveLength(1);
      expect(activeRooms[0].id).toBe(room1.id);
    });
  });

  describe("Room Status Management", () => {
    it("should update room status", async () => {
      const room = await manager.createTestRoom({
        name: "Test Room",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      expect(room.status).toBe("waiting");

      manager.updateRoomStatus(room.id, "in-progress");
      const updated = manager.getRoom(room.id);

      expect(updated?.status).toBe("in-progress");
    });

    it("should handle status update for non-existent room", () => {
      expect(() => {
        manager.updateRoomStatus("non-existent", "completed");
      }).not.toThrow();
    });
  });

  describe("Room Deletion", () => {
    it("should delete room by ID", async () => {
      const room = await manager.createTestRoom({
        name: "Test Room",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      const deleted = manager.deleteRoom(room.id);

      expect(deleted).toBe(true);
      expect(manager.getRoom(room.id)).toBeUndefined();
    });

    it("should return false when deleting non-existent room", () => {
      const deleted = manager.deleteRoom("non-existent");
      expect(deleted).toBe(false);
    });
  });

  describe("Room Cleanup", () => {
    it("should clean up old completed rooms", async () => {
      const room1 = await manager.createTestRoom({
        name: "Old Room",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      const room2 = await manager.createTestRoom({
        name: "Recent Room",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      manager.updateRoomStatus(room1.id, "completed");
      manager.updateRoomStatus(room2.id, "completed");

      // Manually set old timestamp
      const oldRoom = manager.getRoom(room1.id);
      if (oldRoom) {
        oldRoom.createdAt = Date.now() - 4000000; // Over 1 hour ago
      }

      const cleaned = manager.cleanupOldRooms(3600000); // 1 hour

      expect(cleaned).toBe(1);
      expect(manager.getRoom(room1.id)).toBeUndefined();
      expect(manager.getRoom(room2.id)).toBeDefined();
    });

    it("should not clean up active rooms", async () => {
      const room = await manager.createTestRoom({
        name: "Active Room",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      // Manually set old timestamp
      const activeRoom = manager.getRoom(room.id);
      if (activeRoom) {
        activeRoom.createdAt = Date.now() - 4000000;
      }

      const cleaned = manager.cleanupOldRooms(3600000);

      expect(cleaned).toBe(0);
      expect(manager.getRoom(room.id)).toBeDefined();
    });
  });

  describe("Password Verification", () => {
    it("should verify correct password", async () => {
      const room = await manager.createTestRoom({
        name: "Test Room",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      const verified = manager.verifyPassword(room.id, room.password);
      expect(verified).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const room = await manager.createTestRoom({
        name: "Test Room",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      const verified = manager.verifyPassword(room.id, "wrong-password");
      expect(verified).toBe(false);
    });

    it("should return false for non-existent room", () => {
      const verified = manager.verifyPassword("non-existent", "password");
      expect(verified).toBe(false);
    });
  });

  describe("Statistics", () => {
    it("should get room count by status", async () => {
      const room1 = await manager.createTestRoom({
        name: "Room 1",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      const room2 = await manager.createTestRoom({
        name: "Room 2",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      const room3 = await manager.createTestRoom({
        name: "Room 3",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      manager.updateRoomStatus(room2.id, "in-progress");
      manager.updateRoomStatus(room3.id, "completed");

      const counts = manager.getRoomCountByStatus();

      expect(counts.waiting).toBe(1);
      expect(counts["in-progress"]).toBe(1);
      expect(counts.completed).toBe(1);
    });

    it("should generate comprehensive statistics", async () => {
      await manager.createTestRoom({
        name: "Room 1",
        playerCount: 6,
        impostorCount: 1,
        gameMode: "category-nofirst",
      });

      await manager.createTestRoom({
        name: "Room 2",
        playerCount: 8,
        impostorCount: 2,
        gameMode: "clue-random",
      });

      const room3 = await manager.createTestRoom({
        name: "Room 3",
        playerCount: 10,
        impostorCount: 2,
        gameMode: "category-nofirst",
      });

      manager.updateRoomStatus(room3.id, "completed");

      const stats = manager.getStatistics();

      expect(stats.totalRooms).toBe(3);
      expect(stats.activeRooms).toBe(2);
      expect(stats.completedRooms).toBe(1);
      expect(stats.byGameMode["category-nofirst"]).toBe(2);
      expect(stats.byGameMode["clue-random"]).toBe(1);
      expect(stats.averagePlayerCount).toBe(8); // (6 + 8 + 10) / 3
    });

    it("should handle empty room list", () => {
      const stats = manager.getStatistics();

      expect(stats.totalRooms).toBe(0);
      expect(stats.activeRooms).toBe(0);
      expect(stats.completedRooms).toBe(0);
      expect(stats.averagePlayerCount).toBe(0);
    });
  });
});
