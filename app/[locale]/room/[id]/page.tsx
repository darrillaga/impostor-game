"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getSocket } from "@/lib/socket";
import Lobby from "@/components/Lobby";
import WordReveal from "@/components/WordReveal";
import VotingPhase from "@/components/VotingPhase";
import Results from "@/components/Results";
import Leaderboard from "@/components/Leaderboard";
import { useTranslations } from "next-intl";
import { Player, GameData } from "@/types/game";

export default function RoomPage() {
  const t = useTranslations('join');
  const tDiscussion = useTranslations('discussion');
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const locale = params.locale as string;
  const passwordParam = searchParams.get("password");

  const [joined, setJoined] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomPassword, setRoomPassword] = useState(passwordParam || "");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameData, setGameData] = useState<GameData>({
    phase: "lobby",
    category: null,
    word: null,
    impostorClue: null,
    isImpostor: false,
    roundNumber: 0,
  });
  const [impostorCount, setImpostorCount] = useState(1);
  const [gameMode, setGameMode] = useState<"clue-random" | "category-nofirst">("category-nofirst");
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [impostorsWin, setImpostorsWin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = getSocket();

    // Check for reconnection data
    const savedData = localStorage.getItem(`room_${roomId}`);
    if (savedData && !joined) {
      const { playerId: savedPlayerId, playerName: savedName, roomPassword: savedPassword } = JSON.parse(savedData);
      socket.emit("reconnect", {
        roomId,
        playerId: savedPlayerId,
        roomPassword: savedPassword,
      });
    }

    socket.on("reconnected", (data) => {
      setPlayerId(data.playerId);
      setPlayerName(data.player.name);
      setPlayers(data.gameState.players);
      setJoined(true);
      setGameData(prev => ({
        ...prev,
        phase: data.gameState.phase,
        roundNumber: data.gameState.roundNumber,
      }));
      localStorage.setItem(`room_${roomId}`, JSON.stringify({
        playerId: data.playerId,
        playerName: data.player.name,
        roomPassword,
      }));
    });

    socket.on("joinedRoom", (data) => {
      setPlayerId(data.playerId);
      setPlayers(data.gameState.players);
      setJoined(true);
      localStorage.setItem(`room_${roomId}`, JSON.stringify({
        playerId: data.playerId,
        playerName,
        roomPassword,
      }));
    });

    socket.on("playerJoined", (data) => {
      setPlayers(data.players);
    });

    socket.on("impostorCountUpdated", (data) => {
      setImpostorCount(data.count);
    });

    socket.on("gameModeUpdated", (data) => {
      setGameMode(data.gameMode);
    });

    socket.on("gameStarted", (data) => {
      // Use localized word/clue based on current locale
      const word = locale === 'es' ? data.wordEs : data.word;
      const impostorClue = locale === 'es' ? data.impostorClueEs : data.impostorClue;

      setGameData({
        phase: data.phase,
        category: data.category,
        word: word,
        impostorClue: impostorClue,
        isImpostor: data.isImpostor,
        roundNumber: 1,
      });
    });

    socket.on("phaseChanged", (data) => {
      setGameData(prev => ({
        ...prev,
        phase: data.phase,
        roundNumber: data.roundNumber || prev.roundNumber,
      }));
      setEliminatedPlayer(null);
    });

    socket.on("playerVoted", (data) => {
      // Update players state to reflect new vote counts
      if (data.players) {
        setPlayers(data.players);
      }
    });

    socket.on("votingComplete", (data) => {
      setEliminatedPlayer(data.eliminatedPlayer);
      setGameOver(data.gameOver);
      setImpostorsWin(data.impostorsWin);
      setPlayers(data.players);
      setGameData(prev => ({
        ...prev,
        phase: data.gameOver ? "gameOver" : "results",
      }));
    });

    socket.on("gameReset", (data) => {
      setGameData({
        phase: "lobby",
        category: null,
        word: null,
        impostorClue: null,
        isImpostor: false,
        roundNumber: 0,
      });
      setPlayers(data.gameState.players);
      setGameOver(false);
      setImpostorsWin(false);
      setEliminatedPlayer(null);
    });

    socket.on("error", (data) => {
      setError(data.message);
      setTimeout(() => setError(""), 3000);
    });

    return () => {
      socket.off("reconnected");
      socket.off("joinedRoom");
      socket.off("playerJoined");
      socket.off("impostorCountUpdated");
      socket.off("gameModeUpdated");
      socket.off("gameStarted");
      socket.off("phaseChanged");
      socket.off("playerVoted");
      socket.off("votingComplete");
      socket.off("gameReset");
      socket.off("error");
    };
  }, [roomId, joined, playerName, roomPassword]);

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError(t('errorName'));
      return;
    }
    if (!roomPassword.trim()) {
      setError(t('errorPassword'));
      return;
    }

    const socket = getSocket();
    socket.emit("joinRoom", { roomId, playerName, roomPassword });
  };

  const shareLink = () => {
    const link = `${window.location.origin}/${locale}/room/${roomId}?password=${encodeURIComponent(roomPassword)}`;
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            {t('title')}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('yourName')}
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('roomPassword')}
              </label>
              <input
                type="text"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>

            <button
              onClick={handleJoin}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
            >
              {t('joinButton')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">{t('roomCode', { code: roomId })}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 p-4">
      <div className="max-w-4xl mx-auto">
        {gameData.phase === "lobby" && (
          <Lobby
            roomId={roomId}
            players={players}
            isHost={isHost}
            impostorCount={impostorCount}
            gameMode={gameMode}
            onShareLink={shareLink}
          />
        )}

        {gameData.phase === "reveal" && (
          <WordReveal
            roomId={roomId}
            category={gameData.category!}
            word={gameData.word}
            impostorClue={gameData.impostorClue}
            isImpostor={gameData.isImpostor}
            gameMode={gameMode}
          />
        )}

        {gameData.phase === "discussion" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {tDiscussion('title', { round: gameData.roundNumber })}
            </h2>
            <p className="text-gray-600 mb-6">
              {tDiscussion('instruction')}
            </p>

            {/* Show the word/role reminder */}
            {gameData.word && !gameData.isImpostor && (
              <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Your word:</p>
                <p className="text-2xl font-bold text-green-600">{gameData.word}</p>
              </div>
            )}
            {gameData.isImpostor && (
              <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">You are the impostor</p>
                <p className="text-xl font-semibold text-red-600">Category: {gameData.category}</p>
              </div>
            )}

            {/* Player Order Display */}
            <div className="mb-6 bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">{tDiscussion('playerOrder')}</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {players.filter(p => p.isAlive).map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      player.id === playerId
                        ? "bg-purple-600 text-white"
                        : "bg-white border-2 border-gray-300 text-gray-800"
                    }`}
                  >
                    <span className="font-bold">{index + 1}</span>
                    <span>{player.name}</span>
                    {player.isHost && (
                      <span className="text-xs">👑</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Leaderboard players={players} currentPlayerId={playerId!} />
            {isHost && (
              <button
                onClick={() => getSocket().emit("startVoting", { roomId })}
                className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
              >
                {tDiscussion('startVoting')}
              </button>
            )}
          </div>
        )}

        {gameData.phase === "voting" && (
          <VotingPhase
            roomId={roomId}
            players={players}
            currentPlayerId={playerId!}
          />
        )}

        {(gameData.phase === "results" || gameData.phase === "gameOver") && (
          <Results
            roomId={roomId}
            players={players}
            eliminatedPlayer={eliminatedPlayer}
            gameOver={gameOver}
            impostorsWin={impostorsWin}
            isHost={isHost}
            roundNumber={gameData.roundNumber}
          />
        )}
      </div>
    </div>
  );
}
