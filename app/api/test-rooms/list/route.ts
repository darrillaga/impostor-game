import { NextRequest, NextResponse } from "next/server";
import { getTestRoomManager } from "@/ai/testing/TestRoomManager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "all", "active", "completed"

    const manager = getTestRoomManager();

    let rooms;
    if (filter === "active") {
      rooms = manager.getActiveRooms();
    } else {
      rooms = manager.getAllRooms();
    }

    if (filter === "completed") {
      rooms = rooms.filter((r) => r.status === "completed");
    }

    const statistics = manager.getStatistics();
    const statusCounts = manager.getRoomCountByStatus();

    return NextResponse.json({
      success: true,
      rooms,
      statistics,
      statusCounts,
    });
  } catch (error) {
    console.error("Error listing test rooms:", error);
    return NextResponse.json(
      { error: "Failed to list test rooms" },
      { status: 500 }
    );
  }
}
