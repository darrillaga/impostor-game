"use client";

import { useState } from "react";
import { getSocket } from "@/lib/socket";
import { Player } from "@/types/game";

interface VotingPhaseProps {
  roomId: string;
  players: Player[];
  currentPlayerId: string;
}

export default function VotingPhase({
  roomId,
  players,
  currentPlayerId,
}: VotingPhaseProps) {
  const [voted, setVoted] = useState(false);
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const alivePlayers = players.filter(p => p.isAlive);

  const handleVote = (targetId: string) => {
    if (voted || !currentPlayer?.isAlive) return;

    getSocket().emit("vote", { roomId, targetId });
    setVoted(true);
  };

  const votedCount = players.filter(p => p.hasVoted).length;
  const aliveCount = alivePlayers.length;

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">Voting Time</h2>
        <p className="text-gray-600">Who do you think is the impostor?</p>
        <div className="mt-4 text-sm text-gray-500">
          Votes: {votedCount} / {aliveCount}
        </div>
      </div>

      {!currentPlayer?.isAlive ? (
        <div className="text-center py-8">
          <p className="text-xl text-gray-600">
            You have been eliminated. Waiting for others to vote...
          </p>
        </div>
      ) : voted ? (
        <div className="text-center py-8">
          <div className="inline-block bg-green-100 border-2 border-green-500 rounded-xl p-6">
            <svg
              className="w-16 h-16 text-green-600 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-xl font-semibold text-green-700">Vote Submitted</p>
            <p className="text-gray-600 mt-2">Waiting for other players...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {alivePlayers
            .filter(p => p.id !== currentPlayerId)
            .map((player) => (
              <button
                key={player.id}
                onClick={() => handleVote(player.id)}
                className="bg-gray-100 hover:bg-purple-100 border-2 border-transparent hover:border-purple-500 rounded-xl p-6 transition transform hover:scale-105 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold text-gray-800">
                    {player.name}
                  </span>
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
