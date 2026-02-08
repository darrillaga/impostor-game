import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey) {
      throw new Error("PINECONE_API_KEY environment variable is not set");
    }

    pineconeClient = new Pinecone({
      apiKey,
    });
  }

  return pineconeClient;
}

export async function getIndex(indexName: string) {
  const client = getPineconeClient();
  return client.index(indexName);
}

export const MEMORY_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "impostor-game-memory";
