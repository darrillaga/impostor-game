"use client";

import { TestResults, JudgeAnalysis } from "@/ai/types";
import { useState, useEffect } from "react";

interface JudgeDashboardProps {
  results?: TestResults;
}

export default function JudgeDashboard({ results }: JudgeDashboardProps) {
  const [selectedGame, setSelectedGame] = useState<number>(0);

  if (!results || results.successfulTests === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Judge Dashboard</h1>
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">No test results available</p>
            <p className="text-gray-500 mt-2">Run `npm run ai:test` to generate test results</p>
          </div>
        </div>
      </div>
    );
  }

  const currentAnalysis = results.analyses[selectedGame];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Judge Dashboard</h1>
          <p className="text-gray-400">{results.testName}</p>
          <p className="text-gray-500 text-sm">
            Test ID: {results.testId.slice(0, 8)} | {new Date(results.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Tests"
            value={results.totalTests}
            subtext={`${results.successfulTests} successful`}
          />
          <StatCard
            label="Impostor Win Rate"
            value={`${(results.averageMetrics.impostorWinRate * 100).toFixed(1)}%`}
            subtext={getBalanceAssessment(results.averageMetrics.impostorWinRate)}
            color={getBalanceColor(results.averageMetrics.impostorWinRate)}
          />
          <StatCard
            label="Voting Accuracy"
            value={`${(results.averageMetrics.votingAccuracy * 100).toFixed(1)}%`}
            subtext="Average across all games"
          />
          <StatCard
            label="Avg Duration"
            value={`${(results.averageMetrics.duration / 1000).toFixed(0)}s`}
            subtext={`${results.averageMetrics.roundsPlayed.toFixed(1)} rounds`}
          />
        </div>

        {/* Common Issues */}
        {Object.keys(results.aggregateIssues).length > 0 && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Common Issues</h2>
            <div className="space-y-2">
              {Object.entries(results.aggregateIssues)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([issue, count]) => (
                  <div key={issue} className="flex items-center justify-between">
                    <span className="text-gray-300">{issue}</span>
                    <span className="text-red-400">
                      {count}/{results.successfulTests} games
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {results.commonRecommendations.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Recommendations</h2>
            <ul className="space-y-2">
              {results.commonRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span className="text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Individual Game Analysis */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Individual Game Analysis</h2>
            <div className="flex gap-2">
              {results.analyses.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedGame(i)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedGame === i
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Game {i + 1}
                </button>
              ))}
            </div>
          </div>

          {currentAnalysis && (
            <div className="space-y-6">
              {/* Game Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="Winner" value={currentAnalysis.gameMetrics.winner} />
                <MetricCard
                  label="Duration"
                  value={`${(currentAnalysis.gameMetrics.duration / 1000).toFixed(1)}s`}
                />
                <MetricCard label="Rounds" value={currentAnalysis.gameMetrics.roundsPlayed} />
              </div>

              {/* Voting Patterns */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Voting Patterns</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    label="Accuracy"
                    value={`${(currentAnalysis.votingPatterns.accuracy * 100).toFixed(1)}%`}
                    small
                  />
                  <MetricCard
                    label="Total Votes"
                    value={currentAnalysis.votingPatterns.totalVotes}
                    small
                  />
                  <MetricCard
                    label="Impostors Found"
                    value={currentAnalysis.votingPatterns.impostorsIdentifiedCorrectly}
                    small
                  />
                  <MetricCard
                    label="Innocents Lost"
                    value={currentAnalysis.votingPatterns.innocentsEliminated}
                    small
                  />
                </div>
              </div>

              {/* AI Insights */}
              {currentAnalysis.aiInsights && (
                <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2 text-purple-400">AI Insights</h3>
                  <p className="text-gray-300 leading-relaxed">{currentAnalysis.aiInsights}</p>
                </div>
              )}

              {/* Player Performance */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Player Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3">Player</th>
                        <th className="text-left py-2 px-3">Role</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-left py-2 px-3">Votes Received</th>
                        <th className="text-left py-2 px-3">Voting Accuracy</th>
                        <th className="text-left py-2 px-3">Suspicion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAnalysis.playerPerformance.map((player, i) => (
                        <tr key={i} className="border-b border-gray-800">
                          <td className="py-2 px-3">{player.playerName}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                player.role === "impostor"
                                  ? "bg-red-900/40 text-red-400"
                                  : "bg-green-900/40 text-green-400"
                              }`}
                            >
                              {player.role}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {player.survived ? (
                              <span className="text-green-400">Survived</span>
                            ) : (
                              <span className="text-red-400">Eliminated</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">{player.votesReceived}</td>
                          <td className="py-2 px-3 text-center">
                            {(player.votingAccuracy * 100).toFixed(0)}%
                          </td>
                          <td className="py-2 px-3">
                            <div className="w-full bg-gray-700 rounded h-2">
                              <div
                                className="bg-yellow-500 h-2 rounded"
                                style={{ width: `${player.suspicionLevel * 100}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Game Issues */}
              {currentAnalysis.issues.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Issues Detected</h3>
                  <ul className="space-y-2">
                    {currentAnalysis.issues.map((issue, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-red-400 mr-2">⚠</span>
                        <span className="text-gray-300">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Overall Assessment */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Overall Assessment</h3>
                <p className="text-gray-300">{currentAnalysis.overallAssessment}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  color = "gray",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  const colorClasses = {
    gray: "bg-gray-800 border-gray-700",
    green: "bg-green-900/20 border-green-800",
    yellow: "bg-yellow-900/20 border-yellow-800",
    red: "bg-red-900/20 border-red-800",
  };

  return (
    <div className={`rounded-lg p-6 border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {subtext && <div className="text-xs text-gray-500">{subtext}</div>}
    </div>
  );
}

function MetricCard({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`${small ? "text-xl" : "text-2xl"} font-semibold`}>{value}</div>
    </div>
  );
}

function getBalanceAssessment(winRate: number): string {
  if (winRate < 0.2) return "Underpowered";
  if (winRate > 0.7) return "Overpowered";
  if (winRate >= 0.4 && winRate <= 0.6) return "Well balanced";
  return "Acceptable";
}

function getBalanceColor(winRate: number): string {
  if (winRate < 0.2 || winRate > 0.7) return "red";
  if (winRate >= 0.4 && winRate <= 0.6) return "green";
  return "yellow";
}
