/**
 * Room state management
 * Handles room creation, joining, leaving, and game state transitions
 */

import { customAlphabet } from 'nanoid';
import type {
  Player,
  Room,
  RoomStateDTO,
  GridSize,
} from './types';
import { RoomError } from './types';

const ROOM_CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateRoomCode = customAlphabet(ROOM_CODE_ALPHABET, 6);

export class RoomsManager {
  private rooms: Map<string, Room> = new Map();

  /**
   * Create a new room with a unique code
   */
  createRoom(host: Player, gridSize: GridSize): Room {
    // Generate unique room code
    let code: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      code = generateRoomCode();
      attempts++;
    } while (this.rooms.has(code) && attempts < maxAttempts);

    if (this.rooms.has(code)) {
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
  private getDefaultDuration(gridSize: GridSize): number {
    switch (gridSize) {
      case 4:
        return 120; // 2 minutes
      case 5:
        return 180; // 3 minutes
      case 6:
        return 240; // 4 minutes
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
   * Get room count
   */
  getRoomCount(): number {
    return this.rooms.size;
  }
}

// Export singleton instance
export const roomsManager = new RoomsManager();
