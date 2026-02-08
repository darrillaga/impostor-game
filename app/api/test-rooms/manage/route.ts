import { NextRequest, NextResponse } from "next/server";
import { getTestRoomManager } from "@/ai/testing/TestRoomManager";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, status } = body;

    if (!roomId || !status) {
      return NextResponse.json(
        { error: "Missing roomId or status" },
        { status: 400 }
      );
    }

    const manager = getTestRoomManager();
    const room = manager.getRoom(roomId);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    manager.updateRoomStatus(roomId, status);

    return NextResponse.json({
      success: true,
      room: manager.getRoom(roomId),
    });
  } catch (error) {
    console.error("Error updating test room:", error);
    return NextResponse.json(
      { error: "Failed to update test room" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const cleanup = searchParams.get("cleanup") === "true";

    const manager = getTestRoomManager();

    if (cleanup) {
      // Clean up old completed rooms
      const cleaned = manager.cleanupOldRooms();
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${cleaned} old rooms`,
        cleaned,
      });
    }

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const deleted = manager.deleteRoom(roomId);

    if (!deleted) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Room ${roomId} deleted`,
    });
  } catch (error) {
    console.error("Error deleting test room:", error);
    return NextResponse.json(
      { error: "Failed to delete test room" },
      { status: 500 }
    );
  }
}
