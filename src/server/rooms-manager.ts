/**
 * Room state management
 * Handles room creation, joining, leaving, and game state transitions
 */

import { customAlphabet } from 'nanoid';
import type {
  Player,
  Room,
  RoomStateDTO,
} from './types';
import type { GridSize } from '@/server/db/schema';
import { RoomError } from './types';
import { gamesRepository } from './db/repositories';

const ROOM_CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateRoomCode = customAlphabet(ROOM_CODE_ALPHABET, 6);

export class RoomsManager {
  private rooms: Map<string, Room> = new Map();

  /**
   * Create a new room with a unique code
   */
  async createRoom(host: Player, gridSize: GridSize): Promise<Room> {
    // Generate unique room code
    let code: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      code = generateRoomCode();
      attempts++;

      const existsInMemory = this.rooms.has(code);

      // Check database with error handling
      let existsInDb = false;
      try {
        existsInDb = await gamesRepository.roomCodeExists(code);
      } catch (error) {
        // Log but continue - if DB is down, we still check in-memory
        // This allows the game to function during DB outages
        console.warn('Database unavailable for room code check, using in-memory only:', error);
      }

      if (!existsInMemory && !existsInDb) {
        break;
      }
    } while (attempts < maxAttempts);

    // Final verification with graceful DB handling
    const existsInMemory = this.rooms.has(code);
    let existsInDb = false;

    try {
      existsInDb = await gamesRepository.roomCodeExists(code);
    } catch (error) {
      console.warn('Database unavailable for final verification:', error);
    }

    if (existsInMemory || existsInDb) {
      throw new RoomError('Failed to generate unique room code', 'INVALID_CODE');
    }

    // Create room
    const room: Room = {
      id: crypto.randomUUID(),
      code,
      host,
      players: new Map([[host.id, host]]),
      gridSize,
      status: 'waiting',
      duration: this.getDefaultDuration(gridSize),
      createdAt: new Date(),
    };

    this.rooms.set(code, room);

    return room;
  }

  /**
   * Get room by code
   */
  getRoom(code: string): Room | null {
    return this.rooms.get(code) || null;
  }

  /**
   * Get room by internal ID
   */
  getRoomById(id: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.id === id) {
        return room;
      }
    }
    return null;
  }

  /**
   * Check if room exists
   */
  roomExists(code: string): boolean {
    return this.rooms.has(code);
  }

  /**
   * Join a room
   */
  joinRoom(code: string, player: Player): Room | null {
    const room = this.rooms.get(code);

    if (!room) {
      return null;
    }

    // Check if room is full (max 8 players)
    if (room.players.size >= 8) {
      throw new RoomError('Room is full', 'ROOM_FULL');
    }

    // Check if game already started
    if (room.status !== 'waiting') {
      throw new RoomError('Game already started', 'GAME_ALREADY_STARTED');
    }

    // Check for duplicate player name
    const nameExists = Array.from(room.players.values()).some(
      (p) => p.name.toLowerCase() === player.name.toLowerCase()
    );

    if (nameExists) {
      throw new RoomError('Player name already taken', 'INVALID_CODE');
    }

    // Add player to room
    room.players.set(player.id, player);

    return room;
  }

  /**
   * Leave a room
   */
  leaveRoom(code: string, playerId: string): Room | null {
    const room = this.rooms.get(code);

    if (!room) {
      return null;
    }

    // Remove player
    room.players.delete(playerId);

    // If no players left, delete room
    if (room.players.size === 0) {
      this.rooms.delete(code);
      return null;
    }

    // If host left and there are other players, assign new host
    if (room.host.id === playerId && room.players.size > 0) {
      const newHost = Array.from(room.players.values())[0];
      room.host = { ...newHost, isHost: true };
      room.players.set(newHost.id, room.host);
    }

    return room;
  }

  /**
   * Start game in room
   */
  startGame(code: string, duration: number, board: string[][]): Room | null {
    const room = this.rooms.get(code);

    if (!room) {
      return null;
    }

    // Check minimum players
    if (room.players.size < 2) {
      throw new RoomError('Need at least 2 players to start', 'INVALID_CODE');
    }

    // Update room state
    room.status = 'playing';
    room.startTime = Date.now();
    room.duration = duration;
    room.board = board;

    return room;
  }

  /**
   * End game in room
   */
  endGame(code: string): Room | null {
    const room = this.rooms.get(code);

    if (!room) {
      return null;
    }

    room.status = 'finished';
    room.endTime = Date.now();

    return room;
  }

  /**
   * Reset room for a rematch
   * Clears game data but keeps all players
   */
  rematchRoom(code: string, requesterPlayerId: string): Room | null {
    const room = this.rooms.get(code);

    if (!room) {
      throw new RoomError('Room not found', 'ROOM_NOT_FOUND');
    }

    // Only host can request rematch
    if (room.host.id !== requesterPlayerId) {
      throw new RoomError('Only host can request rematch', 'NOT_HOST');
    }

    // Room must be in finished state
    if (room.status !== 'finished') {
      throw new RoomError('Can only rematch from finished state', 'REMATCH_NOT_ALLOWED');
    }

    // Reset room state for new game
    room.status = 'waiting';
    room.board = undefined;
    room.startTime = undefined;
    room.endTime = undefined;

    // Clear player scores and found words for new game
    for (const player of room.players.values()) {
      player.score = 0;
      player.foundWords = [];
    }

    return room;
  }

  /**
   * Get player count in room
   */
  playerCount(code: string): number {
    const room = this.rooms.get(code);
    return room ? room.players.size : 0;
  }

  /**
   * Convert Room to RoomStateDTO (for API responses)
   */
  roomToDTO(room: Room): RoomStateDTO {
    return {
      id: room.id,
      code: room.code,
      host: room.host,
      players: Array.from(room.players.values()),
      gridSize: room.gridSize,
      status: room.status,
      board: room.board,
      startTime: room.startTime,
      duration: room.duration,
      endTime: room.endTime,
      createdAt: room.createdAt,
    };
  }

  /**
   * Get default duration based on grid size
   */
  getDefaultDuration(gridSize: GridSize): number {
    switch (gridSize) {
      case 4:
        return 90; // 1 min 30 seg
      case 5:
        return 120; // 2 minutes
      case 6:
        return 180; // 3 minutes
      default:
        return 120;
    }
  }

  /**
   * Get all rooms (for debugging)
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Delete a room (for testing)
   */
  deleteRoom(code: string): boolean {
    return this.rooms.delete(code);
  }

  /**
   * Get room count
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Get number of active rooms
   */
  getActiveRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Clear all rooms (TEST ONLY)
   */
  clearAllRoomsForTesting(): void {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('clearAllRoomsForTesting should only be called in test environment');
    }

    this.rooms.clear();
  }
}

// Declare global type for the singleton
declare global {
  var _roomsManager: RoomsManager | undefined;
}

// Export singleton instance that persists across module reloads in development
export const roomsManager = globalThis._roomsManager ?? new RoomsManager();

// Store in globalThis to persist across hot module reload
if (process.env.NODE_ENV !== 'production') {
  globalThis._roomsManager = roomsManager;
}
