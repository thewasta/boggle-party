# Epic 3: Room Management System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement centralized room state management with real-time player tracking, room creation/joining/leaving, and Pusher-based event synchronization.

**Architecture:** In-memory room state stored in `Map<string, Room>` for performance, with Pusher Channels for real-time events, and optional PostgreSQL persistence for finished games via Epic 2 repositories.

**Tech Stack:** Next.js 16 API Routes, TypeScript 5, Zod validation, Pusher Channels, nanoid for code generation, Epic 2 repository pattern

---

## Progress Tracking

**Status:** ✅ **COMPLETED** (22/22 tasks)

**Started:** 2025-12-29

**Completed:** 2025-12-30

---

## Task Breakdown

### Task 1: Define TypeScript Types for Room System

**Files:**
- Create: `src/server/types.ts`

**Step 1: Create file with type definitions**

```typescript
/**
 * Shared TypeScript types for room and game management
 */

import type { GridSize } from '@/server/db/schema';

// ============================================================================
// Player Types
// ============================================================================

/**
 * Represents a player in a room
 */
export interface Player {
  id: string; // UUID
  name: string;
  avatar: string;
  isHost: boolean;
  score: number;
  foundWords: string[]; // Words submitted by this player
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

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error for room-related operations
 */
export class RoomError extends Error {
  constructor(
    message: string,
    public code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'INVALID_CODE' | 'NOT_HOST' | 'GAME_ALREADY_STARTED'
  ) {
    super(message);
    this.name = 'RoomError';
  }
}
```

**Step 2: Run TypeScript check**

```bash
docker compose exec web pnpm exec tsc --noEmit
```

Expected: No errors (new file has no dependencies yet)

**Step 3: Commit**

```bash
git add src/server/types.ts
git commit -m "feat: define TypeScript types for room management system"
```

---

### Task 2: Create Pusher Client Singleton

**Files:**
- Create: `src/server/pusher-client.ts`

**Step 1: Create Pusher client singleton**

```typescript
/**
 * Pusher server client singleton
 * Initializes Pusher with environment variables
 */

import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;

/**
 * Get or create Pusher client instance
 */
export function getPusherClient(): Pusher {
  if (!pusherInstance) {
    const requiredEnvVars = {
      PUSHER_APP_ID: process.env.PUSHER_APP_ID,
      PUSHER_KEY: process.env.PUSHER_KEY,
      PUSHER_SECRET: process.env.PUSHER_SECRET,
      PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
    };

    // Validate environment variables
    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    pusherInstance = new Pusher({
      appId: requiredEnvVars.PUSHER_APP_ID!,
      key: requiredEnvVars.PUSHER_KEY!,
      secret: requiredEnvVars.PUSHER_SECRET!,
      cluster: requiredEnvVars.PUSHER_CLUSTER!,
      useTLS: process.env.PUSHER_USE_TLS === 'true',
    });
  }

  return pusherInstance;
}

/**
 * Trigger an event on a Pusher channel
 */
export async function triggerEvent(
  channel: string,
  eventName: string,
  data: unknown
): Promise<void> {
  const pusher = getPusherClient();

  try {
    await pusher.trigger(channel, eventName, data);
  } catch (error) {
    console.error(`Failed to trigger Pusher event ${eventName} on ${channel}:`, error);
    throw new Error(`Pusher event failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

**Step 2: Run TypeScript check**

```bash
docker compose exec web pnpm exec tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/pusher-client.ts
git commit -m "feat: create Pusher client singleton with validation"
```

---

### Task 3: Create Room Manager (Core Logic)

**Files:**
- Create: `src/server/rooms-manager.ts`

**Step 1: Write failing test first**

Create test file: `src/server/__tests__/rooms-manager.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { RoomsManager } from '../rooms-manager';
import type { Player, Room } from '../types';

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
      const player1 = createMockPlayer('player-1', 'Alice');
      const player2 = createMockPlayer('player-2', 'Bob');

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
      const player = createMockPlayer('player-1', 'Alice');
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
      const host = createMockPlayer('player-1', 'Alice');
      const room = manager.createRoom(host, 4);

      const player = createMockPlayer('player-2', 'Bob');
      const updatedRoom = manager.joinRoom(room.code, player);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.players.size).toBe(2);
      expect(updatedRoom?.players.get('player-2')?.name).toBe('Bob');
    });

    it('should return null for non-existent room', () => {
      const player = createMockPlayer('player-1', 'Alice');

      const result = manager.joinRoom('INVALID', player);

      expect(result).toBeNull();
    });
  });

  describe('leaveRoom', () => {
    it('should remove player from room', () => {
      const host = createMockPlayer('player-1', 'Alice');
      const room = manager.createRoom(host, 4);

      const player = createMockPlayer('player-2', 'Bob');
      manager.joinRoom(room.code, player);

      const updatedRoom = manager.leaveRoom(room.code, 'player-2');

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.players.size).toBe(1);
      expect(updatedRoom?.players.has('player-2')).toBe(false);
    });

    it('should delete room if host leaves and no players remain', () => {
      const host = createMockPlayer('player-1', 'Alice');
      const room = manager.createRoom(host, 4);

      const updatedRoom = manager.leaveRoom(room.code, 'player-1');

      expect(updatedRoom).toBeNull();
      expect(manager.getRoom(room.code)).toBeNull();
    });
  });

  describe('startGame', () => {
    it('should update room status to playing and set timestamps', () => {
      const host = createMockPlayer('player-1', 'Alice');
      const room = manager.createRoom(host, 4);

      // Add another player
      const player2 = createMockPlayer('player-2', 'Bob');
      manager.joinRoom(room.code, player2);

      const duration = 120;
      const updatedRoom = manager.startGame(room.code, duration, mockBoard);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.status).toBe('playing');
      expect(updatedRoom?.startTime).toBeDefined();
      expect(updatedRoom?.duration).toBe(duration);
      expect(updatedRoom?.board).toEqual(mockBoard);
    });

    it('should return null if room does not exist', () => {
      const result = manager.startGame('INVALID', 120, mockBoard);

      expect(result).toBeNull();
    });
  });

  describe('endGame', () => {
    it('should update room status to finished and set endTime', () => {
      const host = createMockPlayer('player-1', 'Alice');
      const room = manager.createRoom(host, 4);

      manager.startGame(room.code, 120, mockBoard);
      const updatedRoom = manager.endGame(room.code);

      expect(updatedRoom).toBeDefined();
      expect(updatedRoom?.status).toBe('finished');
      expect(updatedRoom?.endTime).toBeDefined();
    });
  });

  describe('playerCount', () => {
    it('should return correct player count', () => {
      const host = createMockPlayer('player-1', 'Alice');
      const room = manager.createRoom(host, 4);

      expect(manager.playerCount(room.code)).toBe(1);

      const player2 = createMockPlayer('player-2', 'Bob');
      manager.joinRoom(room.code, player2);

      expect(manager.playerCount(room.code)).toBe(2);
    });

    it('should return 0 for non-existent room', () => {
      expect(manager.playerCount('INVALID')).toBe(0);
    });
  });
});

// Helper functions
function createMockPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    avatar: '🎮',
    isHost: false,
    score: 0,
    foundWords: [],
    createdAt: new Date(),
  };
}

const mockBoard: string[][] = [
  ['H', 'O', 'L', 'A'],
  ['M', 'U', 'N', 'D'],
  ['C', 'A', 'S', 'A'],
  ['J', 'U', 'G', 'O'],
];
```

**Step 2: Run test to verify it fails**

```bash
docker compose exec web pnpm test src/server/__tests__/rooms-manager.test.ts
```

Expected: FAIL with "RoomsManager not defined" or "Cannot find module"

**Step 3: Create RoomsManager implementation**

```typescript
/**
 * Room state management
 * Handles room creation, joining, leaving, and game state transitions
 */

import { customAlphabet } from 'nanoid';
import type {
  Player,
  Room,
  RoomStateDTO,
  RoomStatus,
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
```

**Step 4: Run tests to verify they pass**

```bash
docker compose exec web pnpm test src/server/__tests__/rooms-manager.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/server/rooms-manager.ts src/server/__tests__/rooms-manager.test.ts
git commit -m "feat: implement RoomsManager with test suite"
```

---

### Task 4: Create Zod Validation Schemas

**Files:**
- Create: `src/server/validation.ts`

**Step 1: Create validation schemas**

```typescript
/**
 * Zod validation schemas for API requests
 */

import { z } from 'zod';
import type { GridSize } from '@/server/db/schema';

// ============================================================================
// Room Management Schemas
// ============================================================================

/**
 * Schema for creating a room
 */
export const createRoomSchema = z.object({
  playerName: z.string()
    .min(1, 'Player name is required')
    .max(20, 'Player name must be 20 characters or less')
    .trim(),
  avatar: z.string().optional(),
  gridSize: z.enum(['4', '5', '6']).transform((val): GridSize => parseInt(val, 10) as GridSize).optional(),
});

/**
 * Schema for joining a room
 */
export const joinRoomSchema = z.object({
  roomCode: z.string()
    .length(6, 'Room code must be 6 characters')
    .regex(/^[A-Z0-9]+$/i, 'Room code must contain only letters and numbers')
    .toUpperCase(),
  playerName: z.string()
    .min(1, 'Player name is required')
    .max(20, 'Player name must be 20 characters or less')
    .trim(),
  avatar: z.string().optional(),
});

/**
 * Schema for leaving a room
 */
export const leaveRoomSchema = z.object({
  roomCode: z.string()
    .length(6, 'Room code must be 6 characters')
    .toUpperCase(),
  playerId: z.string().uuid('Invalid player ID'),
});

/**
 * Schema for starting a game
 */
export const startGameSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  gridSize: z.enum(['4', '5', '6']).transform((val): GridSize => parseInt(val, 10) as GridSize),
});

/**
 * Schema for getting room state
 */
export const getRoomSchema = z.object({
  code: z.string()
    .length(6, 'Room code must be 6 characters')
    .toUpperCase(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type LeaveRoomInput = z.infer<typeof leaveRoomSchema>;
export type StartGameInput = z.infer<typeof startGameSchema>;
export type GetRoomInput = z.infer<typeof getRoomSchema>;
```

**Step 2: Run TypeScript check**

```bash
docker compose exec web pnpm exec tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/validation.ts
git commit -m "feat: add Zod validation schemas for room management"
```

---

### Task 5: Create API Utility Functions

**Files:**
- Create: `src/server/api-utils.ts`

**Step 1: Create utility functions**

```typescript
/**
 * Utility functions for API responses
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { RoomError } from './types';

/**
 * Create error response
 */
export function apiError(
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Create success response
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  );
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const errors = error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    return apiError('Validation failed', 400, errors);
  }

  return apiError('Invalid request', 400);
}

/**
 * Handle RoomError
 */
export function handleRoomError(error: unknown): NextResponse {
  if (error && typeof error === 'object' && 'code' in error) {
    const roomError = error as RoomError;

    switch (roomError.code) {
      case 'ROOM_NOT_FOUND':
        return apiError('Room not found', 404);
      case 'ROOM_FULL':
        return apiError('Room is full (max 8 players)', 400);
      case 'INVALID_CODE':
        return apiError(roomError.message, 400);
      case 'NOT_HOST':
        return apiError('Only the host can perform this action', 403);
      case 'GAME_ALREADY_STARTED':
        return apiError('Game already started', 400);
      default:
        return apiError('An error occurred', 500);
    }
  }

  return apiError('An error occurred', 500);
}

/**
 * Get avatar emoji from name (simple hash-based selection)
 */
export function getDefaultAvatar(name: string): string {
  const avatars = ['🎮', '🚀', '🎯', '⭐', '🎪', '🎨', '🎭', '🎹', '🎸', '🎺'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatars[Math.abs(hash) % avatars.length];
}
```

**Step 2: Run TypeScript check**

```bash
docker compose exec web pnpm exec tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/api-utils.ts
git commit -m "feat: add API utility functions for error handling"
```

---

### Task 6: Create POST /api/rooms (Create Room) Endpoint

**Files:**
- Create: `src/app/api/rooms/route.ts`

**Step 1: Write integration test**

Create: `src/app/api/rooms/__tests__/route.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../route';

describe('POST /api/rooms', () => {
  beforeEach(() => {
    // Clear rooms manager before each test
    // (roomsManager is a singleton, need to implement clear method or mock)
  });

  it('should create a room with valid data', async () => {
    const request = new Request('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        playerName: 'Alice',
        avatar: '🎮',
        gridSize: '4',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room).toBeDefined();
    expect(data.room.code).toHaveLength(6);
    expect(data.room.host.name).toBe('Alice');
  });

  it('should validate playerName is required', async () => {
    const request = new Request('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        playerName: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should assign default avatar if not provided', async () => {
    const request = new Request('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        playerName: 'Bob',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.room.host.avatar).toBeDefined();
    expect(data.room.host.avatar).toMatch(/^[\u{1F300}-\u{1F9FF}]/u);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
docker compose exec web pnpm test src/app/api/rooms/__tests__/route.test.ts
```

Expected: FAIL with "Cannot find module" or "POST not defined"

**Step 3: Implement API route**

```typescript
/**
 * POST /api/rooms
 * Create a new room
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRoomSchema } from '@/server/validation';
import { roomsManager } from '@/server/rooms-manager';
import { handleValidationError, apiSuccess, apiError, getDefaultAvatar } from '@/server/api-utils';
import type { Player } from '@/server/types';
import { triggerEvent } from '@/server/pusher-client';
import type { PlayerJoinedEvent } from '@/server/types';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    // Create player object
    const player: Player = {
      id: crypto.randomUUID(),
      name: validatedData.playerName.trim(),
      avatar: validatedData.avatar || getDefaultAvatar(validatedData.playerName),
      isHost: true,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    // Create room
    const room = roomsManager.createRoom(player, validatedData.gridSize || 4);

    // Emit Pusher event
    await triggerEvent(`presence-game-${room.id}`, 'player-joined', {
      player: room.host,
      totalPlayers: room.players.size,
    } satisfies PlayerJoinedEvent);

    // Return response
    return apiSuccess({
      room: roomsManager.roomToDTO(room),
      playerId: player.id,
    });

  } catch (error) {
    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return handleValidationError(error);
    }

    // Handle other errors
    console.error('Error creating room:', error);
    return apiError('Failed to create room', 500);
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
docker compose exec web pnpm test src/app/api/rooms/__tests__/route.test.ts
```

Expected: Tests PASS

**Step 5: Commit**

```bash
git add src/app/api/rooms/route.ts src/app/api/rooms/__tests__/route.test.ts
git commit -m "feat: add POST /api/rooms endpoint for creating rooms"
```

---

### Task 7: Create GET /api/rooms/[code] Endpoint (Get Room State)

**Files:**
- Create: `src/app/api/rooms/[code]/route.ts`

**Step 1: Write test**

```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '../route';

describe('GET /api/rooms/[code]', () => {
  it('should return room state for valid code', async () => {
    // First create a room
    const createResponse = await fetch('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ playerName: 'Alice' }),
    });
    const createData = await createResponse.json();
    const roomCode = createData.room.code;

    // Then get room state
    const request = new Request(`http://localhost:3000/api/rooms/${roomCode}`);
    const response = await GET(request, { params: { code: roomCode } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room.code).toBe(roomCode);
  });

  it('should return 404 for non-existent room', async () => {
    const request = new Request('http://localhost:3000/api/rooms/INVALID');
    const response = await GET(request, { params: { code: 'INVALID' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
docker compose exec web pnpm test src/app/api/rooms/[code]/__tests__/route.test.ts
```

Expected: FAIL

**Step 3: Implement API route**

```typescript
/**
 * GET /api/rooms/[code]
 * Get room state by code
 */

import { NextRequest, NextResponse } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { apiSuccess, apiError } from '@/server/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Get room
    const room = roomsManager.getRoom(code.toUpperCase());

    if (!room) {
      return apiError('Room not found', 404);
    }

    // Return room state
    return apiSuccess({
      room: roomsManager.roomToDTO(room),
    });

  } catch (error) {
    console.error('Error getting room:', error);
    return apiError('Failed to get room', 500);
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
docker compose exec web pnpm test src/app/api/rooms/[code]/__tests__/route.test.ts
```

Expected: Tests PASS

**Step 5: Commit**

```bash
git add src/app/api/rooms/[code]/route.ts src/app/api/rooms/[code]/__tests__/route.test.ts
git commit -m "feat: add GET /api/rooms/[code] endpoint for getting room state"
```

---

### Task 8: Create POST /api/rooms/[code]/join Endpoint

**Files:**
- Create: `src/app/api/rooms/[code]/join/route.ts`

**Step 1: Write test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../route';

describe('POST /api/rooms/[code]/join', () => {
  let roomCode: string;

  beforeEach(async () => {
    // Create a room for testing
    const createResponse = await fetch('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ playerName: 'Alice' }),
    });
    const createData = await createResponse.json();
    roomCode = createData.room.code;
  });

  it('should join existing room', async () => {
    const request = new Request(`http://localhost:3000/api/rooms/${roomCode}/join`, {
      method: 'POST',
      body: JSON.stringify({
        roomCode,
        playerName: 'Bob',
        avatar: '🚀',
      }),
    });

    const response = await POST(request, { params: { code: roomCode } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room.players).toHaveLength(2);
  });

  it('should return 404 for non-existent room', async () => {
    const request = new Request('http://localhost:3000/api/rooms/INVALID/join', {
      method: 'POST',
      body: JSON.stringify({
        roomCode: 'INVALID',
        playerName: 'Bob',
      }),
    });

    const response = await POST(request, { params: { code: 'INVALID' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
docker compose exec web pnpm test src/app/api/rooms/[code]/join/__tests__/route.test.ts
```

Expected: FAIL

**Step 3: Implement API route**

```typescript
/**
 * POST /api/rooms/[code]/join
 * Join an existing room
 */

import { NextRequest, NextResponse } from 'next/server';
import { joinRoomSchema } from '@/server/validation';
import { roomsManager } from '@/server/rooms-manager';
import { handleValidationError, apiSuccess, apiError, getDefaultAvatar, handleRoomError } from '@/server/api-utils';
import type { Player } from '@/server/types';
import { triggerEvent } from '@/server/pusher-client';
import type { PlayerJoinedEvent } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = joinRoomSchema.parse({
      ...body,
      roomCode: code, // Ensure code from URL matches body
    });

    // Create player object
    const player: Player = {
      id: crypto.randomUUID(),
      name: validatedData.playerName.trim(),
      avatar: validatedData.avatar || getDefaultAvatar(validatedData.playerName),
      isHost: false,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    // Join room
    const room = roomsManager.joinRoom(validatedData.roomCode, player);

    if (!room) {
      return apiError('Room not found', 404);
    }

    // Emit Pusher event
    await triggerEvent(`presence-game-${room.id}`, 'player-joined', {
      player,
      totalPlayers: room.players.size,
    } satisfies PlayerJoinedEvent);

    // Return response
    return apiSuccess({
      room: roomsManager.roomToDTO(room),
      playerId: player.id,
    });

  } catch (error) {
    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return handleValidationError(error);
    }

    // Handle room errors
    return handleRoomError(error);
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
docker compose exec web pnpm test src/app/api/rooms/[code]/join/__tests__/route.test.ts
```

Expected: Tests PASS

**Step 5: Commit**

```bash
git add src/app/api/rooms/[code]/join/route.ts src/app/api/rooms/[code]/join/__tests__/route.test.ts
git commit -m "feat: add POST /api/rooms/[code]/join endpoint"
```

---

### Task 9: Create POST /api/rooms/[code]/leave Endpoint

**Files:**
- Create: `src/app/api/rooms/[code]/leave/route.ts`

**Step 1: Write test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../route';

describe('POST /api/rooms/[code]/leave', () => {
  let roomCode: string;
  let playerId: string;

  beforeEach(async () => {
    // Create and join a room
    const createResponse = await fetch('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ playerName: 'Alice' }),
    });
    const createData = await createResponse.json();
    roomCode = createData.room.code;

    const joinResponse = await fetch(`http://localhost:3000/api/rooms/${roomCode}/join`, {
      method: 'POST',
      body: JSON.stringify({ roomCode, playerName: 'Bob' }),
    });
    const joinData = await joinResponse.json();
    playerId = joinData.playerId;
  });

  it('should leave room successfully', async () => {
    const request = new Request(`http://localhost:3000/api/rooms/${roomCode}/leave`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });

    const response = await POST(request, { params: { code: roomCode } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should delete room if host leaves and no players remain', async () => {
    // Get host player ID
    const getResponse = await fetch(`http://localhost:3000/api/rooms/${roomCode}`);
    const getData = await getResponse.json();
    const hostId = getData.room.host.id;

    const request = new Request(`http://localhost:3000/api/rooms/${roomCode}/leave`, {
      method: 'POST',
      body: JSON.stringify({ playerId: hostId }),
    });

    const response = await POST(request, { params: { code: roomCode } });

    expect(response.status).toBe(200);

    // Verify room is deleted
    const verifyResponse = await fetch(`http://localhost:3000/api/rooms/${roomCode}`);
    expect(verifyResponse.status).toBe(404);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
docker compose exec web pnpm test src/app/api/rooms/[code]/leave/__tests__/route.test.ts
```

Expected: FAIL

**Step 3: Implement API route**

```typescript
/**
 * POST /api/rooms/[code]/leave
 * Leave a room
 */

import { NextRequest } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { apiSuccess, apiError } from '@/server/api-utils';
import { triggerEvent } from '@/server/pusher-client';
import type { PlayerLeftEvent } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return apiError('playerId is required', 400);
    }

    // Get room before leaving
    const room = roomsManager.getRoom(code.toUpperCase());

    if (!room) {
      return apiError('Room not found', 404);
    }

    // Get player name for event
    const player = room.players.get(playerId);
    if (!player) {
      return apiError('Player not found in room', 404);
    }

    // Leave room
    const updatedRoom = roomsManager.leaveRoom(code.toUpperCase(), playerId);

    // Emit player-left event if room still exists
    if (updatedRoom) {
      await triggerEvent(`presence-game-${room.id}`, 'player-left', {
        playerId: player.id,
        playerName: player.name,
        totalPlayers: updatedRoom.players.size,
      } satisfies PlayerLeftEvent);
    }

    // Return response
    return apiSuccess({
      message: 'Left room successfully',
      roomDeleted: updatedRoom === null,
    });

  } catch (error) {
    console.error('Error leaving room:', error);
    return apiError('Failed to leave room', 500);
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
docker compose exec web pnpm test src/app/api/rooms/[code]/leave/__tests__/route.test.ts
```

Expected: Tests PASS

**Step 5: Commit**

```bash
git add src/app/api/rooms/[code]/leave/route.ts src/app/api/rooms/[code]/leave/__tests__/route.test.ts
git commit -m "feat: add POST /api/rooms/[code]/leave endpoint"
```

---

### Task 10: Create Helper to Convert Player IDs to Session Tracking

**Files:**
- Create: `src/server/session-utils.ts`

**Step 1: Create session utilities**

```typescript
/**
 * Session management utilities
 * Maps player IDs to session IDs for Pusher presence channels
 */

import type { Player } from './types';

/**
 * Map player ID to Pusher presence socket ID
 */
export interface PlayerSession {
  playerId: string;
  socketId: string;
  roomCode: string;
}

// In-memory session storage (Map: playerId -> PlayerSession)
const sessions = new Map<string, PlayerSession>();

/**
 * Register a player session
 */
export function registerSession(playerId: string, socketId: string, roomCode: string): void {
  sessions.set(playerId, { playerId, socketId, roomCode });
}

/**
 * Unregister a player session
 */
export function unregisterSession(playerId: string): void {
  sessions.delete(playerId);
}

/**
 * Get session by player ID
 */
export function getSession(playerId: string): PlayerSession | undefined {
  return sessions.get(playerId);
}

/**
 * Get all sessions in a room
 */
export function getSessionsByRoom(roomCode: string): PlayerSession[] {
  return Array.from(sessions.values()).filter(s => s.roomCode === roomCode);
}

/**
 * Clean up sessions for a room
 */
export function clearRoomSessions(roomCode: string): void {
  const toDelete = Array.from(sessions.entries())
    .filter(([_, session]) => session.roomCode === roomCode)
    .map(([playerId]) => playerId);

  toDelete.forEach(playerId => sessions.delete(playerId));
}
```

**Step 2: Run TypeScript check**

```bash
docker compose exec web pnpm exec tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/session-utils.ts
git commit -m "feat: add session management utilities for Pusher"
```

---

### Task 11: Add Room Code Generation Uniqueness Test

**Files:**
- Modify: `src/server/__tests__/rooms-manager.test.ts`

**Step 1: Add uniqueness stress test**

Add to the existing test file:

```typescript
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
```

**Step 2: Run tests**

```bash
docker compose exec web pnpm test src/server/__tests__/rooms-manager.test.ts
```

Expected: All tests PASS including stress tests

**Step 3: Commit**

```bash
git add src/server/__tests__/rooms-manager.test.ts
git commit -m "test: add stress tests for room code generation"
```

---

### Task 12: Create Integration Test for Full Flow

**Files:**
- Create: `src/server/__tests__/room-flow.integration.test.ts`

**Step 1: Create integration test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { roomsManager } from '../rooms-manager';
import type { Player } from '../types';

describe('Room Flow Integration Tests', () => {
  beforeEach(() => {
    // Clear all rooms
    const allRooms = roomsManager.getAllRooms();
    allRooms.forEach(room => {
      // Simulate deletion by accessing private rooms Map
      // (In real implementation, add a clearRooms method for testing)
    });
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
```

**Step 2: Run integration tests**

```bash
docker compose exec web pnpm test src/server/__tests__/room-flow.integration.test.ts
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/server/__tests__/room-flow.integration.test.ts
git commit -m "test: add integration tests for complete room flow"
```

---

### Task 13: Add Clear Rooms Method for Testing

**Files:**
- Modify: `src/server/rooms-manager.ts`

**Step 1: Add test-only method**

```typescript
/**
 * Clear all rooms (TEST ONLY)
 * This should NEVER be called in production
 */
export function clearAllRoomsForTesting(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('clearAllRoomsForTesting should only be called in test environment');
  }

  this.rooms.clear();
}
```

Add this method to the RoomsManager class.

**Step 2: Update tests to use clear method**

Update all `beforeEach` blocks in test files to call:

```typescript
beforeEach(() => {
  roomsManager.clearAllRoomsForTesting();
});
```

**Step 3: Run tests**

```bash
docker compose exec web pnpm test
```

Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/server/rooms-manager.ts
git commit -m "test: add clearAllRoomsForTesting method"
```

---

### Task 14: Verify Pusher Events are Emitted

**Files:**
- Modify: All API routes to use real Pusher (already implemented)

**Step 1: Manual verification**

Since Pusher events are external, we'll verify them manually:

```bash
# Create a room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Alice","avatar":"🎮"}'

# Note the room code and room ID from response
# Then verify Pusher events are triggered
# (Would need Pusher dashboard or client connection to verify)
```

**Step 2: Add mock-based test for Pusher**

Create: `src/server/__tests__/pusher-events.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/rooms/route';

// Mock Pusher client
vi.mock('@/server/pusher-client', () => ({
  triggerEvent: vi.fn(),
}));

import { triggerEvent } from '@/server/pusher-client';

describe('Pusher Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should emit player-joined event when creating room', async () => {
    const request = new Request('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        playerName: 'Alice',
        avatar: '🎮',
      }),
    });

    await POST(request);

    expect(triggerEvent).toHaveBeenCalledWith(
      expect.stringContaining('presence-game-'),
      'player-joined',
      expect.objectContaining({
        player: expect.objectContaining({ name: 'Alice' }),
        totalPlayers: 1,
      })
    );
  });
});
```

**Step 3: Run test**

```bash
docker compose exec web pnpm test src/server/__tests__/pusher-events.test.ts
```

Expected: Test PASS

**Step 4: Commit**

```bash
git add src/server/__tests__/pusher-events.test.ts
git commit -m "test: add Pusher event emission tests"
```

---

### Task 15: Create Documentation for Room Management API

**Files:**
- Create: `docs/ROOM-MANAGEMENT.md`

**Step 1: Create API documentation**

```markdown
# Room Management API Documentation

## Overview

The Room Management API handles room creation, joining, leaving, and state management for the Boggle Party game. All rooms are stored in-memory on the server for performance, with real-time synchronization via Pusher Channels.

## Architecture

- **Room State**: Stored in `Map<string, Room>` in memory
- **Real-time Events**: Pusher presence channels (`presence-game-{roomId}`)
- **Validation**: Zod schemas for all API inputs
- **Error Handling**: Custom `RoomError` class with specific error codes

## API Endpoints

### POST /api/rooms

Create a new game room.

**Request Body:**
```json
{
  "playerName": "Alice",
  "avatar": "🎮",
  "gridSize": 4
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "room": {
    "id": "uuid",
    "code": "ABC123",
    "host": { ... },
    "players": [ ... ],
    "gridSize": 4,
    "status": "waiting",
    "duration": 120,
    "createdAt": "2025-12-29T..."
  },
  "playerId": "uuid"
}
```

**Pusher Event:** `player-joined`

---

### GET /api/rooms/[code]

Get room state by code.

**Response (200 OK):**
```json
{
  "success": true,
  "room": { ... }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Room not found"
}
```

---

### POST /api/rooms/[code]/join

Join an existing room.

**Request Body:**
```json
{
  "roomCode": "ABC123",
  "playerName": "Bob",
  "avatar": "🚀"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "room": { ... },
  "playerId": "uuid"
}
```

**Pusher Event:** `player-joined`

**Errors:**
- `404`: Room not found
- `400`: Room full (max 8 players)
- `400`: Game already started
- `400`: Player name already taken

---

### POST /api/rooms/[code]/leave

Leave a room.

**Request Body:**
```json
{
  "playerId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Left room successfully",
  "roomDeleted": false
}
```

**Pusher Event:** `player-left` (if room still exists)

---

## Pusher Events

### Channel: `presence-game-{roomId}`

All events for a room are emitted on its presence channel.

#### player-joined

Emitted when a player joins (on creation or join).

```typescript
{
  player: Player,
  totalPlayers: number
}
```

#### player-left

Emitted when a player leaves.

```typescript
{
  playerId: string,
  playerName: string,
  totalPlayers: number
}
```

## Room Codes

- **Length**: 6 characters
- **Characters**: Uppercase letters (A-Z) and numbers (0-9)
- **Generation**: Cryptographically random (nanoid)
- **Uniqueness**: Guaranteed within server runtime

## Room Limits

- **Max Players**: 8 per room
- **Min Players to Start**: 2
- **Game Durations**:
  - 4×4 grid: 120 seconds (2 minutes)
  - 5×5 grid: 180 seconds (3 minutes)
  - 6×6 grid: 240 seconds (4 minutes)

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ROOM_NOT_FOUND` | 404 | Room does not exist |
| `ROOM_FULL` | 400 | Room has 8 players |
| `INVALID_CODE` | 400 | Invalid room code or input |
| `NOT_HOST` | 403 | Action requires host privileges |
| `GAME_ALREADY_STARTED` | 400 | Cannot join/modify started game |

## Testing

Run tests:
```bash
pnpm test src/server/__tests__/rooms-manager.test.ts
pnpm test src/app/api/rooms/**/__tests__/*.test.ts
```

## Database Integration

Finished games are persisted to PostgreSQL via Epic 2 repositories:
- `gamesRepository.create()` - Save game record
- `playersRepository.create()` - Save player records
- `wordsRepository.create()` - Save found words

This is handled separately in Epic 8 (Results Phase).
```

**Step 2: Commit**

```bash
git add docs/ROOM-MANAGEMENT.md
git commit -m "docs: add room management API documentation"
```

---

### Task 16: Add TypeScript Path Alias for Tests

**Files:**
- Modify: `vitest.config.ts`

**Step 1: Update Vitest config**

Ensure path aliases are configured (should already be done):

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 2: Run tests to verify aliases work**

```bash
docker compose exec web pnpm test
```

Expected: All tests pass with path aliases working

**Step 3: Commit if needed**

If changes were made, commit them.

---

### Task 17: Verify Environment Variables are Documented

**Files:**
- Modify: `.env.example`

**Step 1: Update .env.example**

Ensure Pusher variables are documented:

```env
# Database
POSTGRES_DB=boggle_party
POSTGRES_USER=boggle_user
POSTGRES_PASSWORD=dev_password_change_me
DATABASE_URL=postgresql://boggle_user:dev_password_change_me@db:5432/boggle_party

# Pusher
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
PUSHER_USE_TLS=true

NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

**Step 2: Commit if needed**

---

### Task 18: Add Room Start Endpoint (Optional - for Epic 7)

**Files:**
- Create: `src/app/api/rooms/[code]/start/route.ts`

**Step 1: Create endpoint**

```typescript
/**
 * POST /api/rooms/[code]/start
 * Start game in room (host only)
 */

import { NextRequest } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { apiSuccess, apiError, handleRoomError } from '@/server/api-utils';
import { triggerEvent } from '@/server/pusher-client';
import type { GameStartedEvent } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return apiError('playerId is required', 400);
    }

    // Get room
    const room = roomsManager.getRoom(code.toUpperCase());

    if (!room) {
      return apiError('Room not found', 404);
    }

    // Verify player is host
    if (room.host.id !== playerId) {
      return apiError('Only the host can start the game', 403);
    }

    // Get board from request or generate one
    const board = body.board || generateDefaultBoard(room.gridSize);

    // Start game
    const updatedRoom = roomsManager.startGame(code.toUpperCase(), room.duration, board);

    if (!updatedRoom) {
      return apiError('Failed to start game', 500);
    }

    // Emit Pusher event
    await triggerEvent(`presence-game-${room.id}`, 'game-started', {
      startTime: updatedRoom.startTime!,
      duration: updatedRoom.duration,
      board: updatedRoom.board!,
    } satisfies GameStartedEvent);

    return apiSuccess({
      message: 'Game started',
      startTime: updatedRoom.startTime,
      duration: updatedRoom.duration,
      board: updatedRoom.board,
    });

  } catch (error) {
    return handleRoomError(error);
  }
}

// Temporary board generator (will be replaced in Epic 4)
function generateDefaultBoard(gridSize: number): string[][] {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
                   'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  const board: string[][] = [];
  for (let i = 0; i < gridSize; i++) {
    const row: string[] = [];
    for (let j = 0; j < gridSize; j++) {
      row.push(letters[Math.floor(Math.random() * letters.length)]);
    }
    board.push(row);
  }

  return board;
}
```

**Step 2: Run TypeScript check**

```bash
docker compose exec web pnpm exec tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/rooms/[code]/start/route.ts
git commit -m "feat: add POST /api/rooms/[code]/start endpoint (host only)"
```

---

### Task 19: Add Room End Endpoint (Optional - for Epic 8)

**Files:**
- Create: `src/app/api/rooms/[code]/end/route.ts`

**Step 1: Create endpoint**

```typescript
/**
 * POST /api/rooms/[code]/end
 * End game in room (host only or automatic when timer ends)
 */

import { NextRequest } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { apiSuccess, apiError } from '@/server/api-utils';
import { triggerEvent } from '@/server/pusher-client';
import type { GameEndedEvent } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Get room
    const room = roomsManager.getRoom(code.toUpperCase());

    if (!room) {
      return apiError('Room not found', 404);
    }

    // End game
    const updatedRoom = roomsManager.endGame(code.toUpperCase());

    if (!updatedRoom) {
      return apiError('Failed to end game', 500);
    }

    // Emit Pusher event
    await triggerEvent(`presence-game-${room.id}`, 'game-ended', {
      endTime: updatedRoom.endTime!,
    } satisfies GameEndedEvent);

    // TODO: Save game to database (Epic 8)
    // await saveGameToDatabase(updatedRoom);

    return apiSuccess({
      message: 'Game ended',
      endTime: updatedRoom.endTime,
    });

  } catch (error) {
    console.error('Error ending game:', error);
    return apiError('Failed to end game', 500);
  }
}
```

**Step 2: Run TypeScript check**

```bash
docker compose exec web pnpm exec tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/rooms/[code]/end/route.ts
git commit -m "feat: add POST /api/rooms/[code]/end endpoint"
```

---

### Task 20: Add Health Check for Room Manager

**Files:**
- Modify: `src/app/api/health/route.ts`

**Step 1: Add room count to health check**

```typescript
import { NextResponse } from 'next/server';
import { testConnection, getPool } from '@/server/db/connection';
import { roomsManager } from '@/server/rooms-manager';

export async function GET() {
  const health = {
    status: 'ok' as 'ok' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown' as 'up' | 'down' | 'error',
      schema: 'unknown' as 'migrated' | 'not_migrated' | 'error',
      rooms: {
        active: roomsManager.getRoomCount(),
      },
    },
  };

  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      health.services.database = 'down';
      health.status = 'degraded';
      return NextResponse.json(health, { status: 503 });
    }

    health.services.database = 'up';

    // Check if schema is migrated
    const pool = getPool();
    const schemaCheck = await pool.query(
      `SELECT EXISTS(
         SELECT FROM information_schema.tables
         WHERE table_name = 'games'
       ) as exists`
    );

    if (schemaCheck.rows[0].exists) {
      health.services.schema = 'migrated';
    } else {
      health.services.schema = 'not_migrated';
      health.status = 'degraded';
    }

    return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 });
  } catch (error) {
    health.status = 'error';
    health.services.database = 'error';

    return NextResponse.json(
      {
        ...health,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

**Step 2: Test health endpoint**

```bash
curl http://localhost:3000/api/health
```

Expected: Response includes `services.rooms.active` count

**Step 3: Commit**

```bash
git add src/app/api/health/route.ts
git commit -m "feat: add active rooms count to health check"
```

---

### Task 21: Update Epic Status Document

**Files:**
- Modify: `docs/plans/2025-12-29-boggle-party-epics.md`

**Step 1: Update Epic 3 status**

Add implementation status section for Epic 3 (similar to Epic 1 and 2):

```markdown
### Implementation Status

**Completed:** TBD

**Summary:**
- ✅ Room management system implemented
- ✅ In-memory room state with Map structure
- ✅ All API endpoints functional (create, join, leave, get state)
- ✅ Pusher integration for real-time events
- ✅ Zod validation for all API inputs
- ✅ Comprehensive test suite (unit + integration)
- ✅ API documentation created

**Git Milestone:** TBD

**Key Files Created:**
- `src/server/types.ts` - TypeScript types for room system
- `src/server/rooms-manager.ts` - Core room management logic
- `src/server/pusher-client.ts` - Pusher client singleton
- `src/server/validation.ts` - Zod validation schemas
- `src/server/api-utils.ts` - API utility functions
- `src/server/session-utils.ts` - Session management
- `src/app/api/rooms/route.ts` - POST create room
- `src/app/api/rooms/[code]/route.ts` - GET room state
- `src/app/api/rooms/[code]/join/route.ts` - POST join room
- `src/app/api/rooms/[code]/leave/route.ts` - POST leave room
- `src/app/api/rooms/[code]/start/route.ts` - POST start game
- `src/app/api/rooms/[code]/end/route.ts` - POST end game
- Test files for all components

**Notes:**
- Room codes are 6-character alphanumeric (nanoid)
- Max 8 players per room
- Min 2 players to start game
- Host can transfer when original host leaves
- Room deleted when all players leave
```

**Step 2: Commit**

```bash
git add docs/plans/2025-12-29-boggle-party-epics.md
git commit -m "docs: update Epic 3 implementation status"
```

---

### Task 22: Final Verification and Success Criteria

**Files:**
- Verification only (no file creation)

**Step 1: Run all tests**

```bash
docker compose exec web pnpm test
```

Expected: All tests PASS

**Step 2: Run TypeScript check**

```bash
docker compose exec web pnpm exec tsc --noEmit
```

Expected: No errors

**Step 3: Manual API testing**

```bash
# Create room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Alice","avatar":"🎮"}'

# Note room code from response, e.g., "ABC123"

# Get room state
curl http://localhost:3000/api/rooms/ABC123

# Join room
curl -X POST http://localhost:3000/api/rooms/ABC123/join \
  -H "Content-Type: application/json" \
  -d '{"roomCode":"ABC123","playerName":"Bob","avatar":"🚀"}'

# Leave room
curl -X POST http://localhost:3000/api/rooms/ABC123/leave \
  -H "Content-Type: application/json" \
  -d '{"playerId":"<player-id-from-join-response>"}'
```

Expected: All API calls return success responses

**Step 4: Verify Pusher events**

Check Pusher dashboard or use client connection to verify events are emitted:
- `player-joined` on room creation
- `player-joined` on room join
- `player-left` on room leave

**Step 5: Check health endpoint**

```bash
curl http://localhost:3000/api/health
```

Expected: Response includes `rooms.active` count

**Step 6: Verify documentation**

```bash
cat docs/ROOM-MANAGEMENT.md
```

Expected: Comprehensive API documentation exists

**Step 7: Commit final updates**

```bash
git add .
git commit -m "feat: complete Epic 3 - Room Management System"
```

**Step 8: Create milestone commit**

```bash
git tag -a epic-3-complete -m "Epic 3: Room Management System Complete"
```

---

## Success Criteria Verification

At the end of Epic 3, verify:

- ✅ Can create room and receive 6-character code
- ✅ Can join room with valid code
- ✅ Player list updates in real-time via Pusher
- ✅ Cannot join non-existent room
- ✅ Cannot start game with < 2 players
- ✅ Room state persists during server runtime
- ✅ Max 8 players per room enforced
- ✅ Host transfers when original host leaves
- ✅ Room deleted when all players leave
- ✅ All API endpoints return proper error responses
- ✅ Zod validation prevents invalid inputs
- ✅ Pusher events emitted correctly
- ✅ Health check includes room count
- ✅ All tests passing (unit + integration)
- ✅ TypeScript compilation without errors
- ✅ API documentation complete

---

## Next Epic Trigger

**Epic 3 is complete when:**
- All API endpoints functional and tested
- Pusher events verified to emit correctly
- Documentation complete
- All success criteria verified

**Ready for Epic 4:** Spanish Dictionary & Word Validation

---

## Notes

- **Testing:** Vitest is used for all tests
- **Code Organization:** Follow YAGNI principle - only implement what's needed now
- **Commits:** Commit frequently, each task should result in at least one commit
- **Docker:** All development happens in Docker containers
- **TypeScript:** Strict mode enabled, all code must type-check
- **Zod:** All API inputs validated with Zod schemas
- **Pusher:** Real-time events use presence channels
- **Database Integration:** Happens in Epic 8 (Results Phase)
- **Board Generation:** Temporary implementation here, proper one in Epic 4

---

**End of Epic 3 Implementation Plan**
