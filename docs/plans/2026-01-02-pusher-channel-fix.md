# Pusher Channel Naming Consistency Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix broken Pusher real-time events by ensuring consistent channel naming between server (emitters) and clients (subscribers).

**Architecture:** All Pusher channels must use `game-{roomCode}` format where `{roomCode}` is the 6-character room code (e.g., `game-JX4XU3`), NOT the internal UUID. Clients subscribe using the room code from URL, not the UUID.

**Tech Stack:** Next.js 16, Pusher Channels, TypeScript, React 19

---

## Root Cause Analysis

**The Problem:**
1. Server emits events to `game-{room.code}` (e.g., `game-JX4XU3`)
2. Client subscribes to `game-{room.id}` (e.g., `game-34c5ada7-c8ab-4bc3-868a-af70f9091110`)
3. These channels never match, so events never reach clients!

**The Fix:**
- Client must subscribe using room **code** (6-char), not UUID
- Remove all references to UUID-based channel subscriptions
- Update `usePusherChannel` hook to accept room code instead of room ID

---

## Task 1: Fix Documentation Comments in Event Emitter

**Files:**
- Modify: `src/server/event-emitter.ts:22` (emitPlayerJoined comment)
- Modify: `src/server/event-emitter.ts:32` (emitPlayerLeft comment)
- Modify: `src/server/event-emitter.ts:43` (emitGameStarted comment)
- Modify: `src/server/event-emitter.ts:54` (emitGameEnded comment)
- Modify: `src/server/event-emitter.ts:63` (emitWordFound comment)
- Modify: `src/server/event-emitter.ts:76` (emitRevealWord comment)
- Modify: `src/server/event-emitter.ts:94` (emitResultsComplete comment)
- Modify: `src/server/event-emitter.ts:103` (emitRematchRequested comment)

**Step 1: Update JSDoc comments to reflect that roomId parameter is actually room code**

Run: `cat src/server/event-emitter.ts | head -30`

Expected: See current comments say "roomId" without clarification

**Step 2: Edit comments to clarify room code usage**

Replace line 22 comment:
```typescript
/**
 * Emit player-joined event
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
```

Replace line 32 comment:
```typescript
/**
 * Emit player-left event
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
```

Replace line 43 comment:
```typescript
/**
 * Emit game-started event
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
```

Replace line 54 comment:
```typescript
/**
 * Emit game-ended event
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
```

Replace line 63 comment:
```typescript
/**
 * Emit word-found event (real-time word submission notification)
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
```

Replace line 76 comment:
```typescript
/**
 * Emit reveal-word event (results phase - sequential word reveal)
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
```

Replace line 94 comment:
```typescript
/**
 * Emit results-complete event (end of reveal phase)
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
```

Replace line 103 comment:
```typescript
/**
 * Emit rematch-requested event
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
```

**Step 3: Verify changes**

Run: `head -110 src/server/event-emitter.ts | grep -A2 "Emit.*event"`

Expected: All comments now reference "Room code (6-character string like 'JX4XU3')"

**Step 4: Commit**

```bash
git add src/server/event-emitter.ts
git commit -m "docs: clarify that roomId parameter is actually room code (6-char)"
```

---

## Task 2: Fix Parameter Name in Event Emitter Functions

**Files:**
- Modify: `src/server/event-emitter.ts`

**Step 1: Rename roomId parameter to roomCode in all functions**

Run: `cat src/server/event-emitter.ts | grep -n "roomId:"`

Expected: See 8 function signatures using `roomId: string`

**Step 2: Rename parameter in emitPlayerJoined (line 22)**

Replace:
```typescript
export async function emitPlayerJoined(roomId: string, player: Player, totalPlayers: number): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'player-joined', {
```

With:
```typescript
export async function emitPlayerJoined(roomCode: string, player: Player, totalPlayers: number): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'player-joined', {
```

**Step 3: Rename parameter in emitPlayerLeft (line 32)**

Replace:
```typescript
export async function emitPlayerLeft(roomId: string, playerId: string, playerName: string, totalPlayers: number): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'player-left', {
```

With:
```typescript
export async function emitPlayerLeft(roomCode: string, playerId: string, playerName: string, totalPlayers: number): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'player-left', {
```

**Step 4: Rename parameter in emitGameStarted (line 43)**

Replace:
```typescript
export async function emitGameStarted(roomId: string, startTime: number, duration: number, board: string[][]): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'game-started', {
```

With:
```typescript
export async function emitGameStarted(roomCode: string, startTime: number, duration: number, board: string[][]): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'game-started', {
```

**Step 5: Rename parameter in emitGameEnded (line 54)**

Replace:
```typescript
export async function emitGameEnded(roomId: string, endTime: number): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'game-ended', {
```

With:
```typescript
export async function emitGameEnded(roomCode: string, endTime: number): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'game-ended', {
```

**Step 6: Rename parameter in emitWordFound (line 63)**

Replace:
```typescript
export async function emitWordFound(roomId: string, playerId: string, playerName: string, word: string, score: number, isUnique: boolean): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'word-found', {
```

With:
```typescript
export async function emitWordFound(roomCode: string, playerId: string, playerName: string, word: string, score: number, isUnique: boolean): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'word-found', {
```

**Step 7: Rename parameter in emitRevealWord (line 76-77)**

Replace:
```typescript
export async function emitRevealWord(
  roomId: string,
  word: string,
```

With:
```typescript
export async function emitRevealWord(
  roomCode: string,
  word: string,
```

And:
```typescript
): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'reveal-word', {
```

With:
```typescript
): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'reveal-word', {
```

**Step 8: Rename parameter in emitResultsComplete (line 94)**

Replace:
```typescript
export async function emitResultsComplete(roomId: string, finalRankings: Array<{ id: string; name: string; avatar: string; score: number }>): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'results-complete', {
```

With:
```typescript
export async function emitResultsComplete(roomCode: string, finalRankings: Array<{ id: string; name: string; avatar: string; score: number }>): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'results-complete', {
```

**Step 9: Rename parameter in emitRematchRequested (line 103)**

Replace:
```typescript
export async function emitRematchRequested(roomId: string, requestedBy: { id: string; name: string }): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'rematch-requested', {
```

With:
```typescript
export async function emitRematchRequested(roomCode: string, requestedBy: { id: string; name: string }): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'rematch-requested', {
```

**Step 10: Verify all changes**

Run: `grep -n "roomCode:" src/server/event-emitter.ts`

Expected: 8 function signatures using `roomCode: string`

**Step 11: Run TypeScript compiler**

Run: `pnpm exec tsc --noEmit`

Expected: No type errors (should pass)

**Step 12: Commit**

```bash
git add src/server/event-emitter.ts
git commit -m "refactor: rename roomId to roomCode in event emitter functions"
```

---

## Task 3: Update Client-Side Pusher Utilities

**Files:**
- Modify: `src/lib/pusher.ts:37-43`

**Step 1: Update getRoomChannelName function documentation**

Run: `cat src/lib/pusher.ts | grep -A5 "Generate channel name"`

Expected:
```typescript
/**
 * Generate channel name for a room
 * @param roomId - Internal room UUID
 * @returns Channel name in format 'game-{roomId}'
 */
export function getRoomChannelName(roomId: string): string {
  return `game-${roomId}`;
}
```

**Step 2: Replace with updated documentation**

Replace lines 37-43:
```typescript
/**
 * Generate channel name for a room
 * @param roomCode - Room code (6-character string like 'JX4XU3')
 * @returns Channel name in format 'game-{roomCode}'
 */
export function getRoomChannelName(roomCode: string): string {
  return `game-${roomCode}`;
}
```

**Step 3: Verify**

Run: `cat src/lib/pusher.ts | grep -A5 "Generate channel name"`

Expected: Documentation now mentions roomCode and 6-character string

**Step 4: Commit**

```bash
git add src/lib/pusher.ts
git commit -m "docs: clarify getRoomChannelName uses room code not UUID"
```

---

## Task 4: Update usePusherChannel Hook

**Files:**
- Modify: `src/hooks/usePusherChannel.ts`

**Step 1: Update parameter name and documentation**

Run: `cat src/hooks/usePusherChannel.ts | grep -A5 "Subscribe to a Pusher channel"`

Expected:
```typescript
/**
 * Subscribe to a Pusher channel and bind event handlers
 *
 * @param roomId - Internal room UUID
 * @param handlers - Event callback functions
 * @param options - Configuration options
 */
export function usePusherChannel(
  roomId: string | null,
```

**Step 2: Replace parameter name and documentation**

Replace lines 32-42:
```typescript
/**
 * Subscribe to a Pusher channel and bind event handlers
 *
 * @param roomCode - Room code (6-character string like 'JX4XU3')
 * @param handlers - Event callback functions
 * @param options - Configuration options
 */
export function usePusherChannel(
  roomCode: string | null,
  handlers: PusherEventHandlers,
  options: UsePusherChannelOptions = {}
): void {
```

**Step 3: Update function body to use roomCode**

Replace line 55-57:
```typescript
    if (!enabled || !roomCode) {
      return;
    }
```

Replace line 68:
```typescript
      const channelName = getRoomChannelName(roomCode);
```

Replace line 139:
```typescript
  }, [roomCode, enabled]);
```

**Step 4: Verify all changes**

Run: `grep "roomCode" src/hooks/usePusherChannel.ts`

Expected: 5 occurrences (parameter, documentation, 2x in body, dependency array)

**Step 5: Run TypeScript compiler**

Run: `pnpm exec tsc --noEmit`

Expected: Type errors in files that call this hook (we'll fix next)

**Step 6: Commit**

```bash
git add src/hooks/usePusherChannel.ts
git commit -m "refactor: rename usePusherChannel roomId param to roomCode"
```

---

## Task 5: Fix Waiting Room Page

**Files:**
- Modify: `src/app/room/[code]/page.tsx`

**Step 1: Check current usage**

Run: `grep -n "usePusherChannel\|roomId\|roomData" src/app/room/[code]/page.tsx | head -20`

Expected:
- Line 30: `roomId: string;` in roomData state
- Line 69: `roomId: data.room.id,` - Using UUID!
- Line 143: `roomId={roomData.roomId}` - Passing UUID to component
- Line 183: `usePusherChannel(props.roomId, {` - Using UUID

**Step 2: Remove roomId from roomData state**

Replace lines 29-35:
```typescript
  const [roomData, setRoomData] = useState<{
    initialPlayers: Player[];
    initialHost: Player;
    initialGridSize: GridSize;
    initialStatus: string;
  } | null>(null);
```

**Step 3: Update setRoomData call (line 68-74)**

Replace:
```typescript
        if (mounted) {
          setRoomData({
            roomId: data.room.id,
            initialPlayers: data.room.players,
            initialHost: data.room.host,
            initialGridSize: data.room.gridSize,
            initialStatus: data.room.status,
          });
```

With:
```typescript
        if (mounted) {
          setRoomData({
            initialPlayers: data.room.players,
            initialHost: data.room.host,
            initialGridSize: data.room.gridSize,
            initialStatus: data.room.status,
          });
```

**Step 4: Update WaitingRoomClient component props (line 153-161)**

Replace:
```typescript
function WaitingRoomClient(props: {
  roomCode: string;
  roomId: string;
  initialPlayers: Player[];
  initialHost: Player;
  initialGridSize: GridSize;
  initialStatus: string;
  currentPlayerId: string;
}) {
```

With:
```typescript
function WaitingRoomClient(props: {
  roomCode: string;
  initialPlayers: Player[];
  initialHost: Player;
  initialGridSize: GridSize;
  initialStatus: string;
  currentPlayerId: string;
}) {
```

**Step 5: Update component call (line 141-149)**

Replace:
```typescript
  return (
    <WaitingRoomClient
      roomCode={resolvedParams.code}
      roomId={roomData.roomId}
      initialPlayers={roomData.initialPlayers}
      initialHost={roomData.initialHost}
      initialGridSize={roomData.initialGridSize}
      initialStatus={roomData.initialStatus}
      currentPlayerId={resolvedParams.playerId}
    />
  );
```

With:
```typescript
  return (
    <WaitingRoomClient
      roomCode={resolvedParams.code}
      initialPlayers={roomData.initialPlayers}
      initialHost={roomData.initialHost}
      initialGridSize={roomData.initialGridSize}
      initialStatus={roomData.initialStatus}
      currentPlayerId={resolvedParams.playerId}
    />
  );
```

**Step 6: Update usePusherChannel call (line 183)**

Replace:
```typescript
  usePusherChannel(props.roomId, {
```

With:
```typescript
  usePusherChannel(props.roomCode, {
```

**Step 7: Verify**

Run: `grep -n "roomId" src/app/room/[code]/page.tsx`

Expected: No results (all references removed)

**Step 8: Run TypeScript compiler**

Run: `pnpm exec tsc --noEmit`

Expected: No type errors in this file

**Step 9: Commit**

```bash
git add src/app/room/[code]/page.tsx
git commit -m "fix: use room code instead of UUID for Pusher in waiting room"
```

---

## Task 6: Fix Results Page

**Files:**
- Modify: `src/app/results/[roomId]/page.tsx`

**Step 1: Check current file structure**

Run: `head -40 src/app/results/[roomId]/page.tsx`

Expected: URL param is named `roomId` but this is the UUID, not room code

**Step 2: This is a special case - results page uses UUID in URL**

The results page URL pattern is `/results/[roomId]` where `roomId` is actually the UUID. This is different from the waiting room which uses `/room/[code]`.

We need to fetch room info first to get the code, then use code for Pusher.

**Step 3: Add roomCode state**

After line 38 (roomCode state initialization), verify it exists:
```typescript
  const [roomCode, setRoomCode] = useState<string | null>(null);
```

**Step 4: Update prepareResults to fetch room code**

Run: `cat src/app/results/[roomId]/page.tsx | grep -A20 "async function prepareResults"`

Expected: Currently only fetches results data

**Step 5: Modify prepareResults to also get room info**

Read the full prepareResults function first:

Run: `cat src/app/results/[roomId]/page.tsx | sed -n '78,110p'`

Replace the entire prepareResults function to also fetch room code:

```typescript
  async function prepareResults() {
    try {
      // First, get room info to get the room code for Pusher
      const roomResponse = await fetch(`/api/rooms/${roomId}`, {
        cache: "no-store",
      });

      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        setRoomCode(roomData.room.code);
        setIsHost(roomData.room.host.id === playerId);
      }

      // Then fetch results data
      const response = await fetch(`/api/rooms/${roomId}/results`, {
```

**Step 6: Update usePusherChannel to use roomCode when available**

Replace line 52:
```typescript
  usePusherChannel(roomId, {
```

With:
```typescript
  usePusherChannel(roomCode, {
```

**Step 7: Add enabled check to prevent subscription before roomCode is ready**

Replace line 52:
```typescript
  usePusherChannel(roomCode, {
```

With:
```typescript
  usePusherChannel(roomCode, {
    enabled: !!roomCode,
```

**Step 8: Verify**

Run: `grep -n "usePusherChannel" src/app/results/[roomId]/page.tsx`

Expected: Now uses roomCode with enabled check

**Step 9: Run TypeScript compiler**

Run: `pnpm exec tsc --noEmit`

Expected: No type errors

**Step 10: Commit**

```bash
git add src/app/results/[roomId]/page.tsx
git commit -m "fix: fetch room code for Pusher subscription in results page"
```

---

## Task 7: Check useGameSync Hook

**Files:**
- Modify: `src/hooks/useGameSync.ts`

**Step 1: Check current implementation**

Run: `grep -n "usePusherChannel\|roomId" src/hooks/useGameSync.ts | head -15`

Expected: This hook wraps usePusherChannel, check what it passes

**Step 2: Read the hook signature**

Run: `head -40 src/hooks/useGameSync.ts`

**Step 3: Update hook if it uses roomId parameter**

Look for line 136 where usePusherChannel is called

Run: `sed -n '130,150p' src/hooks/useGameSync.ts`

**Step 4: If needed, update parameter name from roomId to roomCode**

The hook likely passes through the parameter. Update:

Replace function signature (around line 11-14):
```typescript
export function useGameSync(
  roomCode: string | null,
```

Replace usePusherChannel call (line 136):
```typescript
  usePusherChannel(roomCode, {
```

**Step 5: Verify callers of useGameSync still work**

Run: `grep -rn "useGameSync" src/ --include="*.tsx" --include="*.ts"`

Expected: Check game page uses this hook correctly

**Step 6: Run TypeScript compiler**

Run: `pnpm exec tsc --noEmit`

Expected: No type errors

**Step 7: Commit**

```bash
git add src/hooks/useGameSync.ts
git commit -m "refactor: rename useGameSync roomId param to roomCode"
```

---

## Task 8: Check and Fix Active Game Page

**Files:**
- Check: `src/app/game/[code]/page.tsx`

**Step 1: Check if game page exists and uses useGameSync**

Run: `ls src/app/game/ 2>/dev/null && echo "exists" || echo "not found"`

**Step 2: If exists, verify it uses room code**

Run: `grep -n "useGameSync\|usePusherChannel\|roomId\|roomCode" src/app/game/[code]/page.tsx 2>/dev/null || echo "File not found"`

**Step 3: Update if needed to use room code**

If game page exists and uses UUID, update it similar to waiting room page.

**Step 4: Commit if changes made**

```bash
git add src/app/game/[code]/page.tsx
git commit -m "fix: use room code for Pusher in active game page"
```

---

## Task 9: Run Full TypeScript Check

**Step 1: Run TypeScript compiler**

Run: `pnpm exec tsc --noEmit`

Expected: No type errors

**Step 2: Fix any remaining type errors**

If errors exist, fix them. They should be related to parameter name changes.

**Step 3: Run linter**

Run: `pnpm lint`

Expected: No lint errors (Biome)

**Step 4: Commit if any fixes**

```bash
git add -A
git commit -m "fix: resolve remaining TypeScript errors after parameter rename"
```

---

## Task 10: Manual Testing

**Step 1: Start development environment**

Run: `docker compose up -d --build web`

Expected: Web service builds and starts

**Step 2: Watch logs**

Run: `docker compose logs -f web`

Expected: No errors, server starts successfully

**Step 3: Test player join events**

1. Open browser to `http://localhost:3000`
2. Create a room (note the room code, e.g., `ABC123`)
3. Open second browser window (incognito)
4. Join the room with the code
5. In first window, verify second player appears

Expected: Host sees second player join immediately

**Step 4: Test game start event**

1. Host clicks "Start Game"
2. Second window should navigate to game screen

Expected: Both players see game start simultaneously

**Step 5: Test player leave events**

1. Open third window and join room
2. Close third window
4. Check if other players see the player leave

Expected: Other players see updated player list

**Step 6: Check Pusher debug console**

Run: `docker compose exec web pnpm exec tsx -e "console.log('Pusher events being sent to: game-{roomCode}')"` (conceptual check)

Expected: All events use `game-{CODE}` format

**Step 7: Document any issues found**

If any issues, note them for fixes.

**Step 8: Commit if any bug fixes**

```bash
git add -A
git commit -m "fix: resolve issues found during manual testing"
```

---

## Task 11: Update Documentation

**Files:**
- Modify: `docs/plans/2025-12-30-epic-5-pusher-integration.md`
- Modify: `CLAUDE.md`

**Step 1: Update Epic 5 documentation to reflect correct channel naming**

Run: `grep -n "presence-\|roomId\|room.id\|room.code" docs/plans/2025-12-30-epic-5-pusher-integration.md | head -20`

**Step 2: Fix incorrect references in Epic 5 docs**

Look for and update any references to:
- `presence-game-` → `game-`
- `game-{room.id}` → `game-{room.code}`
- `roomId (UUID)` → `roomCode (6-char code)`

**Step 3: Update CLAUDE.md**

Run: `grep -n "presence-\|roomId" CLAUDE.md | head -10`

Fix the "Real-Time Events (Pusher)" section to show correct channel naming:

Replace:
```markdown
### Real-Time Events (Pusher)

Channel: `presence-game-{roomId}`
```

With:
```markdown
### Real-Time Events (Pusher)

Channel: `game-{roomCode}` where `{roomCode}` is the 6-character room code (e.g., `game-JX4XU3`)
```

**Step 4: Commit documentation updates**

```bash
git add docs/plans/2025-12-30-epic-5-pusher-integration.md CLAUDE.md
git commit -m "docs: fix Pusher channel naming documentation"
```

---

## Task 12: Update Tests

**Files:**
- Modify: `src/server/__tests__/pusher-events.test.ts`

**Step 1: Check existing test**

Run: `cat src/server/__tests__/pusher-events.test.ts`

Expected: Test verifies channel naming

**Step 2: Update test if it references UUID**

Look for any test assertions that check channel format with UUID pattern.

Update to expect 6-character room code format instead.

**Step 3: Run tests**

Run: `docker compose exec web pnpm test`

Expected: All tests pass

**Step 4: Commit test updates**

```bash
git add src/server/__tests__/pusher-events.test.ts
git commit -m "test: update Pusher channel tests to use room code format"
```

---

## Task 13: Final Verification

**Step 1: Run full test suite**

Run: `docker compose exec web pnpm test`

Expected: All tests pass

**Step 2: Build production version**

Run: `docker compose exec web pnpm build`

Expected: Build succeeds with no errors

**Step 3: Run production server**

Run: `docker compose up -d --build web`

Expected: Production server starts successfully

**Step 4: Final manual smoke test**

Repeat manual testing from Task 10 to confirm everything works.

**Step 5: Create summary of changes**

List all files modified and the nature of changes.

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup after Pusher channel naming fix"
```

---

## Summary

This plan fixes the critical bug where Pusher events weren't reaching clients due to channel naming mismatch:

**Before:**
- Server emits to: `game-{room.code}` (e.g., `game-JX4XU3`)
- Client subscribes to: `game-{room.id}` (e.g., `game-34c5ada7...`)
- Result: Channels never match, events lost

**After:**
- Server emits to: `game-{room.code}` (unchanged)
- Client subscribes to: `game-{room.code}` (fixed)
- Result: Channels match, events delivered

**Files Modified:**
1. `src/server/event-emitter.ts` - Renamed params, updated docs
2. `src/lib/pusher.ts` - Updated documentation
3. `src/hooks/usePusherChannel.ts` - Renamed param
4. `src/app/room/[code]/page.tsx` - Use room code
5. `src/app/results/[roomId]/page.tsx` - Fetch and use room code
6. `src/hooks/useGameSync.ts` - Renamed param
7. Documentation files

**Key Insight:** The recent commits (2bf7de4, 73bf7e6) fixed the server-side emission to use `room.code`, but didn't update the client-side subscription which was still using UUID. This plan completes that fix.
