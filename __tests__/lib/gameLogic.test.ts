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
} from '@/lib/gameLogic';

describe('Game Logic', () => {
  describe('createRoom', () => {
    it('should create a room with correct initial state', () => {
      const roomId = 'test-room';
      const roomPassword = 'test-pass';
      const gameState = createRoom(roomId, roomPassword);

      expect(gameState.roomId).toBe(roomId);
      expect(gameState.roomPassword).toBe(roomPassword);
      expect(gameState.phase).toBe('lobby');
      expect(gameState.players.size).toBe(0);
      expect(gameState.impostorCount).toBe(1);
      expect(gameState.category).toBeNull();
      expect(gameState.selectedWord).toBeNull();
      expect(gameState.votes).toEqual([]);
      expect(gameState.eliminatedPlayerId).toBeNull();
      expect(gameState.roundNumber).toBe(0);
      expect(gameState.gameNumber).toBe(1);
    });
  });

  describe('addPlayer', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
    });

    it('should add first player as host with joinOrder 0', () => {
      const player = addPlayer(gameState, 'player1', 'Alice');

      expect(player.id).toBe('player1');
      expect(player.name).toBe('Alice');
      expect(player.isHost).toBe(true);
      expect(player.isImpostor).toBe(false);
      expect(player.isAlive).toBe(true);
      expect(player.score).toBe(0);
      expect(player.hasVoted).toBe(false);
      expect(player.revealedWord).toBe(false);
      expect(player.joinOrder).toBe(0);
      expect(gameState.players.size).toBe(1);
    });

    it('should add second player as non-host with joinOrder 1', () => {
      addPlayer(gameState, 'player1', 'Alice');
      const player2 = addPlayer(gameState, 'player2', 'Bob');

      expect(player2.isHost).toBe(false);
      expect(player2.joinOrder).toBe(1);
      expect(gameState.players.size).toBe(2);
    });

    it('should maintain correct joinOrder for multiple players', () => {
      const player1 = addPlayer(gameState, 'player1', 'Alice');
      const player2 = addPlayer(gameState, 'player2', 'Bob');
      const player3 = addPlayer(gameState, 'player3', 'Charlie');

      expect(player1.joinOrder).toBe(0);
      expect(player2.joinOrder).toBe(1);
      expect(player3.joinOrder).toBe(2);
    });
  });

  describe('selectImpostors', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'player1', 'Alice'); // Host
      addPlayer(gameState, 'player2', 'Bob');
      addPlayer(gameState, 'player3', 'Charlie');
      addPlayer(gameState, 'player4', 'David');
    });

    it('should select specified number of impostors', () => {
      selectImpostors(gameState, 2);

      const impostors = Array.from(gameState.players.values()).filter(
        (p) => p.isImpostor
      );
      expect(impostors.length).toBe(2);
    });

    it('should never select host as impostor', () => {
      selectImpostors(gameState, 2);

      const host = gameState.players.get('player1');
      expect(host?.isImpostor).toBe(false);
    });

    it('should reset all players before selecting new impostors', () => {
      selectImpostors(gameState, 1);
      selectImpostors(gameState, 2);

      const impostors = Array.from(gameState.players.values()).filter(
        (p) => p.isImpostor
      );
      expect(impostors.length).toBe(2);
    });

    it('should not exceed available non-host players', () => {
      selectImpostors(gameState, 10); // Try to select more than available

      const impostors = Array.from(gameState.players.values()).filter(
        (p) => p.isImpostor
      );
      expect(impostors.length).toBe(3); // Only 3 non-host players
    });

    it('should update impostor count in game state', () => {
      selectImpostors(gameState, 2);
      expect(gameState.impostorCount).toBe(2);
    });
  });

  describe('checkWinCondition', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'player1', 'Alice'); // Host
      addPlayer(gameState, 'player2', 'Bob');
      addPlayer(gameState, 'player3', 'Charlie');
      addPlayer(gameState, 'player4', 'David');
      selectImpostors(gameState, 1);
    });

    it('should return normals win when all impostors eliminated', () => {
      const impostor = Array.from(gameState.players.values()).find(
        (p) => p.isImpostor
      );
      if (impostor) {
        impostor.isAlive = false;
      }

      const result = checkWinCondition(gameState);
      expect(result.gameOver).toBe(true);
      expect(result.impostorsWin).toBe(false);
    });

    it('should end 1-impostor game after first round with impostor win', () => {
      gameState.roundNumber = 1;
      gameState.impostorCount = 1;

      const result = checkWinCondition(gameState);
      expect(result.gameOver).toBe(true);
      expect(result.impostorsWin).toBe(true);
    });

    it('should end 1-impostor game after first round with normal win if impostor eliminated', () => {
      gameState.roundNumber = 1;
      gameState.impostorCount = 1;

      const impostor = Array.from(gameState.players.values()).find(
        (p) => p.isImpostor
      );
      if (impostor) {
        impostor.isAlive = false;
      }

      const result = checkWinCondition(gameState);
      expect(result.gameOver).toBe(true);
      expect(result.impostorsWin).toBe(false);
    });

    it('should return impostors win when they equal normal players in multi-impostor game', () => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'player1', 'Alice'); // Host
      addPlayer(gameState, 'player2', 'Bob');
      addPlayer(gameState, 'player3', 'Charlie');
      addPlayer(gameState, 'player4', 'David');
      addPlayer(gameState, 'player5', 'Eve');
      selectImpostors(gameState, 2);

      // Kill 2 normal players, leaving 2 impostors and 1 normal (host)
      const normalPlayers = Array.from(gameState.players.values()).filter(
        (p) => !p.isImpostor && !p.isHost
      );
      normalPlayers[0].isAlive = false;

      const result = checkWinCondition(gameState);
      expect(result.gameOver).toBe(true);
      expect(result.impostorsWin).toBe(true);
    });

    it('should return game continues when neither win condition met', () => {
      gameState.roundNumber = 0;
      gameState.impostorCount = 2;
      addPlayer(gameState, 'player5', 'Eve');
      selectImpostors(gameState, 2);

      const result = checkWinCondition(gameState);
      expect(result.gameOver).toBe(false);
      expect(result.impostorsWin).toBe(false);
    });
  });

  describe('tallyVotes', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'player1', 'Alice');
      addPlayer(gameState, 'player2', 'Bob');
      addPlayer(gameState, 'player3', 'Charlie');
      addPlayer(gameState, 'player4', 'David');
    });

    it('should return player with most votes', () => {
      gameState.votes = [
        { voterId: 'player1', targetId: 'player2' },
        { voterId: 'player3', targetId: 'player2' },
        { voterId: 'player4', targetId: 'player3' },
      ];

      const eliminated = tallyVotes(gameState);
      expect(eliminated).toBe('player2');
    });

    it('should return null when there is a tie', () => {
      gameState.votes = [
        { voterId: 'player1', targetId: 'player2' },
        { voterId: 'player3', targetId: 'player4' },
      ];

      const eliminated = tallyVotes(gameState);
      expect(eliminated).toBeNull();
    });

    it('should return null when no votes cast', () => {
      gameState.votes = [];
      const eliminated = tallyVotes(gameState);
      expect(eliminated).toBeNull();
    });

    it('should handle unanimous vote', () => {
      gameState.votes = [
        { voterId: 'player1', targetId: 'player2' },
        { voterId: 'player3', targetId: 'player2' },
        { voterId: 'player4', targetId: 'player2' },
      ];

      const eliminated = tallyVotes(gameState);
      expect(eliminated).toBe('player2');
    });
  });

  describe('eliminatePlayer', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'player1', 'Alice');
      addPlayer(gameState, 'player2', 'Bob');
    });

    it('should mark player as not alive', () => {
      eliminatePlayer(gameState, 'player1');

      const player = gameState.players.get('player1');
      expect(player?.isAlive).toBe(false);
    });

    it('should set eliminatedPlayerId in game state', () => {
      eliminatePlayer(gameState, 'player2');
      expect(gameState.eliminatedPlayerId).toBe('player2');
    });

    it('should handle non-existent player gracefully', () => {
      eliminatePlayer(gameState, 'nonexistent');
      expect(gameState.eliminatedPlayerId).toBeNull();
    });
  });

  describe('updateScores', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'player1', 'Alice'); // Host
      addPlayer(gameState, 'player2', 'Bob');
      addPlayer(gameState, 'player3', 'Charlie');
      addPlayer(gameState, 'player4', 'David');
      selectImpostors(gameState, 1);
    });

    it('should give 2 points to alive impostors when they win', () => {
      updateScores(gameState, true);

      const impostor = Array.from(gameState.players.values()).find(
        (p) => p.isImpostor
      );
      expect(impostor?.score).toBe(2);
    });

    it('should give 1 point to alive normal players when they win', () => {
      updateScores(gameState, false);

      const normalPlayers = Array.from(gameState.players.values()).filter(
        (p) => !p.isImpostor
      );
      normalPlayers.forEach((player) => {
        expect(player.score).toBe(1);
      });
    });

    it('should not give points to dead players', () => {
      const impostor = Array.from(gameState.players.values()).find(
        (p) => p.isImpostor
      );
      if (impostor) {
        impostor.isAlive = false;
      }

      updateScores(gameState, true);
      expect(impostor?.score).toBe(0);
    });

    it('should accumulate scores across multiple games', () => {
      updateScores(gameState, false);

      const normalPlayers = Array.from(gameState.players.values()).filter(
        (p) => !p.isImpostor
      );

      updateScores(gameState, false);

      normalPlayers.forEach((player) => {
        expect(player.score).toBe(2);
      });
    });
  });

  describe('resetForNextRound', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'player1', 'Alice');
      addPlayer(gameState, 'player2', 'Bob');
      gameState.votes = [{ voterId: 'player1', targetId: 'player2' }];
      gameState.eliminatedPlayerId = 'player2';
      gameState.roundNumber = 1;
      gameState.players.get('player1')!.hasVoted = true;
    });

    it('should clear votes', () => {
      resetForNextRound(gameState);
      expect(gameState.votes).toEqual([]);
    });

    it('should clear eliminatedPlayerId', () => {
      resetForNextRound(gameState);
      expect(gameState.eliminatedPlayerId).toBeNull();
    });

    it('should increment round number', () => {
      resetForNextRound(gameState);
      expect(gameState.roundNumber).toBe(2);
    });

    it('should reset hasVoted for all players', () => {
      resetForNextRound(gameState);

      gameState.players.forEach((player) => {
        expect(player.hasVoted).toBe(false);
      });
    });
  });

  describe('resetForNextGame', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'player1', 'Alice');
      addPlayer(gameState, 'player2', 'Bob');
      selectImpostors(gameState, 1);
      gameState.phase = 'gameOver';
      gameState.votes = [{ voterId: 'player1', targetId: 'player2' }];
      gameState.eliminatedPlayerId = 'player2';
      gameState.roundNumber = 2;
      gameState.gameNumber = 1;
      const player2 = gameState.players.get('player2')!;
      player2.isAlive = false;
      player2.hasVoted = true;
      player2.revealedWord = true;
    });

    it('should reset phase to lobby', () => {
      resetForNextGame(gameState);
      expect(gameState.phase).toBe('lobby');
    });

    it('should clear category and selected word', () => {
      resetForNextGame(gameState);
      expect(gameState.category).toBeNull();
      expect(gameState.selectedWord).toBeNull();
    });

    it('should clear votes and eliminatedPlayerId', () => {
      resetForNextGame(gameState);
      expect(gameState.votes).toEqual([]);
      expect(gameState.eliminatedPlayerId).toBeNull();
    });

    it('should reset round number to 0', () => {
      resetForNextGame(gameState);
      expect(gameState.roundNumber).toBe(0);
    });

    it('should increment game number', () => {
      resetForNextGame(gameState);
      expect(gameState.gameNumber).toBe(2);
    });

    it('should reset all player states', () => {
      resetForNextGame(gameState);

      gameState.players.forEach((player) => {
        expect(player.isImpostor).toBe(false);
        expect(player.isAlive).toBe(true);
        expect(player.hasVoted).toBe(false);
        expect(player.revealedWord).toBe(false);
      });
    });

    it('should preserve player scores', () => {
      gameState.players.get('player1')!.score = 5;
      gameState.players.get('player2')!.score = 3;

      resetForNextGame(gameState);

      expect(gameState.players.get('player1')!.score).toBe(5);
      expect(gameState.players.get('player2')!.score).toBe(3);
    });
  });
});
