"use client";

interface Player {
  id: string;
  name: string;
  score: number;
  isAlive: boolean;
}

interface LeaderboardProps {
  players: Player[];
  currentPlayerId: string | null;
}

export default function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-gray-50 rounded-2xl p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Leaderboard
      </h3>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-4 rounded-lg transition ${
              player.id === currentPlayerId
                ? "bg-purple-100 border-2 border-purple-500"
                : "bg-white border border-gray-200"
            } ${!player.isAlive ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full font-bold text-gray-700">
                {index + 1}
              </div>
              <span className="font-semibold text-gray-800">
                {player.name}
                {player.id === currentPlayerId && (
                  <span className="ml-2 text-purple-600">(You)</span>
                )}
                {!player.isAlive && (
                  <span className="ml-2 text-red-500 text-sm">Eliminated</span>
                )}
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {player.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
