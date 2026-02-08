"use client";

import { getSocket } from "@/lib/socket";
import { useTranslations } from "next-intl";
import { Player } from "@/types/game";

interface LobbyProps {
  roomId: string;
  players: Player[];
  isHost: boolean;
  impostorCount: number;
  gameMode: "clue-random" | "category-nofirst";
  onShareLink: () => void;
}

export default function Lobby({
  roomId,
  players,
  isHost,
  impostorCount,
  gameMode,
  onShareLink,
}: LobbyProps) {
  const t = useTranslations('lobby');

  const handleStart = () => {
    if (players.length < 3) {
      alert(t('needPlayers'));
      return;
    }
    getSocket().emit("startGame", { roomId });
  };

  const handleImpostorCountChange = (count: number) => {
    if (count >= players.length) {
      alert(t('impostorLimit'));
      return;
    }
    getSocket().emit("setImpostorCount", { roomId, count });
  };

  const handleGameModeChange = (mode: "clue-random" | "category-nofirst") => {
    getSocket().emit("setGameMode", { roomId, gameMode: mode });
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">{t('title')}</h2>
        <p className="text-gray-600">{t('roomCode', { code: roomId })}</p>
        <button
          onClick={onShareLink}
          className="mt-2 text-purple-600 hover:text-purple-700 font-medium text-sm underline"
        >
          {t('copyLink')}
        </button>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          {t('players', { count: players.length })}
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
                  {t('host')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('gameMode')}
            </label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleGameModeChange("category-nofirst")}
                className={`py-3 px-4 rounded-lg font-medium transition text-left ${
                  gameMode === "category-nofirst"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <div className="font-bold">{t('modeCategoryName')}</div>
                <div className="text-sm opacity-90">{t('modeCategoryDesc')}</div>
              </button>
              <button
                onClick={() => handleGameModeChange("clue-random")}
                className={`py-3 px-4 rounded-lg font-medium transition text-left ${
                  gameMode === "clue-random"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <div className="font-bold">{t('modeCliName')}</div>
                <div className="text-sm opacity-90">{t('modeCluDesc')}</div>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('impostorCount')}
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
        </>
      )}

      {isHost && (
        <button
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
        >
          {t('startGame')}
        </button>
      )}

      {!isHost && (
        <div className="text-center text-gray-600">
          {t('waiting')}
        </div>
      )}
    </div>
  );
}
