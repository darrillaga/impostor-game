"use client";

import { getSocket } from "@/lib/socket";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
}

interface LobbyProps {
  roomId: string;
  players: Player[];
  isHost: boolean;
  impostorCount: number;
  onShareLink: () => void;
}

export default function Lobby({
  roomId,
  players,
  isHost,
  impostorCount,
  onShareLink,
}: LobbyProps) {
  const handleStart = () => {
    if (players.length < 3) {
      alert("Need at least 3 players to start");
      return;
    }
    getSocket().emit("startGame", { roomId });
  };

  const handleImpostorCountChange = (count: number) => {
    if (count >= players.length) {
      alert("Impostor count must be less than total players");
      return;
    }
    getSocket().emit("setImpostorCount", { roomId, count });
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">Game Lobby</h2>
        <p className="text-gray-600">Room Code: {roomId}</p>
        <button
          onClick={onShareLink}
          className="mt-2 text-purple-600 hover:text-purple-700 font-medium text-sm underline"
        >
          Copy Share Link
        </button>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Players ({players.length})
        </h3>
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between bg-gray-100 rounded-lg p-4"
            >
              <span className="font-medium text-gray-800">{player.name}</span>
              {player.isHost && (
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                  Host
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Impostors
          </label>
          <div className="flex gap-2">
            {[1, 2, 3].map((count) => (
              <button
                key={count}
                onClick={() => handleImpostorCountChange(count)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  impostorCount === count
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={count >= players.length}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      )}

      {isHost && (
        <button
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
        >
          Start Game
        </button>
      )}

      {!isHost && (
        <div className="text-center text-gray-600">
          Waiting for host to start the game...
        </div>
      )}
    </div>
  );
}
