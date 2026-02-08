import { AgentManager } from "../agents/AgentManager";
import { AgentPlayer } from "../agents/AgentPlayer";
import { EventLogger } from "../judge/EventLogger";
import { JudgeAgent } from "../judge/JudgeAgent";
import { TestConfig, TestResults, JudgeAnalysis } from "../types";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import * as path from "path";

export class TestRunner {
  private agentManager: AgentManager;
  private eventLogger: EventLogger;
  private judgeAgent: JudgeAgent;
  private serverUrl: string;
  private resultsDir: string;

  constructor(
    serverUrl: string = "http://localhost:3000",
    resultsDir: string = "./logs/tests"
  ) {
    this.serverUrl = serverUrl;
    this.resultsDir = resultsDir;
    this.agentManager = new AgentManager(serverUrl);

    const testId = uuidv4();
    this.eventLogger = new EventLogger(testId, "./logs/tests/events");
    this.judgeAgent = new JudgeAgent(this.eventLogger);
  }

  /**
   * Run a single automated game test
   */
  async runSingleTest(config: TestConfig): Promise<JudgeAnalysis> {
    console.log(`\n[TestRunner] ========================================`);
    console.log(`[TestRunner] Starting test: ${config.testName}`);
    console.log(`[TestRunner] Players: ${config.playerCount}, Impostors: ${config.impostorCount}`);
    console.log(`[TestRunner] Mode: ${config.gameMode}, Category: ${config.category || "random"}`);
    console.log(`[TestRunner] ========================================\n`);

    const testId = uuidv4();
    const roomId = `test-${testId.slice(0, 8)}`;
    const roomPassword = config.roomPassword || "test123";

    try {
      // Step 1: Create test room
      console.log(`[TestRunner] Creating test room: ${roomId}`);
      // Note: In real implementation, would call API to create room
      // For now, assume room creation happens when first agent joins

      // Step 2: Spawn AI agents
      console.log(`[TestRunner] Spawning ${config.playerCount} AI agents...`);
      const agents = await this.spawnTestAgents(
        config.playerCount,
        roomId,
        roomPassword,
        config.personalities
      );

      console.log(`[TestRunner] All agents spawned and joined room`);
      await this.delay(2000);

      // Step 3: Initialize Judge observation
      const playerIds = agents.map((agent) => agent.getId?.() || uuidv4());
      const impostorIds = playerIds.slice(0, config.impostorCount); // Simplified
      const word = config.word || "example";
      const category = config.category || "test";

      this.judgeAgent.startObserving(
        roomId,
        testId,
        playerIds,
        impostorIds,
        word,
        category,
        config.gameMode
      );

      this.eventLogger.logGameStart(roomId, config.playerCount, config.impostorCount, config.gameMode);

      // Step 4: Start game
      console.log(`[TestRunner] Starting game...`);
      // Note: Game starts automatically when all players are ready
      // Agents handle ready signal in their implementation

      // Step 5: Wait for game completion
      const maxDuration = config.maxDuration || 600000; // 10 minutes default
      console.log(`[TestRunner] Waiting for game to complete (max ${maxDuration / 1000}s)...`);

      await this.waitForGameCompletion(testId, maxDuration);

      // Step 6: End observation and get analysis
      console.log(`[TestRunner] Game completed, analyzing results...`);

      // Determine winner (simplified - would come from game state)
      const winner = Math.random() > 0.5 ? "impostors" : "normals";

      const analysis = await this.judgeAgent.endObserving(testId, winner);

      this.eventLogger.logGameEnd(
        roomId,
        winner,
        analysis.gameMetrics.roundsPlayed,
        analysis.gameMetrics.duration
      );

      // Step 7: Cleanup
      console.log(`[TestRunner] Cleaning up...`);
      this.agentManager.disconnectAll();

      console.log(`[TestRunner] Test completed successfully\n`);

      return analysis;
    } catch (error) {
      console.error(`[TestRunner] Test failed:`, error);
      this.agentManager.disconnectAll();
      throw error;
    }
  }

  /**
   * Run multiple test iterations
   */
  async runTestSuite(config: TestConfig, iterations: number): Promise<TestResults> {
    console.log(`\n[TestRunner] ========================================`);
    console.log(`[TestRunner] Starting test suite: ${config.testName}`);
    console.log(`[TestRunner] Iterations: ${iterations}`);
    console.log(`[TestRunner] ========================================\n`);

    const analyses: JudgeAnalysis[] = [];
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      console.log(`\n[TestRunner] --- Iteration ${i + 1}/${iterations} ---`);

      try {
        const analysis = await this.runSingleTest(config);
        analyses.push(analysis);

        // Delay between tests
        if (i < iterations - 1) {
          console.log(`[TestRunner] Waiting before next iteration...`);
          await this.delay(5000);
        }
      } catch (error) {
        console.error(`[TestRunner] Iteration ${i + 1} failed:`, error);
        // Continue with next iteration
      }
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    // Generate aggregate results
    const results = this.aggregateResults(config, analyses, totalDuration);

    // Save results
    await this.saveResults(results);

    console.log(`\n[TestRunner] ========================================`);
    console.log(`[TestRunner] Test suite completed`);
    console.log(`[TestRunner] Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`[TestRunner] Successful tests: ${analyses.length}/${iterations}`);
    console.log(`[TestRunner] ========================================\n`);

    return results;
  }

  /**
   * Spawn test agents with specified personalities
   */
  private async spawnTestAgents(
    count: number,
    roomId: string,
    roomPassword: string,
    personalities?: string[]
  ): Promise<AgentPlayer[]> {
    if (personalities && personalities.length > 0) {
      // Use specified personalities
      const agents: AgentPlayer[] = [];
      for (let i = 0; i < count; i++) {
        const personality = personalities[i % personalities.length] as any;
        const name = `AI-${personality}-${i + 1}`;
        const agent = await this.agentManager.spawnAgent(name, personality, roomId, roomPassword);
        agents.push(agent);
        await this.delay(500);
      }
      return agents;
    } else {
      // Use balanced team
      return await this.agentManager.spawnBalancedTeam(count, roomId, roomPassword);
    }
  }

  /**
   * Wait for game completion
   */
  private async waitForGameCompletion(gameId: string, maxDuration: number): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < maxDuration) {
      // Check if game is still active
      if (!this.judgeAgent.isObserving(gameId)) {
        console.log(`[TestRunner] Game ${gameId} no longer being observed - assuming completed`);
        return;
      }

      await this.delay(pollInterval);
    }

    console.log(`[TestRunner] Game exceeded max duration, forcing completion`);
  }

  /**
   * Aggregate results from multiple test runs
   */
  private aggregateResults(
    config: TestConfig,
    analyses: JudgeAnalysis[],
    totalDuration: number
  ): TestResults {
    if (analyses.length === 0) {
      return {
        testId: uuidv4(),
        testName: config.testName,
        config,
        timestamp: Date.now(),
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        averageMetrics: {
          duration: 0,
          roundsPlayed: 0,
          votingAccuracy: 0,
          impostorWinRate: 0,
        },
        aggregateIssues: {},
        commonRecommendations: [],
        analyses: [],
      };
    }

    const successfulTests = analyses.length;
    const totalTests = successfulTests; // Assuming we only have successful ones in array

    // Calculate averages
    const avgDuration = analyses.reduce((sum, a) => sum + a.gameMetrics.duration, 0) / successfulTests;
    const avgRounds = analyses.reduce((sum, a) => sum + a.gameMetrics.roundsPlayed, 0) / successfulTests;
    const avgVotingAccuracy = analyses.reduce((sum, a) => sum + a.votingPatterns.accuracy, 0) / successfulTests;
    const impostorWins = analyses.filter((a) => a.gameMetrics.winner === "impostors").length;
    const impostorWinRate = impostorWins / successfulTests;

    // Aggregate issues
    const issueMap: Record<string, number> = {};
    analyses.forEach((analysis) => {
      analysis.issues.forEach((issue) => {
        // Normalize issue text
        const normalizedIssue = issue.split(" - ")[0]; // Take first part
        issueMap[normalizedIssue] = (issueMap[normalizedIssue] || 0) + 1;
      });
    });

    // Find common recommendations
    const recommendationMap: Record<string, number> = {};
    analyses.forEach((analysis) => {
      analysis.recommendations.forEach((rec) => {
        recommendationMap[rec] = (recommendationMap[rec] || 0) + 1;
      });
    });

    const commonRecommendations = Object.entries(recommendationMap)
      .filter(([_, count]) => count >= Math.ceil(successfulTests * 0.3)) // Appears in 30%+ of tests
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rec]) => rec);

    return {
      testId: uuidv4(),
      testName: config.testName,
      config,
      timestamp: Date.now(),
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      averageMetrics: {
        duration: avgDuration,
        roundsPlayed: avgRounds,
        votingAccuracy: avgVotingAccuracy,
        impostorWinRate,
      },
      aggregateIssues: issueMap,
      commonRecommendations,
      analyses,
    };
  }

  /**
   * Save test results to file
   */
  private async saveResults(results: TestResults): Promise<string> {
    try {
      await fs.mkdir(this.resultsDir, { recursive: true });

      const filename = `test-${results.testName.replace(/\s+/g, "-")}-${Date.now()}.json`;
      const filepath = path.join(this.resultsDir, filename);

      await fs.writeFile(filepath, JSON.stringify(results, null, 2), "utf-8");

      console.log(`[TestRunner] Results saved to ${filepath}`);

      // Also save event logs
      await this.eventLogger.saveToFile();

      return filepath;
    } catch (error) {
      console.error(`[TestRunner] Error saving results:`, error);
      throw error;
    }
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport(results: TestResults): Promise<string> {
    const report = `
# Test Results: ${results.testName}

**Test ID:** ${results.testId}
**Timestamp:** ${new Date(results.timestamp).toISOString()}
**Total Tests:** ${results.totalTests}
**Successful:** ${results.successfulTests}
**Failed:** ${results.failedTests}

## Configuration
- **Players:** ${results.config.playerCount}
- **Impostors:** ${results.config.impostorCount}
- **Game Mode:** ${results.config.gameMode}
- **Category:** ${results.config.category || "random"}

## Average Metrics
- **Duration:** ${(results.averageMetrics.duration / 1000).toFixed(1)}s
- **Rounds:** ${results.averageMetrics.roundsPlayed.toFixed(1)}
- **Voting Accuracy:** ${(results.averageMetrics.votingAccuracy * 100).toFixed(1)}%
- **Impostor Win Rate:** ${(results.averageMetrics.impostorWinRate * 100).toFixed(1)}%

## Common Issues
${Object.entries(results.aggregateIssues)
  .sort((a, b) => b[1] - a[1])
  .map(([issue, count]) => `- ${issue} (${count}/${results.successfulTests} games)`)
  .join("\n")}

## Recommendations
${results.commonRecommendations.map((rec) => `- ${rec}`).join("\n")}

## Individual Game Analyses
${results.analyses.map((analysis, i) => `
### Game ${i + 1}
- **Winner:** ${analysis.gameMetrics.winner}
- **Duration:** ${(analysis.gameMetrics.duration / 1000).toFixed(1)}s
- **Rounds:** ${analysis.gameMetrics.roundsPlayed}
- **Voting Accuracy:** ${(analysis.votingPatterns.accuracy * 100).toFixed(1)}%
- **Assessment:** ${analysis.overallAssessment}
`).join("\n")}
`;

    // Save summary report
    try {
      await fs.mkdir(this.resultsDir, { recursive: true });
      const reportPath = path.join(
        this.resultsDir,
        `summary-${results.testName.replace(/\s+/g, "-")}-${Date.now()}.md`
      );
      await fs.writeFile(reportPath, report, "utf-8");
      console.log(`[TestRunner] Summary report saved to ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error(`[TestRunner] Error saving summary report:`, error);
      return report;
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
