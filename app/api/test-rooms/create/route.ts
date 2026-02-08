import { NextRequest, NextResponse } from "next/server";
import { getTestRoomManager } from "@/ai/testing/TestRoomManager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, playerCount, impostorCount, gameMode, category, word } = body;

    // Validate input
    if (!name || !playerCount || !impostorCount || !gameMode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (playerCount < 3 || playerCount > 20) {
      return NextResponse.json(
        { error: "Player count must be between 3 and 20" },
        { status: 400 }
      );
    }

    if (impostorCount < 1 || impostorCount >= playerCount) {
      return NextResponse.json(
        { error: "Invalid impostor count" },
        { status: 400 }
      );
    }

    // Create test room
    const manager = getTestRoomManager();
    const room = await manager.createTestRoom({
      name,
      playerCount,
      impostorCount,
      gameMode,
      category,
      word,
    });

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Error creating test room:", error);
    return NextResponse.json(
      { error: "Failed to create test room" },
      { status: 500 }
    );
  }
}
