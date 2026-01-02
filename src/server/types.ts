/**
 * Shared TypeScript types for room and game management
 */

import type { GridSize } from '@/server/db/schema';

// =========================================================================
// Route Handler Types
// =========================================================================

export type RouteParams<T> = { params: Promise<T> };

// ============================================================================
// Player Types
// ============================================================================

/**
 * A word found by a player with its metadata
 */
export interface FoundWord {
  word: string;
  score: number;
  timestamp: number;
}

/**
 * Represents a player in a room
 */
export interface Player {
  id: string; // UUID
  name: string;
  avatar: string;
  isHost: boolean;
  score: number;
  foundWords: FoundWord[]; // Words submitted by this player with metadata
  createdAt: Date;
}

// ============================================================================
// Room Types
// ============================================================================

/**
 * Room status enum
 */
export type RoomStatus = 'waiting' | 'playing' | 'finished';

/**
 * Represents a game room
 */
export interface Room {
  id: string; // Internal UUID
  code: string; // 6-character room code (public identifier)
  host: Player; // Host player reference
  players: Map<string, Player>; // All players in room (keyed by player ID)
  gridSize: GridSize;
  status: RoomStatus;
  board?: string[][]; // Shared board (set when game starts)
  startTime?: number; // Timestamp when game started
  duration: number; // Game duration in seconds
  endTime?: number; // Timestamp when game ended
  createdAt: Date;
}

/**
 * Minimal room state for API responses (without Map)
 */
export interface RoomStateDTO {
  id: string;
  code: string;
  host: Player;
  players: Player[];
  gridSize: GridSize;
  status: RoomStatus;
  board?: string[][];
  startTime?: number;
  duration: number;
  endTime?: number;
  createdAt: Date;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request payload for creating a room
 */
export interface CreateRoomRequest {
  playerName: string;
  avatar?: string;
  gridSize?: GridSize;
}

/**
 * Response after creating a room
 */
export interface CreateRoomResponse {
  success: true;
  room: RoomStateDTO;
  playerId: string;
}

/**
 * Request payload for joining a room
 */
export interface JoinRoomRequest {
  roomCode: string;
  playerName: string;
  avatar?: string;
}

/**
 * Response after joining a room
 */
export interface JoinRoomResponse {
  success: true;
  room: RoomStateDTO;
  playerId: string;
}

/**
 * Response after leaving a room
 */
export interface LeaveRoomResponse {
  success: true;
  message: string;
}

/**
 * Request payload for starting a game
 */
export interface StartGameRequest {
  roomId: string;
  gridSize: GridSize;
}

/**
 * Response after starting a game
 */
export interface StartGameResponse {
  success: true;
  message: string;
  startTime: number;
  duration: number;
  board: string[][];
}

// ============================================================================
// Pusher Event Types
// ============================================================================

/**
 * Player joined event payload
 */
export interface PlayerJoinedEvent {
  player: Player;
  totalPlayers: number;
}

/**
 * Player left event payload
 */
export interface PlayerLeftEvent {
  playerId: string;
  playerName: string;
  totalPlayers: number;
}

/**
 * Game started event payload
 */
export interface GameStartedEvent {
  startTime: number;
  duration: number;
  board: string[][];
}

/**
 * Game ended event payload
 */
export interface GameEndedEvent {
  endTime: number;
}

/**
 * Word reveal event payload (results phase)
 */
export interface RevealWordEvent {
  word: string;
  player: {
    id: string;
    name: string;
    avatar: string;
  };
  score: number;
  isUnique: boolean;
}

/**
 * Results complete event payload
 */
export interface ResultsCompleteEvent {
  finalRankings: Array<{
    id: string;
    name: string;
    avatar: string;
    score: number;
  }>;
}

/**
 * Rematch requested event payload
 */
export interface RematchRequestedEvent {
  requestedBy: {
    id: string;
    name: string;
  };
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error for room-related operations
 */
export class RoomError extends Error {
  constructor(
    message: string,
    public code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'INVALID_CODE' | 'NOT_HOST' | 'GAME_ALREADY_STARTED' | 'REMATCH_NOT_ALLOWED'
  ) {
    super(message);
    this.name = 'RoomError';
  }
}

// ============================================================================
// Word Submission Types
// ============================================================================

/**
 * Represents a cell position on the board
 */
export interface Cell {
  row: number;
  col: number;
}

/**
 * Word submission from a player
 */
export interface WordSubmission {
  playerId: string;
  word: string;
  path: Cell[];
}

/**
 * Word validation result
 */
export interface WordValidationResult {
  valid: boolean;
  score: number;
  reason: string;
  word: string;
}

/**
 * Word found event (for Pusher)
 */
export interface WordFoundEvent {
  playerId: string;
  playerName: string;
  word: string;
  score: number;
  isUnique: boolean;
}
