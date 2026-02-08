import { AgentPlayer } from "./AgentPlayer";
import { AgentConfig, AgentPersonality } from "../types";
import { v4 as uuidv4 } from "uuid";

export class AgentManager {
  private agents: Map<string, AgentPlayer> = new Map();
  private serverUrl: string;

  constructor(serverUrl: string = "http://localhost:3000") {
    this.serverUrl = serverUrl;
  }

  /**
   * Create and spawn an AI agent
   */
  async spawnAgent(
    name: string,
    personality: AgentPersonality,
    roomId: string,
    roomPassword: string
  ): Promise<AgentPlayer> {
    const config: AgentConfig = {
      agentId: uuidv4(),
      name,
      personality,
      creativityLevel: this.getCreativityForPersonality(personality),
    };

    const agent = new AgentPlayer(config, this.serverUrl);
    this.agents.set(config.agentId, agent);

    // Join the room
    await agent.joinRoom(roomId, roomPassword);

    console.log(`[AgentManager] Spawned agent: ${name} (${personality})`);

    return agent;
  }

  /**
   * Spawn multiple agents with different personalities
   */
  async spawnMultipleAgents(
    count: number,
    roomId: string,
    roomPassword: string
  ): Promise<AgentPlayer[]> {
    const personalities: AgentPersonality[] = [
      "aggressive",
      "defensive",
      "analytical",
      "random",
      "silent",
      "chaotic",
    ];

    const agents: AgentPlayer[] = [];

    for (let i = 0; i < count; i++) {
      const personality = personalities[i % personalities.length];
      const name = `AI-${personality.charAt(0).toUpperCase()}${i + 1}`;

      const agent = await this.spawnAgent(name, personality, roomId, roomPassword);
      agents.push(agent);

      // Delay between spawns to avoid overwhelming the server
      await this.delay(500);
    }

    console.log(`[AgentManager] Spawned ${count} agents`);

    return agents;
  }

  /**
   * Spawn a balanced team of agents with diverse personalities
   */
  async spawnBalancedTeam(
    count: number,
    roomId: string,
    roomPassword: string
  ): Promise<AgentPlayer[]> {
    if (count < 3) {
      throw new Error("Need at least 3 agents for a balanced team");
    }

    // Ensure we have at least one of each key personality type
    const essentialPersonalities: AgentPersonality[] = ["analytical", "aggressive", "defensive"];
    const optionalPersonalities: AgentPersonality[] = ["random", "silent", "chaotic"];

    const personalityDistribution: AgentPersonality[] = [];

    // Add essential personalities first
    for (let i = 0; i < Math.min(count, essentialPersonalities.length); i++) {
      personalityDistribution.push(essentialPersonalities[i]);
    }

    // Fill remaining slots with optional personalities
    for (let i = essentialPersonalities.length; i < count; i++) {
      const randomPersonality =
        optionalPersonalities[Math.floor(Math.random() * optionalPersonalities.length)];
      personalityDistribution.push(randomPersonality);
    }

    // Shuffle the distribution
    personalityDistribution.sort(() => Math.random() - 0.5);

    const agents: AgentPlayer[] = [];

    for (let i = 0; i < personalityDistribution.length; i++) {
      const personality = personalityDistribution[i];
      const name = `${personality.charAt(0).toUpperCase()}${personality.slice(1)}-${i + 1}`;

      const agent = await this.spawnAgent(name, personality, roomId, roomPassword);
      agents.push(agent);

      await this.delay(500);
    }

    console.log(`[AgentManager] Spawned balanced team of ${count} agents`);

    return agents;
  }

  /**
   * Disconnect all agents
   */
  disconnectAll(): void {
    this.agents.forEach((agent, agentId) => {
      agent.disconnect();
      console.log(`[AgentManager] Disconnected agent: ${agentId}`);
    });
    this.agents.clear();
  }

  /**
   * Disconnect a specific agent
   */
  disconnectAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.disconnect();
      this.agents.delete(agentId);
      console.log(`[AgentManager] Disconnected agent: ${agentId}`);
    }
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): AgentPlayer[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent count
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Get creativity level based on personality
   */
  private getCreativityForPersonality(personality: AgentPersonality): number {
    const creativityMap: Record<AgentPersonality, number> = {
      aggressive: 0.6,
      defensive: 0.4,
      analytical: 0.3,
      random: 0.9,
      silent: 0.5,
      chaotic: 1.0,
    };

    return creativityMap[personality];
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
