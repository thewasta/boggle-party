import { describe, it, expect, beforeEach } from 'vitest';
import { roomsManager } from '../rooms-manager';
import type { Player } from '../types';

describe('Room Flow Integration Tests', () => {
  beforeEach(() => {
    // Clear all rooms
    roomsManager.clearAllRoomsForTesting();
  });

  describe('Complete game lifecycle', () => {
    it('should create, join, leave, and delete room', () => {
      // 1. Create room with host
      const host: Player = {
        id: 'host-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = roomsManager.createRoom(host, 4);
      expect(room.code).toHaveLength(6);
      expect(room.players.size).toBe(1);

      // 2. Player 2 joins
      const player2: Player = {
        id: 'player-2',
        name: 'Bob',
        avatar: '🚀',
        isHost: false,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const updatedRoom = roomsManager.joinRoom(room.code, player2);
      expect(updatedRoom?.players.size).toBe(2);

      // 3. Player 2 leaves
      const roomAfterLeave = roomsManager.leaveRoom(room.code, 'player-2');
      expect(roomAfterLeave?.players.size).toBe(1);

      // 4. Host leaves (should delete room)
      const finalRoom = roomsManager.leaveRoom(room.code, 'host-1');
      expect(finalRoom).toBeNull();
      expect(roomsManager.getRoom(room.code)).toBeNull();
    });

    it('should transfer host when original host leaves', () => {
      // Create room with host
      const host: Player = {
        id: 'host-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = roomsManager.createRoom(host, 4);

      // Add more players
      const player2: Player = {
        id: 'player-2',
        name: 'Bob',
        avatar: '🚀',
        isHost: false,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const player3: Player = {
        id: 'player-3',
        name: 'Charlie',
        avatar: '⭐',
        isHost: false,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      roomsManager.joinRoom(room.code, player2);
      roomsManager.joinRoom(room.code, player3);

      // Host leaves
      const updatedRoom = roomsManager.leaveRoom(room.code, 'host-1');

      // Player 2 should become new host
      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.host.id).toBe('player-2');
      expect(updatedRoom?.players.size).toBe(2);
    });
  });

  describe('Game state transitions', () => {
    it('should transition through game states', () => {
      const host: Player = {
        id: 'host-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = roomsManager.createRoom(host, 4);

      // Add player 2
      const player2: Player = {
        id: 'player-2',
        name: 'Bob',
        avatar: '🚀',
        isHost: false,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      roomsManager.joinRoom(room.code, player2);

      // Start game
      const mockBoard = [['H', 'O', 'L', 'A']];
      const playingRoom = roomsManager.startGame(room.code, 120, mockBoard);

      expect(playingRoom?.status).toBe('playing');
      expect(playingRoom?.startTime).toBeDefined();
      expect(playingRoom?.board).toEqual(mockBoard);

      // End game
      const finishedRoom = roomsManager.endGame(room.code);

      expect(finishedRoom?.status).toBe('finished');
      expect(finishedRoom?.endTime).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should not allow starting game with < 2 players', () => {
      const host: Player = {
        id: 'host-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = roomsManager.createRoom(host, 4);

      const mockBoard = [['H', 'O', 'L', 'A']];

      expect(() => {
        roomsManager.startGame(room.code, 120, mockBoard);
      }).toThrow();
    });

    it('should not allow joining full room (8 players)', () => {
      const host: Player = {
        id: 'host-1',
        name: 'Alice',
        avatar: '🎮',
        isHost: true,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      const room = roomsManager.createRoom(host, 4);

      // Add 7 more players (total 8)
      for (let i = 2; i <= 8; i++) {
        const player: Player = {
          id: `player-${i}`,
          name: `Player${i}`,
          avatar: '🎮',
          isHost: false,
          score: 0,
          foundWords: [],
          createdAt: new Date(),
        };

        roomsManager.joinRoom(room.code, player);
      }

      // Try to add 9th player
      const player9: Player = {
        id: 'player-9',
        name: 'Player9',
        avatar: '🎮',
        isHost: false,
        score: 0,
        foundWords: [],
        createdAt: new Date(),
      };

      expect(() => {
        roomsManager.joinRoom(room.code, player9);
      }).toThrow();
    });
  });
});
