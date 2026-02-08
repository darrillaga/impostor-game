#!/usr/bin/env node

import { TestRunner } from "./testing/TestRunner";
import { TestConfig } from "./types";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function runInteractive() {
  console.log("\n===========================================");
  console.log("  Impostor Game AI Test Runner");
  console.log("===========================================\n");

  const serverUrl = await question("Server URL (default: http://localhost:3000): ");
  const testName = await question("Test name (default: Quick Test): ");
  const playerCount = parseInt(await question("Number of players (default: 6): ") || "6");
  const impostorCount = parseInt(await question("Number of impostors (default: 1): ") || "1");
  const gameMode = await question("Game mode (clue-random/category-nofirst, default: category-nofirst): ") || "category-nofirst";
  const iterations = parseInt(await question("Number of iterations (default: 1): ") || "1");

  rl.close();

  const config: TestConfig = {
    testName: testName || "Quick Test",
    playerCount,
    impostorCount,
    gameMode: gameMode as any,
    maxDuration: 600000, // 10 minutes
  };

  const runner = new TestRunner(serverUrl || "http://localhost:3000");

  console.log("\n\nStarting test suite...\n");

  try {
    const results = await runner.runTestSuite(config, iterations);
    await runner.generateSummaryReport(results);

    console.log("\n===========================================");
    console.log("  Test Suite Completed!");
    console.log("===========================================");
    console.log(`Total tests: ${results.totalTests}`);
    console.log(`Successful: ${results.successfulTests}`);
    console.log(`Failed: ${results.failedTests}`);
    console.log(`Impostor win rate: ${(results.averageMetrics.impostorWinRate * 100).toFixed(1)}%`);
    console.log(`Average voting accuracy: ${(results.averageMetrics.votingAccuracy * 100).toFixed(1)}%`);
    console.log("===========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\nTest suite failed:", error);
    process.exit(1);
  }
}

async function runQuick() {
  console.log("\n[CLI] Running quick test (6 players, 1 impostor, 1 iteration)...\n");

  const config: TestConfig = {
    testName: "Quick Test",
    playerCount: 6,
    impostorCount: 1,
    gameMode: "category-nofirst",
    maxDuration: 600000,
  };

  const runner = new TestRunner("http://localhost:3000");

  try {
    const results = await runner.runTestSuite(config, 1);
    await runner.generateSummaryReport(results);

    console.log("\n[CLI] Quick test completed!");
    process.exit(0);
  } catch (error) {
    console.error("\n[CLI] Quick test failed:", error);
    process.exit(1);
  }
}

async function runBalance() {
  console.log("\n[CLI] Running balance test suite (10 iterations)...\n");

  const config: TestConfig = {
    testName: "Balance Test",
    playerCount: 8,
    impostorCount: 2,
    gameMode: "category-nofirst",
    maxDuration: 600000,
  };

  const runner = new TestRunner("http://localhost:3000");

  try {
    const results = await runner.runTestSuite(config, 10);
    await runner.generateSummaryReport(results);

    console.log("\n[CLI] Balance test completed!");
    console.log(`Impostor win rate: ${(results.averageMetrics.impostorWinRate * 100).toFixed(1)}%`);

    // Check if balanced (should be around 30-50% for impostors)
    if (results.averageMetrics.impostorWinRate < 0.2) {
      console.log("⚠️  Impostors appear underpowered");
    } else if (results.averageMetrics.impostorWinRate > 0.7) {
      console.log("⚠️  Impostors appear overpowered");
    } else {
      console.log("✅ Game balance appears healthy");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n[CLI] Balance test failed:", error);
    process.exit(1);
  }
}

async function runStress() {
  console.log("\n[CLI] Running stress test (large game, multiple iterations)...\n");

  const config: TestConfig = {
    testName: "Stress Test",
    playerCount: 12,
    impostorCount: 3,
    gameMode: "clue-random",
    maxDuration: 900000, // 15 minutes
  };

  const runner = new TestRunner("http://localhost:3000");

  try {
    const results = await runner.runTestSuite(config, 5);
    await runner.generateSummaryReport(results);

    console.log("\n[CLI] Stress test completed!");
    console.log(`Average game duration: ${(results.averageMetrics.duration / 60000).toFixed(1)} minutes`);
    console.log(`Average rounds: ${results.averageMetrics.roundsPlayed.toFixed(1)}`);

    process.exit(0);
  } catch (error) {
    console.error("\n[CLI] Stress test failed:", error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Impostor Game AI Test Runner

Usage:
  npm run ai:test [command]

Commands:
  interactive  - Interactive test configuration (default)
  quick        - Quick single test (6 players, 1 impostor)
  balance      - Balance test suite (10 iterations, 8 players)
  stress       - Stress test (12 players, 5 iterations)
  help         - Show this help message

Examples:
  npm run ai:test
  npm run ai:test quick
  npm run ai:test balance
  npm run ai:test stress

Environment Variables:
  SERVER_URL   - Override server URL (default: http://localhost:3000)
`);
  process.exit(0);
}

// Main
const command = process.argv[2] || "interactive";

switch (command) {
  case "interactive":
    runInteractive();
    break;
  case "quick":
    runQuick();
    break;
  case "balance":
    runBalance();
    break;
  case "stress":
    runStress();
    break;
  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Run "npm run ai:test help" for usage information');
    process.exit(1);
}
