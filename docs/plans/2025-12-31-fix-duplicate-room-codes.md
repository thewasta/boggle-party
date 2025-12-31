# Fix Duplicate Room Codes Bug

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix duplicate room codes bug where newly created rooms can reuse codes from previously finished games stored in the database, causing UNIQUE constraint violations when saving results.

**Architecture:** The room code generator (`rooms-manager.ts`) currently only checks for duplicates in the in-memory room map. When rooms are deleted from memory (all players leave), their codes become available for reuse. However, the database has a UNIQUE constraint on `room_code` in the `games` table. This creates a race condition where a new room can get a code that already exists in the database, causing insertion failures.

**Tech Stack:** Next.js 16, PostgreSQL 16, TypeScript 5, nanoid for code generation

---

## Root Cause Analysis

**Files involved:**
- `src/server/rooms-manager.ts:24-37` - Room creation with in-memory uniqueness check only
- `src/server/db/migrations/001_initial_schema.sql:11` - UNIQUE constraint on room_code
- `src/app/api/rooms/[code]/results/route.ts:52-60` - Database insertion that fails on duplicate

**The problem flow:**
1. Room "ABC123" is created and played
2. Game finishes, saves to database (room_code = "ABC123" in games table)
3. All players leave, room deleted from memory
4. New room created, generates "ABC123" again (not in memory, so passes check)
5. New game finishes, tries to insert "ABC123" → UNIQUE constraint violation

---

## Task 1: Add Database Uniqueness Check to Room Code Generation

**Files:**
- Modify: `src/server/rooms-manager.ts:24-37`
- Modify: `src/server/db/repositories/games.repository.ts`

**Step 1: Add method to check if room code exists in database**

Open: `src/server/db/repositories/games.repository.ts`

Add this method after the `findByRoomCode` method:

```typescript
/**
 * Check if a room code already exists in the database
 */
async roomCodeExists(roomCode: string): Promise<boolean> {
  const query = 'SELECT 1 FROM games WHERE room_code = $1 LIMIT 1';
  const result = await this.pool.query(query, [roomCode]);
  return result.rows.length > 0;
}
```

**Step 2: Update RoomsManager to check database during code generation**

Open: `src/server/rooms-manager.ts`

First, import the repository at the top of the file:

```typescript
import { gamesRepository } from './db/repositories';
```

Then replace the `createRoom` method (lines 24-54) with:

```typescript
/**
 * Create a new room with a unique code (checks both memory and database)
 */
async createRoom(host: Player, gridSize: GridSize): Promise<Room> {
  // Generate unique room code (checks both memory and database)
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = generateRoomCode();
    attempts++;

    // Check in-memory rooms
    const inMemory = this.rooms.has(code);

    // Check database for previously used codes
    const inDatabase = await gamesRepository.roomCodeExists(code);

    // Only continue if code is unique in both places
    if (!inMemory && !inDatabase) {
      break;
    }
  } while (attempts < maxAttempts);

  // Final verification
  const inMemory = this.rooms.has(code);
  const inDatabase = await gamesRepository.roomCodeExists(code);

  if (inMemory || inDatabase) {
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
```

**Step 3: Update the API route to handle async createRoom**

Open: `src/app/api/rooms/route.ts`

The POST handler needs to await createRoom. Replace line 24:

```typescript
// Before:
const room = roomsManager.createRoom(player, validatedData.gridSize || 4);

// After:
const room = await roomsManager.createRoom(player, validatedData.gridSize || 4);
```

**Step 4: Run TypeScript compiler to verify no type errors**

Run: `pnpm exec tsc --noEmit`

Expected: No errors (output exits with code 0)

**Step 5: Commit**

```bash
git add src/server/rooms-manager.ts src/server/db/repositories/games.repository.ts src/app/api/rooms/route.ts
git commit -m "fix(room): check database for existing room codes during generation"
```

---

## Task 2: Add Unit Tests for Room Code Uniqueness

**Files:**
- Create: `src/server/__tests__/rooms-manager.unit.test.ts`

**Step 1: Write failing test for database uniqueness check**

Create file: `src/server/__tests__/rooms-manager.unit.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomsManager } from '../rooms-manager';
import type { Player } from '../types';
import type { GridSize } from '@/server/db/schema';
import { gamesRepository } from '../db/repositories';

// Mock the games repository
vi.mock('../db/repositories', () => ({
  gamesRepository: {
    roomCodeExists: vi.fn(),
  },
}));

describe('RoomsManager - Room Code Uniqueness', () => {
  let roomsManager: RoomsManager;
  let mockPlayer: Player;

  beforeEach(() => {
    roomsManager = new RoomsManager();
    mockPlayer = {
      id: 'player-1',
      name: 'Test Player',
      avatar: '🎮',
      isHost: true,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    // Clear rooms before each test
    roomsManager.clearAllRoomsForTesting();
    vi.clearAllMocks();
  });

  it('should generate unique room code not in database', async () => {
    // Mock: code exists in database
    vi.mocked(gamesRepository.roomCodeExists).mockResolvedValue(true);

    await expect(roomsManager.createRoom(mockPlayer, 4))
      .rejects.toThrow('Failed to generate unique room code');
  });

  it('should succeed when code is unique in both memory and database', async () => {
    // Mock: code does not exist in database
    vi.mocked(gamesRepository.roomCodeExists).mockResolvedValue(false);

    const room = await roomsManager.createRoom(mockPlayer, 4);

    expect(room.code).toBeDefined();
    expect(room.code.length).toBe(6);
    expect(room.host.id).toBe(mockPlayer.id);
  });

  it('should retry when initial code exists in database', async () => {
    // First call returns true (exists), second returns false (available)
    vi.mocked(gamesRepository.roomCodeExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const room = await roomsManager.createRoom(mockPlayer, 4);

    expect(room.code).toBeDefined();
    expect(gamesRepository.roomCodeExists).toHaveBeenCalled();
  });

  it('should reject after max attempts if all codes exist', async () => {
    // Always return true (code exists)
    vi.mocked(gamesRepository.roomCodeExists).mockResolvedValue(true);

    await expect(roomsManager.createRoom(mockPlayer, 4))
      .rejects.toThrow('Failed to generate unique room code');
  });
});
```

**Step 2: Run tests to verify they fail (implementation not done yet)**

Run: `docker compose exec web pnpm test src/server/__tests__/rooms-manager.unit.test.ts`

Expected: Tests fail because createRoom is not yet async in the current implementation

**Step 3: Update RoomsManager to export the class for testing**

Open: `src/server/rooms-manager.ts`

The class is already exported, but verify the test can import it. The test file created above should be able to import `RoomsManager` directly.

**Step 4: Run tests after implementation from Task 1**

Run: `docker compose exec web pnpm test src/server/__tests__/rooms-manager.unit.test.ts`

Expected: All tests pass after Task 1 implementation

**Step 5: Commit**

```bash
git add src/server/__tests__/rooms-manager.unit.test.ts
git commit -m "test(room): add unit tests for room code uniqueness checking"
```

---

## Task 3: Add Integration Test for Full Flow

**Files:**
- Modify: `src/server/db/__tests__/repositories.integration.test.ts`

**Step 1: Add integration test for duplicate room code scenario**

Open: `src/server/db/__tests__/repositories.integration.test.ts`

Add this test case at the end of the describe block:

```typescript
it('should detect existing room codes', async () => {
  // Create a game with a specific room code
  await gamesRepository.create({
    room_code: 'UNIQUE1',
    grid_size: 4,
    duration: 120,
    status: 'finished',
  });

  // Check that the code exists
  const exists = await gamesRepository.roomCodeExists('UNIQUE1');
  expect(exists).toBe(true);

  // Check that a different code does not exist
  const notExists = await gamesRepository.roomCodeExists('NOTREAL');
  expect(notExists).toBe(false);
});
```

**Step 2: Run integration test**

Run: `docker compose exec web pnpm test src/server/db/__tests__/repositories.integration.test.ts`

Expected: New test passes

**Step 3: Commit**

```bash
git add src/server/db/__tests__/repositories.integration.test.ts
git commit -m "test(db): add integration test for room code existence check"
```

---

## Task 4: Add Error Handling for Database Unavailability

**Files:**
- Modify: `src/server/rooms-manager.ts`

**Step 1: Add graceful degradation when database is unavailable**

Open: `src/server/rooms-manager.ts`

Update the `createRoom` method to handle database connection errors gracefully. Replace the database check section with:

```typescript
async createRoom(host: Player, gridSize: GridSize): Promise<Room> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = generateRoomCode();
    attempts++;

    const inMemory = this.rooms.has(code);

    // Check database with error handling
    let inDatabase = false;
    try {
      inDatabase = await gamesRepository.roomCodeExists(code);
    } catch (error) {
      // Log but continue - if DB is down, we still check in-memory
      // This allows the game to function during DB outages
      console.warn('Database unavailable for room code check, using in-memory only:', error);
    }

    if (!inMemory && !inDatabase) {
      break;
    }
  } while (attempts < maxAttempts);

  // Final verification with graceful DB handling
  const inMemory = this.rooms.has(code);
  let inDatabase = false;

  try {
    inDatabase = await gamesRepository.roomCodeExists(code);
  } catch (error) {
    console.warn('Database unavailable for final verification:', error);
  }

  if (inMemory || inDatabase) {
    throw new RoomError('Failed to generate unique room code', 'INVALID_CODE');
  }

  // ... rest of room creation (same as before)
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
```

**Step 5: Run TypeScript compiler**

Run: `pnpm exec tsc --noEmit`

Expected: No errors

**Step 6: Commit**

```bash
git add src/server/rooms-manager.ts
git commit -m "fix(room): add graceful degradation for database unavailability"
```

---

## Task 5: Manual Testing

**Files:** None (manual verification)

**Step 1: Test the fix locally**

1. Start Docker services: `docker compose up -d`
2. Play a complete game and let it finish
3. Verify the game saves to database: `docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT room_code FROM games ORDER BY created_at DESC LIMIT 1;"`
4. Create a new room
5. Verify the new room has a different code than the finished game
6. Finish the new game and verify it saves successfully

**Step 2: Verify database constraint still works**

1. Try to manually insert a duplicate room_code: `docker compose exec db psql -U boggle_user -d boggle_party -c "INSERT INTO games (room_code, grid_size, duration, status) VALUES ('TEST12', 4, 120, 'finished');"` (run twice)
2. Verify second insert fails with UNIQUE constraint violation

**Step 3: Commit (if any changes)**

If manual testing reveals issues, fix and commit separately.

---

## Summary

After this plan is complete:

1. Room codes are checked against both in-memory rooms AND database records
2. The UNIQUE constraint violation is prevented at the source
3. Tests verify the fix works correctly
4. Graceful degradation allows games to function during database outages

**Estimated changes:**
- 2 files modified (rooms-manager.ts, games.repository.ts, rooms route)
- 1 new test file (rooms-manager.unit.test.ts)
- 2 integration tests added
