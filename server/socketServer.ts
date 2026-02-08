import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import {
  createRoom,
  addPlayer,
  selectImpostors,
  checkWinCondition,
  tallyVotes,
  eliminatePlayer,
  updateScores,
  resetForNextRound,
  resetForNextGame,
  GameState,
  Player,
} from "../lib/gameLogic";
import { getRandomCategory, getRandomWord } from "../lib/gameData";

const rooms = new Map<string, GameState>();

export function initSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("createRoom", ({ roomId, roomPassword }) => {
      const gameState = createRoom(roomId, roomPassword);
      rooms.set(roomId, gameState);
      socket.emit("roomCreated", { roomId });
    });

    socket.on("joinRoom", ({ roomId, playerName, roomPassword }) => {
      const gameState = rooms.get(roomId);

      if (!gameState) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      if (gameState.roomPassword !== roomPassword) {
        socket.emit("error", { message: "Incorrect password" });
        return;
      }

      if (gameState.phase !== "lobby") {
        socket.emit("error", { message: "Game already in progress" });
        return;
      }

      const player = addPlayer(gameState, socket.id, playerName);
      socket.join(roomId);

      socket.emit("joinedRoom", {
        playerId: socket.id,
        player: serializePlayer(player),
        gameState: serializeGameState(gameState),
      });

      io.to(roomId).emit("playerJoined", {
        player: serializePlayer(player),
        players: serializePlayers(gameState),
      });
    });

    socket.on("reconnect", ({ roomId, playerId, roomPassword }) => {
      const gameState = rooms.get(roomId);

      if (!gameState) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      if (gameState.roomPassword !== roomPassword) {
        socket.emit("error", { message: "Incorrect password" });
        return;
      }

      const player = gameState.players.get(playerId);
      if (!player) {
        socket.emit("error", { message: "Player not found" });
        return;
      }

      // Update socket ID for reconnection
      gameState.players.delete(playerId);
      player.id = socket.id;
      gameState.players.set(socket.id, player);

      socket.join(roomId);
      socket.emit("reconnected", {
        playerId: socket.id,
        player: serializePlayer(player),
        gameState: serializeGameState(gameState),
      });
    });

    socket.on("setImpostorCount", ({ roomId, count }) => {
      const gameState = rooms.get(roomId);
      if (!gameState) return;

      const player = gameState.players.get(socket.id);
      if (!player?.isHost) return;

      gameState.impostorCount = count;
      io.to(roomId).emit("impostorCountUpdated", { count });
    });

    socket.on("startGame", ({ roomId }) => {
      const gameState = rooms.get(roomId);
      if (!gameState) return;

      const player = gameState.players.get(socket.id);
      if (!player?.isHost) return;

      // Select random category and word
      const category = getRandomCategory();
      const word = getRandomWord(category);
      gameState.category = category;
      gameState.selectedWord = word;

      // Select impostors
      selectImpostors(gameState, gameState.impostorCount);

      // Move to reveal phase
      gameState.phase = "reveal";
      gameState.roundNumber = 1;

      // Send game state to all players
      gameState.players.forEach((p, id) => {
        io.to(id).emit("gameStarted", {
          phase: "reveal",
          category: category.name,
          word: p.isImpostor ? null : word.word,
          wordEs: p.isImpostor ? null : word.wordEs,
          impostorClue: p.isImpostor ? word.impostorClue : null,
          impostorClueEs: p.isImpostor ? word.impostorClueEs : null,
          isImpostor: p.isImpostor,
        });
      });
    });

    socket.on("wordRevealed", ({ roomId }) => {
      const gameState = rooms.get(roomId);
      if (!gameState) return;

      const player = gameState.players.get(socket.id);
      if (player) {
        player.revealedWord = true;
      }
    });

    socket.on("playerReady", ({ roomId }) => {
      const gameState = rooms.get(roomId);
      if (!gameState) return;

      const player = gameState.players.get(socket.id);
      if (!player) return;

      // Mark player as ready (reuse revealedWord flag)
      player.revealedWord = true;

      // Check if all alive players are ready
      const allReady = Array.from(gameState.players.values()).every(
        p => p.revealedWord || !p.isAlive
      );

      if (allReady) {
        gameState.phase = "discussion";
        io.to(roomId).emit("phaseChanged", {
          phase: "discussion",
          roundNumber: gameState.roundNumber,
        });
      }
    });

    socket.on("startVoting", ({ roomId }) => {
      const gameState = rooms.get(roomId);
      if (!gameState) return;

      const player = gameState.players.get(socket.id);
      if (!player?.isHost) return;

      gameState.phase = "voting";
      gameState.votes = [];

      gameState.players.forEach(p => {
        p.hasVoted = false;
      });

      io.to(roomId).emit("phaseChanged", { phase: "voting" });
    });

    socket.on("vote", ({ roomId, targetId }) => {
      const gameState = rooms.get(roomId);
      if (!gameState) return;

      const voter = gameState.players.get(socket.id);
      if (!voter || !voter.isAlive || voter.hasVoted) return;

      gameState.votes.push({ voterId: socket.id, targetId });
      voter.hasVoted = true;

      // Broadcast updated player state so everyone sees the vote count
      io.to(roomId).emit("playerVoted", {
        voterId: socket.id,
        players: serializePlayers(gameState)
      });

      // Check if all alive players voted
      const alivePlayers = Array.from(gameState.players.values()).filter(p => p.isAlive);
      const allVoted = alivePlayers.every(p => p.hasVoted);

      if (allVoted) {
        // Tally votes
        const eliminatedId = tallyVotes(gameState);

        if (eliminatedId) {
          eliminatePlayer(gameState, eliminatedId);
        }

        // Check win condition
        const { gameOver, impostorsWin } = checkWinCondition(gameState);

        gameState.phase = gameOver ? "gameOver" : "results";

        if (gameOver) {
          updateScores(gameState, impostorsWin);
        }

        const eliminatedPlayer = eliminatedId ? gameState.players.get(eliminatedId) : null;

        io.to(roomId).emit("votingComplete", {
          eliminatedPlayer: eliminatedPlayer ? serializePlayer(eliminatedPlayer) : null,
          votes: gameState.votes,
          gameOver,
          impostorsWin: gameOver ? impostorsWin : null,
          players: serializePlayers(gameState),
        });
      }
    });

    socket.on("forceEndVoting", ({ roomId }) => {
      const gameState = rooms.get(roomId);
      if (!gameState) return;

      const player = gameState.players.get(socket.id);
      if (!player?.isHost) return;

      // Force end voting and tally current votes
      const eliminatedId = tallyVotes(gameState);

      if (eliminatedId) {
        eliminatePlayer(gameState, eliminatedId);
      }

      // Check win condition
      const { gameOver, impostorsWin } = checkWinCondition(gameState);

      gameState.phase = gameOver ? "gameOver" : "results";

      if (gameOver) {
        updateScores(gameState, impostorsWin);
      }

      const eliminatedPlayer = eliminatedId ? gameState.players.get(eliminatedId) : null;

      io.to(roomId).emit("votingComplete", {
        eliminatedPlayer: eliminatedPlayer ? serializePlayer(eliminatedPlayer) : null,
        votes: gameState.votes,
        gameOver,
        impostorsWin: gameOver ? impostorsWin : null,
        players: serializePlayers(gameState),
      });
    });

    socket.on("nextRound", ({ roomId }) => {
      const gameState = rooms.get(roomId);
      if (!gameState) return;

      const player = gameState.players.get(socket.id);
      if (!player?.isHost) return;

      resetForNextRound(gameState);
      gameState.phase = "discussion";

      io.to(roomId).emit("phaseChanged", {
        phase: "discussion",
        roundNumber: gameState.roundNumber,
      });
    });

    socket.on("playAgain", ({ roomId }) => {
      const gameState = rooms.get(roomId);
      if (!gameState) return;

      const player = gameState.players.get(socket.id);
      if (!player?.isHost) return;

      resetForNextGame(gameState);

      io.to(roomId).emit("gameReset", {
        gameState: serializeGameState(gameState),
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

function serializePlayer(player: Player) {
  return {
    id: player.id,
    name: player.name,
    isImpostor: player.isImpostor,
    isAlive: player.isAlive,
    isHost: player.isHost,
    score: player.score,
    hasVoted: player.hasVoted,
    joinOrder: player.joinOrder,
  };
}

function serializePlayers(gameState: GameState) {
  return Array.from(gameState.players.values())
    .sort((a, b) => a.joinOrder - b.joinOrder)
    .map(serializePlayer);
}

function serializeGameState(gameState: GameState) {
  return {
    roomId: gameState.roomId,
    phase: gameState.phase,
    players: serializePlayers(gameState),
    impostorCount: gameState.impostorCount,
    category: gameState.category?.name || null,
    roundNumber: gameState.roundNumber,
    gameNumber: gameState.gameNumber,
  };
}
