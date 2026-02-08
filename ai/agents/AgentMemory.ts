import { getIndex, MEMORY_INDEX_NAME } from "@/lib/pinecone";
import { generateEmbedding } from "@/lib/openai";
import { GameMemory, MemoryQuery } from "../types";
import { v4 as uuidv4 } from "uuid";

export class AgentMemory {
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  /**
   * Store a game memory in the vector database
   */
  async storeMemory(memory: GameMemory): Promise<void> {
    try {
      const index = await getIndex(MEMORY_INDEX_NAME);

      // Create a text representation of the memory for embedding
      const memoryText = this.createMemoryText(memory);

      // Generate embedding
      const embedding = await generateEmbedding(memoryText);

      // Store in Pinecone
      await index.upsert([
        {
          id: `${memory.agentId}-${memory.gameId}-${Date.now()}`,
          values: embedding,
          metadata: {
            agentId: memory.agentId,
            gameId: memory.gameId,
            role: memory.role,
            word: memory.word || "",
            category: memory.category,
            outcome: memory.outcome,
            eliminated: memory.eliminated,
            roundNumber: memory.roundNumber,
            strategy: memory.strategy,
            effectiveness: memory.effectiveness,
            timestamp: memory.metadata.timestamp,
            playerCount: memory.metadata.playerCount,
            impostorCount: memory.metadata.impostorCount,
            gameMode: memory.metadata.gameMode,
          },
        },
      ]);

      console.log(`Stored memory for agent ${this.agentId}, game ${memory.gameId}`);
    } catch (error) {
      console.error("Error storing memory:", error);
      // Don't throw - memory storage shouldn't break the game
    }
  }

  /**
   * Query similar memories from the database
   */
  async querySimilarMemories(
    currentSituation: string,
    query: MemoryQuery
  ): Promise<GameMemory[]> {
    try {
      const index = await getIndex(MEMORY_INDEX_NAME);

      // Generate embedding for current situation
      const embedding = await generateEmbedding(currentSituation);

      // Build filter
      const filter: any = {
        agentId: this.agentId,
      };

      if (query.role) {
        filter.role = query.role;
      }

      if (query.outcome) {
        filter.outcome = query.outcome;
      }

      if (query.category) {
        filter.category = query.category;
      }

      // Query Pinecone
      const results = await index.query({
        vector: embedding,
        topK: query.limit,
        filter,
        includeMetadata: true,
      });

      // Convert results to GameMemory objects
      const memories: GameMemory[] = results.matches
        .filter((match) => match.metadata)
        .map((match) => ({
          gameId: match.metadata!.gameId as string,
          agentId: match.metadata!.agentId as string,
          role: match.metadata!.role as "impostor" | "normal",
          word: match.metadata!.word as string | undefined,
          category: match.metadata!.category as string,
          actions: [], // Actions not stored in metadata due to size
          outcome: match.metadata!.outcome as "win" | "loss",
          eliminated: match.metadata!.eliminated as boolean,
          roundNumber: match.metadata!.roundNumber as number,
          strategy: match.metadata!.strategy as string,
          effectiveness: match.metadata!.effectiveness as number,
          metadata: {
            timestamp: match.metadata!.timestamp as number,
            playerCount: match.metadata!.playerCount as number,
            impostorCount: match.metadata!.impostorCount as number,
            gameMode: match.metadata!.gameMode as string,
          },
        }));

      return memories;
    } catch (error) {
      console.error("Error querying memories:", error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get recent memories for the agent
   */
  async getRecentMemories(limit: number = 10): Promise<GameMemory[]> {
    return this.querySimilarMemories("recent game history", {
      limit,
    });
  }

  /**
   * Get successful strategies for a specific role
   */
  async getSuccessfulStrategies(role: "impostor" | "normal", limit: number = 5): Promise<GameMemory[]> {
    return this.querySimilarMemories(
      `successful strategies as ${role}`,
      {
        role,
        outcome: "win",
        limit,
      }
    );
  }

  /**
   * Create a text representation of memory for embedding
   */
  private createMemoryText(memory: GameMemory): string {
    const parts = [
      `Role: ${memory.role}`,
      `Category: ${memory.category}`,
      memory.word ? `Word: ${memory.word}` : "",
      `Strategy: ${memory.strategy}`,
      `Outcome: ${memory.outcome}`,
      `Eliminated: ${memory.eliminated}`,
      `Round: ${memory.roundNumber}`,
      `Effectiveness: ${memory.effectiveness}`,
      `Players: ${memory.metadata.playerCount}`,
      `Impostors: ${memory.metadata.impostorCount}`,
      `Game Mode: ${memory.metadata.gameMode}`,
    ];

    return parts.filter(Boolean).join(". ");
  }

  /**
   * Clear all memories for this agent (for testing)
   */
  async clearMemories(): Promise<void> {
    try {
      const index = await getIndex(MEMORY_INDEX_NAME);

      await index.deleteMany({
        agentId: this.agentId,
      });

      console.log(`Cleared all memories for agent ${this.agentId}`);
    } catch (error) {
      console.error("Error clearing memories:", error);
    }
  }
}
