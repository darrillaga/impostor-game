import { nanoid } from "nanoid";

export interface TestRoom {
  id: string;
  name: string;
  password: string;
  playerCount: number;
  impostorCount: number;
  gameMode: string;
  category?: string;
  word?: string;
  createdAt: number;
  status: "waiting" | "in-progress" | "completed";
}

export class TestRoomManager {
  private rooms: Map<string, TestRoom> = new Map();
  private serverUrl: string;

  constructor(serverUrl: string = "http://localhost:3000") {
    this.serverUrl = serverUrl;
  }

  /**
   * Create a test room
   */
  async createTestRoom(config: {
    name: string;
    playerCount: number;
    impostorCount: number;
    gameMode: string;
    category?: string;
    word?: string;
  }): Promise<TestRoom> {
    const roomId = `test-${nanoid(8)}`;
    const password = nanoid(6);

    const room: TestRoom = {
      id: roomId,
      name: config.name,
      password,
      playerCount: config.playerCount,
      impostorCount: config.impostorCount,
      gameMode: config.gameMode,
      category: config.category,
      word: config.word,
      createdAt: Date.now(),
      status: "waiting",
    };

    this.rooms.set(roomId, room);

    console.log(`[TestRoomManager] Created test room: ${roomId}`);
    console.log(`[TestRoomManager] Password: ${password}`);

    return room;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): TestRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get all rooms
   */
  getAllRooms(): TestRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get active rooms
   */
  getActiveRooms(): TestRoom[] {
    return Array.from(this.rooms.values()).filter(
      (room) => room.status === "waiting" || room.status === "in-progress"
    );
  }

  /**
   * Update room status
   */
  updateRoomStatus(roomId: string, status: TestRoom["status"]): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
      console.log(`[TestRoomManager] Room ${roomId} status: ${status}`);
    }
  }

  /**
   * Delete room
   */
  deleteRoom(roomId: string): boolean {
    const deleted = this.rooms.delete(roomId);
    if (deleted) {
      console.log(`[TestRoomManager] Deleted room: ${roomId}`);
    }
    return deleted;
  }

  /**
   * Clean up old completed rooms
   */
  cleanupOldRooms(maxAge: number = 3600000): number {
    const now = Date.now();
    let cleaned = 0;

    this.rooms.forEach((room, roomId) => {
      if (room.status === "completed" && now - room.createdAt > maxAge) {
        this.deleteRoom(roomId);
        cleaned++;
      }
    });

    console.log(`[TestRoomManager] Cleaned up ${cleaned} old rooms`);
    return cleaned;
  }

  /**
   * Get room count by status
   */
  getRoomCountByStatus(): Record<TestRoom["status"], number> {
    const counts = {
      waiting: 0,
      "in-progress": 0,
      completed: 0,
    };

    this.rooms.forEach((room) => {
      counts[room.status]++;
    });

    return counts;
  }

  /**
   * Verify room password
   */
  verifyPassword(roomId: string, password: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.password === password : false;
  }

  /**
   * Get room statistics
   */
  getStatistics(): {
    totalRooms: number;
    activeRooms: number;
    completedRooms: number;
    byGameMode: Record<string, number>;
    averagePlayerCount: number;
  } {
    const rooms = Array.from(this.rooms.values());

    const byGameMode: Record<string, number> = {};
    let totalPlayers = 0;

    rooms.forEach((room) => {
      byGameMode[room.gameMode] = (byGameMode[room.gameMode] || 0) + 1;
      totalPlayers += room.playerCount;
    });

    return {
      totalRooms: rooms.length,
      activeRooms: rooms.filter((r) => r.status !== "completed").length,
      completedRooms: rooms.filter((r) => r.status === "completed").length,
      byGameMode,
      averagePlayerCount: rooms.length > 0 ? totalPlayers / rooms.length : 0,
    };
  }
}

// Singleton instance
let testRoomManager: TestRoomManager | null = null;

export function getTestRoomManager(serverUrl?: string): TestRoomManager {
  if (!testRoomManager) {
    testRoomManager = new TestRoomManager(serverUrl);
  }
  return testRoomManager;
}
