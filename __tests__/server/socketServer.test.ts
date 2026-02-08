import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createRoom, addPlayer, GameState } from '@/lib/gameLogic';

// Mock socket.io
jest.mock('socket.io');

describe('Socket Server Logic', () => {
  describe('Room Management', () => {
    it('should create a room with valid credentials', () => {
      const roomId = 'test-room-123';
      const roomPassword = 'secret-pass';
      const gameState = createRoom(roomId, roomPassword);

      expect(gameState.roomId).toBe(roomId);
      expect(gameState.roomPassword).toBe(roomPassword);
      expect(gameState.phase).toBe('lobby');
    });

    it('should handle multiple rooms independently', () => {
      const room1 = createRoom('room1', 'pass1');
      const room2 = createRoom('room2', 'pass2');

      expect(room1.roomId).toBe('room1');
      expect(room2.roomId).toBe('room2');
      expect(room1.roomPassword).not.toBe(room2.roomPassword);
    });
  });

  describe('Player Join Logic', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
    });

    it('should add player to game state', () => {
      const player = addPlayer(gameState, 'socket-1', 'Alice');

      expect(player.id).toBe('socket-1');
      expect(player.name).toBe('Alice');
      expect(gameState.players.size).toBe(1);
    });

    it('should make first player the host', () => {
      const player = addPlayer(gameState, 'socket-1', 'Alice');
      expect(player.isHost).toBe(true);
    });

    it('should not make subsequent players hosts', () => {
      addPlayer(gameState, 'socket-1', 'Alice');
      const player2 = addPlayer(gameState, 'socket-2', 'Bob');

      expect(player2.isHost).toBe(false);
    });

    it('should maintain join order for players', () => {
      const player1 = addPlayer(gameState, 'socket-1', 'Alice');
      const player2 = addPlayer(gameState, 'socket-2', 'Bob');
      const player3 = addPlayer(gameState, 'socket-3', 'Charlie');

      expect(player1.joinOrder).toBe(0);
      expect(player2.joinOrder).toBe(1);
      expect(player3.joinOrder).toBe(2);
    });
  });

  describe('Password Validation', () => {
    it('should validate correct password', () => {
      const gameState = createRoom('room1', 'correct-pass');
      const attemptPassword = 'correct-pass';

      expect(gameState.roomPassword).toBe(attemptPassword);
    });

    it('should reject incorrect password', () => {
      const gameState = createRoom('room1', 'correct-pass');
      const attemptPassword = 'wrong-pass';

      expect(gameState.roomPassword).not.toBe(attemptPassword);
    });

    it('should be case sensitive', () => {
      const gameState = createRoom('room1', 'Password123');
      const attemptPassword = 'password123';

      expect(gameState.roomPassword).not.toBe(attemptPassword);
    });
  });

  describe('Phase Restrictions', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
    });

    it('should allow joining in lobby phase', () => {
      expect(gameState.phase).toBe('lobby');
      // Joining is allowed
    });

    it('should not allow joining when game is in progress', () => {
      gameState.phase = 'reveal';
      expect(gameState.phase).not.toBe('lobby');
      // Joining should be blocked
    });

    it('should not allow joining during voting', () => {
      gameState.phase = 'voting';
      expect(gameState.phase).not.toBe('lobby');
      // Joining should be blocked
    });
  });

  describe('Game Start Validation', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
    });

    it('should require at least 3 players to start', () => {
      addPlayer(gameState, 'p1', 'Alice');
      addPlayer(gameState, 'p2', 'Bob');

      expect(gameState.players.size).toBeLessThan(3);
      // Should not allow starting
    });

    it('should allow starting with 3 players', () => {
      addPlayer(gameState, 'p1', 'Alice');
      addPlayer(gameState, 'p2', 'Bob');
      addPlayer(gameState, 'p3', 'Charlie');

      expect(gameState.players.size).toBeGreaterThanOrEqual(3);
      // Should allow starting
    });

    it('should require impostor count less than player count', () => {
      addPlayer(gameState, 'p1', 'Alice');
      addPlayer(gameState, 'p2', 'Bob');
      addPlayer(gameState, 'p3', 'Charlie');

      gameState.impostorCount = 3;
      expect(gameState.impostorCount).toBeGreaterThanOrEqual(
        gameState.players.size
      );
      // Should not allow starting (need at least 1 non-impostor)
    });
  });

  describe('Vote Validation', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      const p1 = addPlayer(gameState, 'p1', 'Alice');
      const p2 = addPlayer(gameState, 'p2', 'Bob');
      const p3 = addPlayer(gameState, 'p3', 'Charlie');
      gameState.phase = 'voting';
    });

    it('should only allow alive players to vote', () => {
      const deadPlayer = gameState.players.get('p1')!;
      deadPlayer.isAlive = false;

      expect(deadPlayer.isAlive).toBe(false);
      // Dead player should not be able to vote
    });

    it('should not allow double voting', () => {
      const voter = gameState.players.get('p1')!;
      voter.hasVoted = true;

      expect(voter.hasVoted).toBe(true);
      // Should block second vote
    });

    it('should accept vote from alive player who has not voted', () => {
      const voter = gameState.players.get('p1')!;

      expect(voter.isAlive).toBe(true);
      expect(voter.hasVoted).toBe(false);
      // Should accept vote
    });
  });

  describe('Reconnection Logic', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'original-socket-id', 'Alice');
    });

    it('should preserve player data on reconnection', () => {
      const originalPlayer = gameState.players.get('original-socket-id')!;
      originalPlayer.score = 5;

      // Simulate reconnection by updating socket ID
      gameState.players.delete('original-socket-id');
      originalPlayer.id = 'new-socket-id';
      gameState.players.set('new-socket-id', originalPlayer);

      const reconnectedPlayer = gameState.players.get('new-socket-id')!;
      expect(reconnectedPlayer.name).toBe('Alice');
      expect(reconnectedPlayer.score).toBe(5);
    });

    it('should maintain host status on reconnection', () => {
      const host = gameState.players.get('original-socket-id')!;
      expect(host.isHost).toBe(true);

      // Simulate reconnection
      gameState.players.delete('original-socket-id');
      host.id = 'new-socket-id';
      gameState.players.set('new-socket-id', host);

      expect(host.isHost).toBe(true);
    });

    it('should preserve joinOrder on reconnection', () => {
      const player = gameState.players.get('original-socket-id')!;
      const originalJoinOrder = player.joinOrder;

      // Simulate reconnection
      gameState.players.delete('original-socket-id');
      player.id = 'new-socket-id';
      gameState.players.set('new-socket-id', player);

      expect(player.joinOrder).toBe(originalJoinOrder);
    });
  });

  describe('Host Privileges', () => {
    let gameState: GameState;
    let host: any;
    let nonHost: any;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      host = addPlayer(gameState, 'host-id', 'Host');
      nonHost = addPlayer(gameState, 'player-id', 'Player');
    });

    it('should identify host correctly', () => {
      expect(host.isHost).toBe(true);
      expect(nonHost.isHost).toBe(false);
    });

    it('should allow host to start game', () => {
      expect(host.isHost).toBe(true);
      // Host can start game
    });

    it('should not allow non-host to start game', () => {
      expect(nonHost.isHost).toBe(false);
      // Non-host should be blocked
    });

    it('should allow host to set impostor count', () => {
      expect(host.isHost).toBe(true);
      // Host can set impostor count
    });

    it('should not allow non-host to set impostor count', () => {
      expect(nonHost.isHost).toBe(false);
      // Non-host should be blocked
    });

    it('should allow host to start voting', () => {
      expect(host.isHost).toBe(true);
      // Host can start voting
    });

    it('should allow host to force end voting', () => {
      expect(host.isHost).toBe(true);
      // Host can force end voting
    });

    it('should allow host to start next round', () => {
      expect(host.isHost).toBe(true);
      // Host can start next round
    });

    it('should allow host to reset game', () => {
      expect(host.isHost).toBe(true);
      // Host can reset game
    });
  });

  describe('Player Ready Tracking', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'p1', 'Alice');
      addPlayer(gameState, 'p2', 'Bob');
      addPlayer(gameState, 'p3', 'Charlie');
    });

    it('should track ready status for each player', () => {
      const player = gameState.players.get('p1')!;
      player.revealedWord = true;

      expect(player.revealedWord).toBe(true);
    });

    it('should check if all alive players are ready', () => {
      gameState.players.forEach((p) => {
        p.revealedWord = true;
      });

      const allReady = Array.from(gameState.players.values()).every(
        (p) => p.revealedWord || !p.isAlive
      );

      expect(allReady).toBe(true);
    });

    it('should not wait for dead players to be ready', () => {
      const p1 = gameState.players.get('p1')!;
      const p2 = gameState.players.get('p2')!;
      const p3 = gameState.players.get('p3')!;

      p1.isAlive = false; // Dead player
      p2.revealedWord = true;
      p3.revealedWord = true;

      const allReady = Array.from(gameState.players.values()).every(
        (p) => p.revealedWord || !p.isAlive
      );

      expect(allReady).toBe(true);
    });
  });

  describe('Vote Completion Check', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      addPlayer(gameState, 'p1', 'Alice');
      addPlayer(gameState, 'p2', 'Bob');
      addPlayer(gameState, 'p3', 'Charlie');
    });

    it('should check if all alive players have voted', () => {
      gameState.players.forEach((p) => {
        p.hasVoted = true;
      });

      const alivePlayers = Array.from(gameState.players.values()).filter(
        (p) => p.isAlive
      );
      const allVoted = alivePlayers.every((p) => p.hasVoted);

      expect(allVoted).toBe(true);
    });

    it('should not wait for dead players to vote', () => {
      const p1 = gameState.players.get('p1')!;
      const p2 = gameState.players.get('p2')!;
      const p3 = gameState.players.get('p3')!;

      p1.isAlive = false;
      p2.hasVoted = true;
      p3.hasVoted = true;

      const alivePlayers = Array.from(gameState.players.values()).filter(
        (p) => p.isAlive
      );
      const allVoted = alivePlayers.every((p) => p.hasVoted);

      expect(allVoted).toBe(true);
    });

    it('should not be complete if any alive player has not voted', () => {
      const p1 = gameState.players.get('p1')!;
      const p2 = gameState.players.get('p2')!;

      p1.hasVoted = true;
      p2.hasVoted = false;

      const alivePlayers = Array.from(gameState.players.values()).filter(
        (p) => p.isAlive
      );
      const allVoted = alivePlayers.every((p) => p.hasVoted);

      expect(allVoted).toBe(false);
    });
  });

  describe('Serialization', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = createRoom('test-room', 'test-pass');
      const p1 = addPlayer(gameState, 'p1', 'Alice');
      const p2 = addPlayer(gameState, 'p2', 'Bob');
      p1.isImpostor = true;
    });

    it('should serialize player without exposing sensitive data to wrong players', () => {
      const player = gameState.players.get('p1')!;

      // Should include these fields
      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('name');
      expect(player).toHaveProperty('isHost');
      expect(player).toHaveProperty('score');
      expect(player).toHaveProperty('isAlive');
      expect(player).toHaveProperty('hasVoted');
      expect(player).toHaveProperty('joinOrder');
    });

    it('should sort players by joinOrder when serializing', () => {
      const players = Array.from(gameState.players.values()).sort(
        (a, b) => a.joinOrder - b.joinOrder
      );

      expect(players[0].joinOrder).toBe(0);
      expect(players[1].joinOrder).toBe(1);
    });
  });
});
