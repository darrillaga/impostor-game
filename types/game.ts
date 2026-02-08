export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  isAlive: boolean;
  hasVoted?: boolean;
  isImpostor?: boolean;
  joinOrder: number;
}

export interface GameData {
  phase: string;
  category: string | null;
  word: string | null;
  impostorClue: string | null;
  isImpostor: boolean;
  roundNumber: number;
}
