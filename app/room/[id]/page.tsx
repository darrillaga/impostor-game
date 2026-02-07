"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getSocket } from "@/lib/socket";
import Lobby from "@/components/Lobby";
import WordReveal from "@/components/WordReveal";
import VotingPhase from "@/components/VotingPhase";
import Results from "@/components/Results";
import Leaderboard from "@/components/Leaderboard";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  isAlive: boolean;
  hasVoted?: boolean;
}

interface GameData {
  phase: string;
  category: string | null;
  word: string | null;
  impostorClue: string | null;
  isImpostor: boolean;
  roundNumber: number;
}

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
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

    socket.on("gameStarted", (data) => {
      setGameData({
        phase: data.phase,
        category: data.category,
        word: data.word,
        impostorClue: data.impostorClue,
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

    socket.on("playerVoted", () => {
      // Could add visual feedback here
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
      setError("Please enter your name");
      return;
    }
    if (!roomPassword.trim()) {
      setError("Please enter room password");
      return;
    }

    const socket = getSocket();
    socket.emit("joinRoom", { roomId, playerName, roomPassword });
  };

  const shareLink = () => {
    const link = `${window.location.origin}/room/${roomId}?password=${encodeURIComponent(roomPassword)}`;
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Join Room
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Password
              </label>
              <input
                type="text"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Enter room password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>

            <button
              onClick={handleJoin}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
            >
              Join Game
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Room Code: {roomId}</p>
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
          />
        )}

        {gameData.phase === "discussion" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Round {gameData.roundNumber} - Discussion Time
            </h2>
            <p className="text-gray-600 mb-6">
              Discuss who you think the impostor is!
            </p>
            <Leaderboard players={players} currentPlayerId={playerId!} />
            {isHost && (
              <button
                onClick={() => getSocket().emit("startVoting", { roomId })}
                className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
              >
                Start Voting
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
