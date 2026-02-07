"use client";

import { getSocket } from "@/lib/socket";
import Leaderboard from "./Leaderboard";

interface Player {
  id: string;
  name: string;
  isImpostor: boolean;
  isAlive: boolean;
  score: number;
}

interface ResultsProps {
  roomId: string;
  players: Player[];
  eliminatedPlayer: Player | null;
  gameOver: boolean;
  impostorsWin: boolean;
  isHost: boolean;
  roundNumber: number;
}

export default function Results({
  roomId,
  players,
  eliminatedPlayer,
  gameOver,
  impostorsWin,
  isHost,
  roundNumber,
}: ResultsProps) {
  const handleNextRound = () => {
    getSocket().emit("nextRound", { roomId });
  };

  const handlePlayAgain = () => {
    getSocket().emit("playAgain", { roomId });
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8">
      <div className="text-center mb-8">
        {gameOver ? (
          <div>
            <h2 className="text-5xl font-bold mb-4">
              {impostorsWin ? (
                <span className="text-red-600">Impostors Win!</span>
              ) : (
                <span className="text-green-600">Normal Players Win!</span>
              )}
            </h2>
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                The Impostors Were:
              </h3>
              <div className="space-y-2">
                {players
                  .filter(p => p.isImpostor)
                  .map(impostor => (
                    <div
                      key={impostor.id}
                      className="bg-red-100 border-2 border-red-500 rounded-lg p-4"
                    >
                      <span className="text-xl font-bold text-red-700">
                        {impostor.name}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Round {roundNumber} Results
            </h2>
            {eliminatedPlayer ? (
              <div className="mb-6">
                <div className="inline-block bg-gray-100 border-2 border-gray-400 rounded-xl p-6">
                  <p className="text-gray-600 mb-2">Eliminated</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {eliminatedPlayer.name}
                  </p>
                  {eliminatedPlayer.isImpostor && (
                    <span className="inline-block mt-3 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                      Was an Impostor!
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="inline-block bg-yellow-100 border-2 border-yellow-500 rounded-xl p-6">
                  <p className="text-xl font-semibold text-yellow-700">
                    No elimination this round (tie vote)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Leaderboard players={players} currentPlayerId={null} />

      {isHost && (
        <div className="mt-8">
          {gameOver ? (
            <button
              onClick={handlePlayAgain}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
            >
              Play Again
            </button>
          ) : (
            <button
              onClick={handleNextRound}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
            >
              Next Round
            </button>
          )}
        </div>
      )}

      {!isHost && (
        <div className="mt-8 text-center text-gray-600">
          {gameOver
            ? "Waiting for host to start a new game..."
            : "Waiting for host to start next round..."}
        </div>
      )}
    </div>
  );
}
