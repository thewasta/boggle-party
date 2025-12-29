import { describe, it, expect, beforeEach } from 'vitest';
import { RoomsManager } from '../rooms-manager';
import type { Player, Room } from '../types';

function createMockPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    avatar: '🎮',
    isHost: true,
    score: 0,
    foundWords: [],
    createdAt: new Date(),
  };
}

describe('RoomsManager', () => {
  let manager: RoomsManager;

  beforeEach(() => {
    manager = new RoomsManager();
  });

  describe('createRoom', () => {
    it('should create a room with unique 6-character code', () => {
      const player: Player = {
        id: 'player-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = manager.createRoom(player, 4);

      expect(room).toBeDefined();
      expect(room.code).toHaveLength(6);
      expect(room.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(room.host.id).toBe('player-1');
      expect(room.players.size).toBe(1);
      expect(room.status).toBe('waiting');
    });

    it('should generate unique room codes', () => {
      const player1: Player = {
        id: 'player-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };
      const player2: Player = {
        id: 'player-2',
        name: 'Bob',
        avatar: '🚀',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const codes = new Set<string>();

      // Create 100 rooms, all codes should be unique
      for (let i = 0; i < 100; i++) {
        const room = manager.createRoom(player1, 4);
        codes.add(room.code);
      }

      expect(codes.size).toBe(100);
    });
  });

  describe('getRoom', () => {
    it('should return room by code', () => {
      const player: Player = {
        id: 'player-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = manager.createRoom(player, 4);

      const found = manager.getRoom(room.code);

      expect(found).toBeDefined();
      expect(found?.code).toBe(room.code);
    });

    it('should return null for non-existent room', () => {
      const found = manager.getRoom('INVALID');

      expect(found).toBeNull();
    });
  });

  describe('joinRoom', () => {
    it('should add player to existing room', () => {
      const host: Player = {
        id: 'player-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = manager.createRoom(host, 4);

      const player: Player = {
        id: 'player-2',
        name: 'Bob',
        avatar: '🚀',
        isHost: false,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const updatedRoom = manager.joinRoom(room.code, player);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.players.size).toBe(2);
      expect(updatedRoom?.players.get('player-2')?.name).toBe('Bob');
    });

    it('should return null for non-existent room', () => {
      const player: Player = {
        id: 'player-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const result = manager.joinRoom('INVALID', player);

      expect(result).toBeNull();
    });
  });

  describe('leaveRoom', () => {
    it('should remove player from room', () => {
      const host: Player = {
        id: 'player-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = manager.createRoom(host, 4);

      const player: Player = {
        id: 'player-2',
        name: 'Bob',
        avatar: '🚀',
        isHost: false,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      manager.joinRoom(room.code, player);

      const updatedRoom = manager.leaveRoom(room.code, 'player-2');

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.players.size).toBe(1);
      expect(updatedRoom?.players.has('player-2')).toBe(false);
    });

    it('should delete room if host leaves and no players remain', () => {
      const host: Player = {
        id: 'player-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = manager.createRoom(host, 4);

      const updatedRoom = manager.leaveRoom(room.code, 'player-1');

      expect(updatedRoom).toBeNull();
      expect(manager.getRoom(room.code)).toBeNull();
    });
  });

  describe('startGame', () => {
    it('should update room status to playing and set timestamps', () => {
      const host: Player = {
        id: 'player-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = manager.createRoom(host, 4);

      // Add another player
      const player2: Player = {
        id: 'player-2',
        name: 'Bob',
        avatar: '🚀',
        isHost: false,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      manager.joinRoom(room.code, player2);

      const duration = 120;
      const mockBoard = [
        ['H', 'O', 'L', 'A'],
        ['M', 'U', 'N', 'D'],
        ['C', 'A', 'S', 'A'],
        ['J', 'U', 'G', 'O'],
      ];

      const updatedRoom = manager.startGame(room.code, duration, mockBoard);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.status).toBe('playing');
      expect(updatedRoom?.startTime).toBeDefined();
      expect(updatedRoom?.duration).toBe(duration);
      expect(updatedRoom?.board).toEqual(mockBoard);
    });

    it('should return null if room does not exist', () => {
      const mockBoard: string[][] = [['H', 'O', 'L', 'A']];
      const result = manager.startGame('INVALID', 120, mockBoard);

      expect(result).toBeNull();
    });
  });

  describe('endGame', () => {
    it('should update room status to finished and set endTime', () => {
      const host: Player = {
        id: 'player-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = manager.createRoom(host, 4);

      // Add second player to meet minimum requirement
      const player2: Player = {
        id: 'player-2',
        name: 'Bob',
        avatar: '🚀',
        isHost: false,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      manager.joinRoom(room.code, player2);

      const mockBoard = [['H', 'O', 'L', 'A']];
      manager.startGame(room.code, 120, mockBoard);
      const updatedRoom = manager.endGame(room.code);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.status).toBe('finished');
      expect(updatedRoom?.endTime).toBeDefined();
    });
  });

  describe('playerCount', () => {
    it('should return correct player count', () => {
      const host: Player = {
        id: 'player-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = manager.createRoom(host, 4);

      expect(manager.playerCount(room.code)).toBe(1);

      const player2: Player = {
        id: 'player-2',
        name: 'Bob',
        avatar: '🚀',
        isHost: false,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      manager.joinRoom(room.code, player2);

      expect(manager.playerCount(room.code)).toBe(2);
    });

    it('should return 0 for non-existent room', () => {
      expect(manager.playerCount('INVALID')).toBe(0);
    });
  });
});

describe('RoomsManager - Stress Tests', () => {
  it('should generate unique codes even with many rooms', () => {
    const manager = new RoomsManager();
    const player = createMockPlayer('player-1', 'Alice');
    const codes = new Set<string>();

    // Create 1000 rooms
    for (let i = 0; i < 1000; i++) {
      const room = manager.createRoom(player, 4);
      codes.add(room.code);
    }

    // All codes should be unique
    expect(codes.size).toBe(1000);
  });

  it('should handle concurrent room creation', async () => {
    const manager = new RoomsManager();
    const codes = new Set<string>();

    // Create rooms concurrently
    const promises = Array.from({ length: 100 }, async (_, i) => {
      const player = createMockPlayer(`player-${i}`, `Player${i}`);
      const room = manager.createRoom(player, 4);
      return room.code;
    });

    const results = await Promise.all(promises);
    results.forEach(code => codes.add(code));

    // All codes should be unique
    expect(codes.size).toBe(100);
  });
});
