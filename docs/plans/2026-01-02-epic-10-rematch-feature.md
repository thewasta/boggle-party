# Rematch Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow players to stay together in the same room after a game ends and play again without recreating the room or re-sharing the room code.

**Architecture:**
1. Add a `rematch()` method to RoomsManager that resets the room state to 'waiting' while keeping players
2. Add a new Pusher event `rematch-requested` to signal all players to return to waiting room
3. Add a new API endpoint `/api/rooms/[code]/rematch` that the host triggers
4. Modify the "Play Again" button to call the rematch endpoint instead of navigating to home
5. Handle player leaving during results phase (return to home instead of waiting room)

**Tech Stack:** Next.js 16, React 19, TypeScript, Pusher Channels, Tailwind CSS v4

---

## Task 1: Add Rematch Types and Events

**Files:**
- Modify: `src/server/types.ts`

**Step 1: Add RematchRequestedEvent type to types.ts**

Add after the `ResultsCompleteEvent` definition (around line 210):

```typescript
/**
 * Rematch requested event payload
 */
export interface RematchRequestedEvent {
  requestedBy: {
    id: string;
    name: string;
  };
}
```

**Step 2: Add RoomError code for rematch**

Modify the `RoomError` class code type union (around line 222) to include `'REMATCH_NOT_ALLOWED'`:

```typescript
export class RoomError extends Error {
  constructor(
    message: string,
    public code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'INVALID_CODE' | 'NOT_HOST' | 'GAME_ALREADY_STARTED' | 'REMATCH_NOT_ALLOWED'
  ) {
    super(message);
    this.name = 'RoomError';
  }
}
```

**Step 3: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/server/types.ts
git commit -m "feat: add rematch types to shared types"
```

---

## Task 2: Add Rematch Method to RoomsManager

**Files:**
- Modify: `src/server/rooms-manager.ts`

**Step 1: Add rematch() method to RoomsManager class**

Add after the `endGame()` method (around line 211):

```typescript
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
```

**Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/server/rooms-manager.ts
git commit -m "feat: add rematchRoom method to RoomsManager"
```

---

## Task 3: Add Rematch Event Emitter

**Files:**
- Modify: `src/server/event-emitter.ts`

**Step 1: Add RematchRequestedEvent import**

Add to imports (around line 7-16):

```typescript
import type {
  PlayerJoinedEvent,
  PlayerLeftEvent,
  GameStartedEvent,
  GameEndedEvent,
  WordFoundEvent,
  RevealWordEvent,
  ResultsCompleteEvent,
  RematchRequestedEvent,
  Player,
} from './types';
```

**Step 2: Add emitRematchRequested function**

Add at the end of the file (after `emitResultsComplete`):

```typescript
/**
 * Emit rematch-requested event
 */
export async function emitRematchRequested(roomId: string, requestedBy: { id: string; name: string }): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'rematch-requested', {
    requestedBy,
  } satisfies RematchRequestedEvent);
}
```

**Step 3: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/server/event-emitter.ts
git commit -m "feat: add rematch-requested event emitter"
```

---

## Task 4: Create Rematch API Endpoint

**Files:**
- Create: `src/app/api/rooms/[code]/rematch/route.ts`

**Step 1: Write the failing test**

First, check if there are existing API tests to understand the test pattern:

Run: `ls -la src/app/api/rooms/*/route.ts` to see existing routes

**Step 2: Create the rematch API endpoint**

Create the file `src/app/api/rooms/[code]/rematch/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { emitRematchRequested } from '@/server/event-emitter';
import { RoomError } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { requesterPlayerId } = body;

    if (!requesterPlayerId) {
      return NextResponse.json(
        { success: false, error: 'requesterPlayerId is required' },
        { status: 400 }
      );
    }

    // Reset room for rematch
    const room = roomsManager.rematchRoom(code, requesterPlayerId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Notify all players to return to waiting room
    await emitRematchRequested(room.id, {
      id: room.host.id,
      name: room.host.name,
    });

    return NextResponse.json({
      success: true,
      room: roomsManager.roomToDTO(room),
    });
  } catch (error) {
    if (error instanceof RoomError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error('Rematch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Step 3: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/app/api/rooms/[code]/rematch/route.ts
git commit -m "feat: add rematch API endpoint"
```

---

## Task 5: Update usePusherChannel Hook to Handle Rematch Event

**Files:**
- Modify: `src/hooks/usePusherChannel.ts`

**Step 1: Read the current hook implementation**

Run: `cat src/hooks/usePusherChannel.ts` to understand current event handling

**Step 2: Add onRematchRequested callback**

The hook uses a callback pattern. Add the `onRematchRequested` callback to the PusherChannelCallbacks interface and the binding logic.

Modify the interface to add the new callback:

```typescript
export interface PusherChannelCallbacks {
  // ... existing callbacks
  onRematchRequested?: (data: { requestedBy: { id: string; name: string } }) => void;
}
```

Add to the bind function:

```typescript
channel.bind('rematch-requested', (data: { requestedBy: { id: string; name: string } }) => {
  callbacks.onRematchRequested?.(data);
});
```

**Step 3: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/hooks/usePusherChannel.ts
git commit -m "feat: add onRematchRequested callback to usePusherChannel"
```

---

## Task 6: Update PlayAgainButton to Call Rematch API

**Files:**
- Modify: `src/components/results/PlayAgainButton.tsx`

**Step 1: Read the current component**

The component currently just navigates to "/". We need to:
1. Accept props for roomCode and playerId
2. Call the rematch API
3. Only host can trigger rematch
4. Navigate to waiting room after successful rematch

**Step 2: Rewrite PlayAgainButton with rematch logic**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PlayAgainButtonProps {
  roomCode: string;
  playerId: string;
  isHost: boolean;
}

export function PlayAgainButton({ roomCode, playerId, isHost }: PlayAgainButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePlayAgain() {
    if (!isHost) {
      // Non-host players wait for host to trigger rematch
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomCode}/rematch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterPlayerId: playerId }),
      });

      if (!response.ok) {
        console.error("Failed to request rematch");
        setIsLoading(false);
        return;
      }

      // Navigate to waiting room
      router.push(`/room/${roomCode}?playerId=${playerId}`);
    } catch (error) {
      console.error("Rematch error:", error);
      setIsLoading(false);
    }
  }

  return (
    <div className="text-center pt-4">
      <button
        type="button"
        onClick={handlePlayAgain}
        disabled={isLoading || !isHost}
        className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl font-black rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

        {/* Loading spinner */}
        {isLoading ? (
          <span className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white" />
            <span>{isHost ? "Preparando revancha..." : "Esperando al anfitrión..."}</span>
          </span>
        ) : (
          <>
            <span className="text-2xl">🎮</span>
            <span>{isHost ? "Jugar otra vez" : "Esperando al anfitrión"}</span>
          </>
        )}
      </button>
    </div>
  );
}
```

**Step 3: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/components/results/PlayAgainButton.tsx
git commit -m "feat: add rematch API call to PlayAgainButton"
```

---

## Task 7: Update FinalRanking to Pass Props to PlayAgainButton

**Files:**
- Modify: `src/components/results/FinalRanking.tsx`

**Step 1: Add props to FinalRanking**

Update the interface and pass props to PlayAgainButton:

```typescript
import type { PlayerScore } from "@/app/results/[roomId]/page";
import { PlayAgainButton } from "./PlayAgainButton";

interface FinalRankingProps {
  playerScores: PlayerScore[];
  roomCode: string;
  playerId: string;
  isHost: boolean;
}

export function FinalRanking({ playerScores, roomCode, playerId, isHost }: FinalRankingProps) {
  const winner = playerScores[0];
  const topThree = playerScores.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* ... existing winner and podium JSX unchanged ... */}

      <PlayAgainButton
        roomCode={roomCode}
        playerId={playerId}
        isHost={isHost}
      />
    </div>
  );
}
```

**Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/results/FinalRanking.tsx
git commit -m "feat: pass rematch props to PlayAgainButton"
```

---

## Task 8: Update Results Page to Handle Rematch

**Files:**
- Modify: `src/app/results/[roomId]/page.tsx`

**Step 1: Add rematch handling to results page**

We need to:
1. Pass the new props to FinalRanking
2. Handle the rematch-requested Pusher event
3. Navigate to waiting room when rematch is triggered

Extract roomCode from the results API response and add rematch handling:

```typescript
"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FinalRanking } from "@/components/results/FinalRanking";
import { ScoreStairs } from "@/components/results/ScoreStairs";
import { WordReveal } from "@/components/results/WordReveal";
import { usePusherChannel } from "@/hooks/usePusherChannel";

export interface PlayerScore {
  id: string;
  name: string;
  avatar: string;
  score: number;
  position: number;
}

export interface RevealWord {
  word: string;
  player: { id: string; name: string; avatar: string };
  score: number;
  isUnique: boolean;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const playerId = searchParams.get("playerId") || "";
  const roomId = params.roomId as string;

  const [revealedWords, setRevealedWords] = useState<RevealWord[]>([]);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roomCode, setRoomCode] = useState<string>("");
  const [hostId, setHostId] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState(false);

  const updatePlayerScore = useCallback((wordData: RevealWord) => {
    setPlayerScores((prev) =>
      prev.map((p) =>
        p.id === wordData.player.id
          ? { ...p, score: p.score + wordData.score }
          : p,
      ),
    );
  }, []);

  usePusherChannel(roomId, {
    onRevealWord: (data) => {
      setRevealedWords((prev) => [...prev, data]);
      updatePlayerScore(data);
    },
    onResultsComplete: (data) => {
      setIsRevealComplete(true);
      setPlayerScores(
        data.finalRankings.map((p, i) => ({ ...p, position: i + 1 })),
      );
    },
    onRematchRequested: () => {
      // Navigate to waiting room when rematch is triggered
      if (!isNavigating) {
        setIsNavigating(true);
        router.push(`/room/${roomCode}?playerId=${playerId}`);
      }
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on mount
  useEffect(() => {
    prepareResults();
  }, [roomId]);

  async function prepareResults() {
    try {
      const response = await fetch(`/api/rooms/${roomId}/results`, {
        method: "POST",
      });
      if (!response.ok) {
        router.push("/");
        return;
      }

      const data = await response.json();
      setPlayerScores(data.initialScores);
      setRoomCode(data.roomCode);
      setHostId(data.hostId);

      // Only host should call the reveal endpoint to avoid duplicate events
      if (playerId === data.hostId) {
        await fetch(`/api/rooms/${roomId}/reveal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revealSequence: data.revealSequence }),
        });
      }
    } catch (error) {
      console.error("Failed to prepare results:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-rose-500 mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-semibold">
            Preparando resultados...
          </p>
        </div>
      </div>
    );
  }

  if (isRevealComplete) {
    return (
      <div className="h-screen bg-[#FDF8F3] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <FinalRanking
            playerScores={playerScores}
            roomCode={roomCode}
            playerId={playerId}
            isHost={playerId === hostId}
          />
        </div>
      </div>
    );
  }

  const latestWords = revealedWords.slice(-2);

  return (
    <div className="h-screen bg-[#FDF8F3] flex flex-col p-4 overflow-hidden">
      <div className="w-full max-w-lg mx-auto flex flex-col h-full">
        <h1 className="text-2xl font-black text-center text-gray-900 mb-4">
          Revelando palabras
        </h1>

        <div className="shrink-0 mb-4">
          <ScoreStairs playerScores={playerScores} />
        </div>

        <div className="flex-1 flex flex-col justify-center gap-2 overflow-hidden">
          {latestWords.length === 0 ? (
            <p className="text-center text-gray-400">
              Esperando primera palabra...
            </p>
          ) : (
            latestWords.map((word, i) => (
              <WordReveal
                key={`${word.word}-${revealedWords.indexOf(word)}`}
                word={word}
                delay={i * 100}
                isLatest={i === latestWords.length - 1}
              />
            ))
          )}
        </div>

        <div className="text-center py-2">
          <p className="text-sm font-semibold text-gray-500">
            {revealedWords.length} palabra
            {revealedWords.length !== 1 ? "s" : ""} revelada
            {revealedWords.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/app/results/[roomId]/page.tsx
git commit -m "feat: handle rematch-requested event on results page"
```

---

## Task 9: Update Results API to Return roomCode

**Files:**
- Modify: `src/app/api/rooms/[roomId]/results/route.ts`

**Step 1: Read the current results API**

Run: `cat src/app/api/rooms/[roomId]/results/route.ts`

**Step 2: Add roomCode to the response**

The API response needs to include `roomCode` so the frontend can navigate to the waiting room.

Modify the response to include roomCode:

```typescript
// In the success response, add roomCode:
return NextResponse.json({
  success: true,
  roomCode: room.code,  // Add this line
  hostId: room.host.id,
  // ... rest of existing response
});
```

**Step 3: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/app/api/rooms/[roomId]/results/route.ts
git commit -m "feat: include roomCode in results API response"
```

---

## Task 10: Handle Player Leaving During Results Phase

**Files:**
- Modify: `src/app/api/rooms/[code]/leave/route.ts`

**Step 1: Read the current leave API**

Run: `cat src/app/api/rooms/[code]/leave/route.ts`

**Step 2: Update leave behavior for finished rooms**

When a player leaves during results phase, they should go to home page (not waiting room) since the game is over. Only if host triggers rematch should they go to waiting room.

Actually, the current behavior is correct - leaving during results sends them home. The rematch flow handles the "stay together" case via Pusher event.

**Step 3: Verify existing behavior**

The leave endpoint is fine as-is. No changes needed.

**No commit needed for this task.**

---

## Task 11: Add Loading State for Non-Host Players

**Files:**
- Modify: `src/components/results/PlayAgainButton.tsx`

**Step 1: Update button to show waiting state for non-host players**

The non-host players should see a disabled button that says "Esperando al anfitrión" until the host triggers rematch.

The implementation from Task 6 already handles this. Verify the button text is correct:

```typescript
{isLoading ? (
  <span className="flex items-center gap-3">
    <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white" />
    <span>{isHost ? "Preparando revancha..." : "Esperando al anfitrión..."}</span>
  </span>
) : (
  <>
    <span className="text-2xl">🎮</span>
    <span>{isHost ? "Jugar otra vez" : "Esperando al anfitrión"}</span>
  </>
)}
```

**No changes needed - Task 6 already implemented this.**

---

## Task 12: Test Rematch Flow Manually

**Step 1: Start the development server**

Run: `docker compose up -d --build web`

**Step 2: Test the complete flow**

1. Create a room as host
2. Join as second player
3. Start game
4. Play through to results
5. Click "Jugar otra vez" as host
6. Verify both players return to waiting room
7. Verify host can start new game
8. Verify new game works correctly

**Step 3: Test edge cases**

1. Non-host clicks "Jugar otra vez" - should be disabled
2. Host leaves during results - should reassign host
3. Player leaves during results - should go to home

**Step 4: Check for any issues**

Look for:
- Players not syncing to waiting room
- Scores not clearing properly
- Board not regenerating
- Host status issues

**If issues found, create fix commits.**

---

## Task 13: Add Animation for Rematch Transition

**Files:**
- Modify: `src/app/results/[roomId]/page.tsx`

**Step 1: Add transition animation**

When rematch is triggered, add a brief loading/transition state before navigating:

```typescript
onRematchRequested: () => {
  if (!isNavigating) {
    setIsNavigating(true);
    // Small delay for smooth transition
    setTimeout(() => {
      router.push(`/room/${roomCode}?playerId=${playerId}`);
    }, 500);
  }
},
```

**Step 2: Update render to show navigation state**

Add a loading overlay when navigating:

```typescript
if (isNavigating) {
  return (
    <div className="h-screen bg-[#FDF8F3] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-emerald-500 mx-auto mb-4" />
        <p className="text-gray-700 text-lg font-semibold">
          Volviendo a la sala...
        </p>
      </div>
    </div>
  );
}
```

**Step 3: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/app/results/[roomId]/page.tsx
git commit -m "feat: add transition animation for rematch"
```

---

## Task 14: Final Testing and Documentation

**Step 1: Run full test suite**

Run: `docker compose exec web pnpm test`

**Step 2: Run linting**

Run: `docker compose exec web pnpm lint`

**Step 3: Manual testing checklist**

- [ ] Host can trigger rematch after results
- [ ] All players return to waiting room together
- [ ] Waiting room shows all players
- [ ] Host can start new game
- [ ] New game generates fresh board
- [ ] Scores are reset for new game
- [ ] Non-host button is disabled
- [ ] Player leaving during results goes to home

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete rematch feature implementation"
```

---

## Summary

This implementation adds a complete rematch feature that:

1. **Keeps players together** - Room persists after game ends, players return to waiting room via Pusher event
2. **Host-controlled** - Only host can trigger rematch, non-host players see waiting state
3. **Clean state reset** - Scores, found words, and board data cleared for new game
4. **Smooth UX** - Loading states and transitions during rematch
5. **Minimal changes** - Leverages existing architecture (RoomsManager, Pusher events, API patterns)

**Key files modified:**
- `src/server/types.ts` - Added RematchRequestedEvent
- `src/server/rooms-manager.ts` - Added rematchRoom() method
- `src/server/event-emitter.ts` - Added emitRematchRequested()
- `src/app/api/rooms/[code]/rematch/route.ts` - New rematch endpoint
- `src/hooks/usePusherChannel.ts` - Added onRematchRequested callback
- `src/components/results/PlayAgainButton.tsx` - Calls rematch API
- `src/components/results/FinalRanking.tsx` - Passes rematch props
- `src/app/results/[roomId]/page.tsx` - Handles rematch event
- `src/app/api/rooms/[roomId]/results/route.ts` - Returns roomCode
