import JudgeDashboard from "@/components/JudgeDashboard";
import { TestResults } from "@/ai/types";
import * as fs from "fs/promises";
import * as path from "path";

async function getLatestTestResults(): Promise<TestResults | null> {
  try {
    const logsDir = path.join(process.cwd(), "logs", "tests");

    // Check if logs directory exists
    try {
      await fs.access(logsDir);
    } catch {
      return null;
    }

    // Read all test result files
    const files = await fs.readdir(logsDir);
    const testFiles = files.filter((f) => f.startsWith("test-") && f.endsWith(".json"));

    if (testFiles.length === 0) {
      return null;
    }

    // Sort by modification time and get latest
    const filesWithStats = await Promise.all(
      testFiles.map(async (file) => {
        const filepath = path.join(logsDir, file);
        const stats = await fs.stat(filepath);
        return { file, mtime: stats.mtime };
      })
    );

    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    const latestFile = filesWithStats[0].file;
    const filepath = path.join(logsDir, latestFile);

    const content = await fs.readFile(filepath, "utf-8");
    const results: TestResults = JSON.parse(content);

    return results;
  } catch (error) {
    console.error("Error loading test results:", error);
    return null;
  }
}

export default async function JudgePage() {
  const results = await getLatestTestResults();

  return <JudgeDashboard results={results || undefined} />;
}
