# Game State Recovery on Page Reload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the bug where refreshing the game page (F5) resets the timer to initial duration and loses all found words for that player.

**Architecture:** The server already persists found words in the in-memory `Room.players[].foundWords` array. The fix involves: (1) fetching and restoring the player's found words from the server on page load, and (2) ensuring the timer correctly calculates remaining time from the server's `startTime` rather than showing the full duration initially.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Pusher Channels, in-memory room state

---

## Problem Analysis

### Current Behavior

1. **Timer Reset Bug**: On page reload, the timer shows the full duration (e.g., 1:30) before the first 100ms tick, then jumps to the correct remaining time. This is because `timerState.remaining` is initialized to `gameState.duration` in `useGameSync.ts:50-54`.

2. **Lost Words Bug**: Found words are stored only in client-side React state (`useState<FoundWord[]>([])` in `page.tsx:47`). The server-side `player.foundWords` array stores words, but the frontend doesn't restore them on reload.

### Existing Server-Side Data

The server already has the data we need:
- `Room.startTime` - when the game started (used for timer calculation)
- `Player.foundWords[]` - array of words found by each player (persisted in memory)
- `RoomStateDTO.players[]` - includes all players with their `foundWords`

### Root Cause

In `src/app/game/[roomId]/page.tsx:194-216`, the `fetchGameState` function only extracts:
- `board`, `startTime`, `duration`, `gridSize`, `playerId`

It ignores the `players` array which contains the `foundWords` data.

---

## Task 1: Add API endpoint to get player-specific game state

**Files:**
- Create: `src/app/api/rooms/[roomId]/player-state/route.ts`
- Modify: None

**Step 1: Create the API route file**

```typescript
// src/app/api/rooms/[roomId]/player-state/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { apiError } from '@/server/api-utils';
import type { RouteParams } from '@/server/types';

interface PlayerStateResponse {
  startTime: number;
  duration: number;
  board: string[][];
  gridSize: number;
  foundWords: string[];
  score: number;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ roomId: string }>
) {
  try {
    const { roomId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return apiError('playerId is required', 400);
    }

    // roomId is the internal UUID, not the room code
    const room = roomsManager.getRoomById(roomId);

    if (!room) {
      return apiError('Room not found', 404);
    }

    if (room.status !== 'playing') {
      return apiError('Game is not in progress', 400);
    }

    const player = room.players.get(playerId);

    if (!player) {
      return apiError('Player not found in room', 404);
    }

    const response: PlayerStateResponse = {
      startTime: room.startTime!,
      duration: room.duration,
      board: room.board!,
      gridSize: room.gridSize,
      foundWords: player.foundWords,
      score: player.score,
    };

    return NextResponse.json({ success: true, playerState: response });
  } catch (error) {
    console.error('Error getting player state:', error);
    return apiError('Failed to get player state', 500);
  }
}
```

**Step 2: Create test file**

```typescript
// src/app/api/rooms/[roomId]/player-state/__tests__/route.test.ts
import { POST, GET } from '@/app/api/rooms/[roomId]/player-state/route';
import { roomsManager } from '@/server/rooms-manager';
import type { Player } from '@/server/types';

describe('GET /api/rooms/[roomId]/player-state', () => {
  beforeEach(() => {
    roomsManager.clearAllRoomsForTesting();
  });

  it('should return player state with found words', async () => {
    const host: Player = {
      id: 'host-1',
      name: 'Alice',
      avatar: '🎮',
      isHost: true,
      score: 15,
      foundWords: ['HOLA', 'CASA', 'PERRO'],
      createdAt: new Date(),
    };

    const room = roomsManager.createRoom(host, 4);
    roomsManager.startGame(room.code, 90, [
      ['A', 'B', 'C', 'D'],
      ['E', 'F', 'G', 'H'],
      ['I', 'J', 'K', 'L'],
      ['M', 'N', 'O', 'P'],
    ]);

    const request = new Request(
      `http://localhost:3000/api/rooms/${room.id}/player-state?playerId=host-1`
    );

    const response = await GET(request, {
      params: Promise.resolve({ roomId: room.id }),
    });

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.playerState.foundWords).toEqual(['HOLA', 'CASA', 'PERRO']);
    expect(data.playerState.score).toBe(15);
    expect(data.playerState.startTime).toBeDefined();
    expect(data.playerState.duration).toBe(90);
  });

  it('should return 404 if room not found', async () => {
    const request = new Request(
      'http://localhost:3000/api/rooms/non-existent/player-state?playerId=some-id'
    );

    const response = await GET(request, {
      params: Promise.resolve({ roomId: 'non-existent' }),
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 if playerId is missing', async () => {
    const request = new Request(
      'http://localhost:3000/api/rooms/some-id/player-state'
    );

    const response = await GET(request, {
      params: Promise.resolve({ roomId: 'some-id' }),
    });

    expect(response.status).toBe(400);
  });

  it('should return 400 if game is not in progress', async () => {
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

    const request = new Request(
      `http://localhost:3000/api/rooms/${room.id}/player-state?playerId=host-1`
    );

    const response = await GET(request, {
      params: Promise.resolve({ roomId: room.id }),
    });

    expect(response.status).toBe(400);
  });
});
```

**Step 3: Run the tests**

Run: `docker compose exec web pnpm test src/app/api/rooms/[roomId]/player-state/__tests__/route.test.ts`

Expected: PASS

**Step 4: Commit**

```bash
git add src/app/api/rooms/[roomId]/player-state/
git commit -m "feat(api): add player-state endpoint for game recovery"
```

---

## Task 2: Update useGameSync to initialize timer with correct remaining time

**Files:**
- Modify: `src/hooks/useGameSync.ts:40-85`

**Step 1: Write the failing test**

```typescript
// src/hooks/__tests__/useGameSync.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameSync } from '@/hooks/useGameSync';

describe('useGameSync - timer initialization', () => {
  it('should initialize timer with correct remaining time, not full duration', async () => {
    const startTime = Date.now() - 60000; // Game started 60 seconds ago
    const duration = 90; // 90 second game

    const { result } = renderHook(() =>
      useGameSync({
        roomId: 'test-room',
        playerId: 'test-player',
      })
    );

    // Simulate game state arriving from API (60 seconds already elapsed)
    act(() => {
      result.current.setGameState({
        roomId: 'test-room',
        roomCode: 'ABC123',
        board: [['A', 'B'], ['C', 'D']],
        startTime,
        duration,
        gridSize: 4,
        playerId: 'test-player',
      });
    });

    // Initial timer state should reflect remaining time, not full duration
    await waitFor(() => {
      expect(result.current.timerState.remaining).toBeLessThanOrEqual(30);
      expect(result.current.timerState.remaining).toBeGreaterThan(25);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `docker compose exec web pnpm test src/hooks/__tests__/useGameSync.test.ts`

Expected: FAIL (currently initializes with full duration)

**Step 3: Fix the implementation**

Modify `src/hooks/useGameSync.ts` lines 40-55:

```typescript
  // Synchronize timer with server time
  useEffect(() => {
    if (!gameState?.startTime) return;

    // Calculate offset between client and server time
    const serverStartTime = gameState.startTime;
    const clientNow = Date.now();
    serverTimeOffsetRef.current = serverStartTime - clientNow;

    // Calculate initial remaining time based on elapsed time
    const serverNow = clientNow + serverTimeOffsetRef.current;
    const elapsed = (serverNow - gameState.startTime) / 1000;
    const initialRemaining = Math.max(0, gameState.duration - elapsed);

    setIsSynced(true);
    // Start the timer with actual remaining time, not full duration
    setTimerState({
      remaining: Math.ceil(initialRemaining),
      isPaused: false,
      isExpired: initialRemaining <= 0,
    });
  }, [gameState?.startTime, gameState?.duration]);
```

**Step 4: Run test to verify it passes**

Run: `docker compose exec web pnpm test src/hooks/__tests__/useGameSync.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useGameSync.ts src/hooks/__tests__/useGameSync.test.ts
git commit -m "fix(hook): initialize timer with correct remaining time"
```

---

## Task 3: Update game page to fetch and restore player state

**Files:**
- Modify: `src/app/game/[roomId]/page.tsx:194-216`

**Step 1: Update fetchGameState to call new endpoint and restore found words**

Modify `src/app/game/[roomId]/page.tsx` lines 194-216:

```typescript
  // Fetch game state on mount
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch(
          `/api/rooms/${props.roomId}/player-state?playerId=${props.playerId}`,
          { cache: 'no-store' }
        );
        const data = await response.json();

        setGameState({
          roomId: props.roomId,
          roomCode: props.roomCode,
          board: data.playerState.board,
          startTime: data.playerState.startTime,
          duration: data.playerState.duration,
          gridSize: data.playerState.gridSize,
          playerId: props.playerId,
        });

        // Restore found words from server
        const restoredWords = data.playerState.foundWords.map((word: string) => ({
          word,
          score: word.length, // Approximate score by length (or use stored score if available)
          timestamp: Date.now(), // We don't have exact timestamps, but order is preserved
        }));
        props.setFoundWords(restoredWords);
      } catch (err) {
        console.error('Failed to fetch game state:', err);
      }
    };

    fetchGameState();
  }, [props.roomId, props.playerId, props.roomCode, setGameState, props.setFoundWords]);
```

**Step 2: Manual test - verify timer doesn't reset on reload**

1. Start a game and wait ~30 seconds
2. Press F5 to reload
3. Timer should show ~60 seconds remaining (90 - 30), not reset to 90

**Step 3: Manual test - verify words persist on reload**

1. Start a game and find 2-3 words
2. Press F5 to reload
3. Previously found words should appear in the word list

**Step 4: Commit**

```bash
git add src/app/game/[roomId]/page.tsx
git commit -m "fix(game): restore player state on page reload"
```

---

## Task 4: Update foundWords structure to include score in API response

**Files:**
- Modify: `src/server/types.ts:20-28`
- Modify: `src/server/rooms-manager.ts` (player.foundWords structure)
- Modify: `src/app/api/games/[roomId]/words/route.ts:75-76`

**Note:** Currently `player.foundWords` is `string[]`. To properly restore scores, we need to track `{ word, score, timestamp }`.

**Step 1: Update Player interface to store found words with metadata**

Modify `src/server/types.ts` lines 20-28:

```typescript
export interface Player {
  id: string; // UUID
  name: string;
  avatar: string;
  isHost: boolean;
  score: number;
  foundWords: Array<{ word: string; score: number; timestamp: number }>; // Changed from string[]
  createdAt: Date;
}
```

**Step 2: Update word submission to store metadata**

Modify `src/app/api/games/[roomId]/words/route.ts` lines 75-76:

```typescript
    player.foundWords.push({
      word: word.toUpperCase(),
      score: result.score,
      timestamp: Date.now(),
    });
    player.score += result.score;
```

**Step 3: Update word validator to accept new structure**

Modify `src/server/word-validator.ts:92` and related:

```typescript
export interface ValidateWordInput {
  word: string;
  path: Cell[];
  foundWords: Array<{ word: string; score: number; timestamp: number }>; // Updated type
  gridSize: 4 | 5 | 6;
}
```

And update the duplicate check at line 122:

```typescript
  if (foundWords.some((w) => w.word.toLowerCase() === normalizedWordLower)) {
```

**Step 4: Update all test files that use `foundWords: []`**

Use find and replace to update test files:

Run: `pnpm exec biome format --write src/server/__tests__/`

Then manually update:
- `src/server/__tests__/rooms-manager.test.ts`
- `src/server/__tests__/word-validator.test.ts`
- `src/server/__tests__/*.integration.test.ts`
- `src/app/api/**/__tests__/*.test.ts`

Pattern change:
```typescript
// Before
foundWords: ['HOLA', 'CASA']

// After
foundWords: [
  { word: 'HOLA', score: 4, timestamp: 1000 },
  { word: 'CASA', score: 4, timestamp: 2000 },
]
```

**Step 5: Run all tests**

Run: `docker compose exec web pnpm test`

Expected: All tests PASS

**Step 6: Update player-state API response**

Modify `src/app/api/rooms/[roomId]/player-state/route.ts`:

```typescript
    const response: PlayerStateResponse = {
      startTime: room.startTime!,
      duration: room.duration,
      board: room.board!,
      gridSize: room.gridSize,
      foundWords: player.foundWords, // Now includes score and timestamp
      score: player.score,
    };
```

And update the interface:

```typescript
interface PlayerStateResponse {
  startTime: number;
  duration: number;
  board: string[][];
  gridSize: number;
  foundWords: Array<{ word: string; score: number; timestamp: number }>;
  score: number;
}
```

**Step 7: Update game page to use restored data directly**

Modify `src/app/game/[roomId]/page.tsx`:

```typescript
        // Restore found words from server (now includes score and timestamp)
        props.setFoundWords(data.playerState.foundWords);
```

**Step 8: Commit**

```bash
git add src/server/types.ts src/server/word-validator.ts src/app/api/games/[roomId]/words/route.ts src/app/api/rooms/[roomId]/player-state/route.ts src/app/game/[roomId]/page.tsx
git commit -m "refactor(server): store found words with score and timestamp"
```

---

## Task 5: Update results page to use new foundWords structure

**Files:**
- Modify: `src/app/api/rooms/[code]/results/route.ts:37-70`

**Step 1: Update results endpoint**

Modify `src/app/api/rooms/[code]/results/route.ts` line 37:

```typescript
    for (const { word, score } of player.foundWords) {
```

And line 70:

```typescript
        words_found: player.foundWords.length,
        total_score: player.score,
        words: player.foundWords.map(({ word, score }) => ({ word, score })),
```

**Step 2: Run tests**

Run: `docker compose exec web pnpm test src/app/api/rooms/[code]/results/__tests__/route.test.ts`

Expected: PASS

**Step 3: Commit**

```bash
git add src/app/api/rooms/[code]/results/route.ts
git commit -m "fix(results): update to new foundWords structure"
```

---

## Task 6: Full integration test

**Files:**
- Test: Manual testing in browser

**Step 1: End-to-end test scenario**

1. Create a room with 2 players
2. Start game (90 seconds)
3. Player 1 finds 3 words, wait 30 seconds
4. Player 1 refreshes page (F5)
5. Verify:
   - Timer shows ~60 seconds remaining
   - All 3 found words are displayed
   - Can continue finding new words
6. Wait for game to end
7. Verify results page shows correct word count and score

**Step 2: Test edge cases**

1. Refresh immediately after game starts
2. Refresh when only 5 seconds remaining
3. Refresh after finding 10+ words
4. Disconnect/reconnect network (simulating connection loss)

**Step 3: Document the fix**

Update `CLAUDE.md` to mention the state recovery feature.

**Step 4: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: document game state recovery feature"
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/app/api/rooms/[roomId]/player-state/route.ts` | NEW: Endpoint to get player-specific game state |
| `src/hooks/useGameSync.ts` | FIX: Initialize timer with calculated remaining time |
| `src/app/game/[roomId]/page.tsx` | FIX: Fetch and restore player state on mount |
| `src/server/types.ts` | REFACTOR: Player.foundWords now stores `{ word, score, timestamp }` |
| `src/server/word-validator.ts` | UPDATE: Accept new foundWords structure |
| `src/app/api/games/[roomId]/words/route.ts` | UPDATE: Store word metadata when submitted |
| `src/app/api/rooms/[code]/results/route.ts` | UPDATE: Handle new foundWords structure |

---

## Testing Strategy

1. **Unit tests**: API endpoint, useGameSync hook
2. **Integration tests**: Full game flow with page reload
3. **Manual testing**: Browser refresh at different game stages
