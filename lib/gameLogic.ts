import { Category, WordData } from "./gameData";

export type GamePhase =
  | "lobby"
  | "reveal"
  | "discussion"
  | "voting"
  | "results"
  | "gameOver";

export interface Player {
  id: string;
  name: string;
  isImpostor: boolean;
  isAlive: boolean;
  isHost: boolean;
  score: number;
  hasVoted?: boolean;
  revealedWord?: boolean;
}

export interface Vote {
  voterId: string;
  targetId: string;
}

export interface GameState {
  roomId: string;
  roomPassword: string;
  phase: GamePhase;
  players: Map<string, Player>;
  impostorCount: number;
  category: Category | null;
  selectedWord: WordData | null;
  votes: Vote[];
  eliminatedPlayerId: string | null;
  roundNumber: number;
  gameNumber: number;
}

export interface RoomState {
  [roomId: string]: GameState;
}

export function createRoom(roomId: string, roomPassword: string): GameState {
  return {
    roomId,
    roomPassword,
    phase: "lobby",
    players: new Map(),
    impostorCount: 1,
    category: null,
    selectedWord: null,
    votes: [],
    eliminatedPlayerId: null,
    roundNumber: 0,
    gameNumber: 1,
  };
}

export function addPlayer(
  gameState: GameState,
  playerId: string,
  playerName: string
): Player {
  const isHost = gameState.players.size === 0;
  const player: Player = {
    id: playerId,
    name: playerName,
    isImpostor: false,
    isAlive: true,
    isHost,
    score: 0,
    hasVoted: false,
    revealedWord: false,
  };
  gameState.players.set(playerId, player);
  return player;
}

export function selectImpostors(gameState: GameState, count: number): void {
  const players = Array.from(gameState.players.values());
  const shuffled = players.sort(() => Math.random() - 0.5);

  // Reset all players
  players.forEach(p => {
    p.isImpostor = false;
  });

  // Select impostors
  for (let i = 0; i < Math.min(count, players.length - 1); i++) {
    shuffled[i].isImpostor = true;
  }

  gameState.impostorCount = count;
}

export function checkWinCondition(gameState: GameState): {
  gameOver: boolean;
  impostorsWin: boolean;
} {
  const alivePlayers = Array.from(gameState.players.values()).filter(p => p.isAlive);
  const aliveImpostors = alivePlayers.filter(p => p.isImpostor);
  const aliveNormals = alivePlayers.filter(p => !p.isImpostor);

  // Impostors win if they equal or outnumber normal players
  if (aliveImpostors.length >= aliveNormals.length && aliveImpostors.length > 0) {
    return { gameOver: true, impostorsWin: true };
  }

  // Normals win if all impostors are eliminated
  if (aliveImpostors.length === 0) {
    return { gameOver: true, impostorsWin: false };
  }

  return { gameOver: false, impostorsWin: false };
}

export function tallyVotes(gameState: GameState): string | null {
  const voteCounts: { [playerId: string]: number } = {};

  gameState.votes.forEach(vote => {
    voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
  });

  let maxVotes = 0;
  let eliminatedId: string | null = null;
  let isTie = false;

  Object.entries(voteCounts).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = playerId;
      isTie = false;
    } else if (count === maxVotes && maxVotes > 0) {
      isTie = true;
    }
  });

  // If tie, no one is eliminated this round
  if (isTie) {
    return null;
  }

  return eliminatedId;
}

export function eliminatePlayer(gameState: GameState, playerId: string): void {
  const player = gameState.players.get(playerId);
  if (player) {
    player.isAlive = false;
    gameState.eliminatedPlayerId = playerId;
  }
}

export function updateScores(gameState: GameState, impostorsWin: boolean): void {
  gameState.players.forEach(player => {
    if (impostorsWin && player.isImpostor && player.isAlive) {
      player.score += 2;
    } else if (!impostorsWin && !player.isImpostor && player.isAlive) {
      player.score += 1;
    }
  });
}

export function resetForNextRound(gameState: GameState): void {
  gameState.votes = [];
  gameState.eliminatedPlayerId = null;
  gameState.roundNumber += 1;

  gameState.players.forEach(player => {
    player.hasVoted = false;
  });
}

export function resetForNextGame(gameState: GameState): void {
  gameState.phase = "lobby";
  gameState.category = null;
  gameState.selectedWord = null;
  gameState.votes = [];
  gameState.eliminatedPlayerId = null;
  gameState.roundNumber = 0;
  gameState.gameNumber += 1;

  gameState.players.forEach(player => {
    player.isImpostor = false;
    player.isAlive = true;
    player.hasVoted = false;
    player.revealedWord = false;
  });
}
