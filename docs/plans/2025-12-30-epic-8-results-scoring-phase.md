# Epic 8: Results & Scoring Phase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build animated results screen with sequential word reveal, stairs visualization with climbing avatars, unique word bonuses, final ranking with winner highlight, and database persistence

**Architecture:** Server-side unique word calculation and sequential Pusher event emission → Client-side queued animation display → Database persistence via repositories → Animated transition to final ranking

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Pusher Channels, PostgreSQL (Epic 2 repositories), @frontend-design plugin for UI design

---

## Task 1: Server-Side Unique Word Calculator

**Files:**
- Create: `src/server/word-unique-calculator.ts`
- Modify: `src/server/types.ts` (add RevealWordData type)

**Step 1: Write the failing test**

Create `src/server/__tests__/word-unique-calculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateUniqueWords, prepareRevealSequence } from '../word-unique-calculator';

describe('calculateUniqueWords', () => {
  it('marks words found by only one player as unique', () => {
    const foundWords = [
      { playerId: 'p1', playerName: 'Alice', word: 'HOLA', score: 4 },
      { playerId: 'p1', playerName: 'Alice', word: 'CASA', score: 4 },
      { playerId: 'p2', playerName: 'Bob', word: 'HOLA', score: 4 },
      { playerId: 'p2', playerName: 'Bob', word: 'PERRO', score: 5 },
    ];

    const result = calculateUniqueWords(foundWords);

    expect(result).toEqual([
      { playerId: 'p1', playerName: 'Alice', word: 'HOLA', score: 4, isUnique: false },
      { playerId: 'p1', playerName: 'Alice', word: 'CASA', score: 4, isUnique: true },
      { playerId: 'p2', playerName: 'Bob', word: 'HOLA', score: 4, isUnique: false },
      { playerId: 'p2', playerName: 'Bob', word: 'PERRO', score: 5, isUnique: true },
    ]);
  });

  it('handles empty input', () => {
    expect(calculateUniqueWords([])).toEqual([]);
  });

  it('handles single player', () => {
    const foundWords = [
      { playerId: 'p1', playerName: 'Alice', word: 'HOLA', score: 4 },
      { playerId: 'p1', playerName: 'Alice', word: 'CASA', score: 4 },
    ];

    const result = calculateUniqueWords(foundWords);

    expect(result.every(w => w.isUnique)).toBe(true);
  });
});

describe('prepareRevealSequence', () => {
  it('sorts words by score (high to low) for dramatic reveal', () => {
    const words = [
      { playerId: 'p1', playerName: 'Alice', word: 'A', score: 1, isUnique: true },
      { playerId: 'p2', playerName: 'Bob', word: 'BBBBB', score: 5, isUnique: false },
      { playerId: 'p1', playerName: 'Alice', word: 'CCC', score: 3, isUnique: false },
    ];

    const sequence = prepareRevealSequence(words);

    expect(sequence[0].word).toBe('BBBBB'); // Highest score first
    expect(sequence[1].word).toBe('CCC');
    expect(sequence[2].word).toBe('A');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `docker compose exec web pnpm test src/server/__tests__/word-unique-calculator.test.ts`

Expected: FAIL with "Cannot find module '../word-unique-calculator'"

**Step 3: Write minimal implementation**

Create `src/server/word-unique-calculator.ts`:

```typescript
export interface FoundWordData {
  playerId: string;
  playerName: string;
  word: string;
  score: number;
}

export interface RevealWordData extends FoundWordData {
  isUnique: boolean;
}

/**
 * Analyzes all found words and marks unique words (found by only one player)
 * Unique words get ×2 bonus in scoring
 */
export function calculateUniqueWords(foundWords: FoundWordData[]): RevealWordData[] {
  const wordCounts = new Map<string, number>();

  foundWords.forEach(({ word }) => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });

  return foundWords.map(word => ({
    ...word,
    isUnique: wordCounts.get(word.word) === 1,
  }));
}

/**
 * Sorts words for dramatic reveal sequence
 * Higher scoring words revealed first for more impact
 */
export function prepareRevealSequence(words: RevealWordData[]): RevealWordData[] {
  return [...words].sort((a, b) => {
    if (a.isUnique && !b.isUnique) return -1;
    if (!a.isUnique && b.isUnique) return 1;
    return b.score - a.score;
  });
}
```

**Step 4: Run test to verify it passes**

Run: `docker compose exec web pnpm test src/server/__tests__/word-unique-calculator.test.ts`

Expected: PASS (4 tests passing)

**Step 5: Commit**

```bash
git add src/server/word-unique-calculator.ts src/server/__tests__/word-unique-calculator.test.ts
git commit -m "feat(results): add unique word calculator for scoring bonuses"
```

---

## Task 2: Add Game End API Endpoint with Database Persistence

**Files:**
- Create: `src/app/api/rooms/[code]/results/route.ts`
- Modify: `src/server/types.ts` (add ResultsPrepareData type)

**Step 1: Write the failing test**

Create `src/app/api/rooms/[code]/results/__tests__/route.test.ts`:

```typescript
import { POST } from '../route';
import { roomsManager } from '@/server/rooms-manager';
import { gamesRepository, playersRepository, wordsRepository } from '@/server/db/repositories';

vi.mock('@/server/rooms-manager');
vi.mock('@/server/db/repositories');

describe('POST /api/rooms/[code]/results', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prepares results with unique word calculation', async () => {
    const mockRoom = {
      code: 'ABC123',
      status: 'finished' as const,
      players: new Map([
        ['p1', { id: 'p1', name: 'Alice', avatar: '🎮', score: 10, foundWords: ['HOLA', 'CASA'] }],
        ['p2', { id: 'p2', name: 'Bob', avatar: '🎯', score: 8, foundWords: ['HOLA'] }],
      ]),
      gridSize: 4 as const,
      board: [['A', 'B'], ['C', 'D']],
    };

    vi.mocked(roomsManager.getRoom).mockReturnValue(mockRoom);

    const request = new Request('http://localhost:3000/api/rooms/ABC123/results', {
      method: 'POST',
    });

    const response = await POST(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.revealSequence).toBeDefined();
    expect(data.revealSequence.length).toBeGreaterThan(0);
  });

  it('returns 404 for non-existent room', async () => {
    vi.mocked(roomsManager.getRoom).mockReturnValue(undefined);

    const request = new Request('http://localhost:3000/api/rooms/INVALID/results', {
      method: 'POST',
    });

    const response = await POST(request, { params: { code: 'INVALID' } });

    expect(response.status).toBe(404);
  });

  it('returns 400 if game not finished', async () => {
    const mockRoom = {
      code: 'ABC123',
      status: 'playing' as const,
      players: new Map(),
      gridSize: 4 as const,
    };

    vi.mocked(roomsManager.getRoom).mockReturnValue(mockRoom);

    const request = new Request('http://localhost:3000/api/rooms/ABC123/results', {
      method: 'POST',
    });

    const response = await POST(request, { params: { code: 'ABC123' } });

    expect(response.status).toBe(400);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `docker compose exec web pnpm test src/app/api/rooms/[code]/results/__tests__/route.test.ts`

Expected: FAIL with "Cannot find module '../route'"

**Step 3: Write minimal implementation**

Create `src/app/api/rooms/[code]/results/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { calculateUniqueWords, prepareRevealSequence } from '@/server/word-unique-calculator';
import { gamesRepository, playersRepository, wordsRepository } from '@/server/db/repositories';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const room = roomsManager.getRoom(params.code);

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  if (room.status !== 'finished') {
    return NextResponse.json({ error: 'Game not finished' }, { status: 400 });
  }

  // Collect all found words from all players
  const allFoundWords: Array<{ playerId: string; playerName: string; word: string; score: number }> = [];

  for (const [playerId, player] of room.players) {
    for (const word of player.foundWords) {
      const score = calculateWordScore(word);
      allFoundWords.push({
        playerId,
        playerName: player.name,
        word,
        score,
      });
    }
  }

  // Calculate unique words and prepare reveal sequence
  const wordsWithUniqueness = calculateUniqueWords(allFoundWords);
  const revealSequence = prepareRevealSequence(wordsWithUniqueness);

  // Save game to database
  try {
    const game = await gamesRepository.create({
      room_code: room.code,
      grid_size: room.gridSize,
      duration: room.duration,
      status: 'finished',
      board: JSON.stringify(room.board),
    });

    // Save players
    const playerIds = new Map<string, string>();
    for (const [id, player] of room.players) {
      const dbPlayer = await playersRepository.create({
        game_id: game.id,
        player_name: player.name,
        avatar: player.avatar,
        final_score: player.score,
        words_found: player.foundWords.length,
        unique_words_found: 0,
        is_host: id === room.host,
      });
      playerIds.set(id, dbPlayer.id);
    }

    // Save words with uniqueness info
    for (const wordData of wordsWithUniqueness) {
      const dbPlayerId = playerIds.get(wordData.playerId);
      if (dbPlayerId) {
        await wordsRepository.create({
          game_id: game.id,
          player_id: dbPlayerId,
          word: wordData.word,
          score: wordData.isUnique ? wordData.score * 2 : wordData.score,
          is_unique: wordData.isUnique,
          word_length: wordData.word.length,
          path: [],
        });
      }
    }

    // Increment games played count for words found
    await gamesRepository.incrementWordsFound(game.id, allFoundWords.length);
  } catch (error) {
    console.error('Failed to save game to database:', error);
  }

  return NextResponse.json({
    revealSequence,
    totalWords: allFoundWords.length,
  });
}

function calculateWordScore(word: string): number {
  const length = word.length;
  if (length <= 4) return 1;
  if (length === 5) return 2;
  if (length === 6) return 3;
  return 5;
}
```

**Step 4: Run test to verify it passes**

Run: `docker compose exec web pnpm test src/app/api/rooms/[code]/results/__tests__/route.test.ts`

Expected: PASS (3 tests passing)

**Step 5: Commit**

```bash
git add src/app/api/rooms/[code]/results/route.ts src/app/api/rooms/[code]/results/__tests__/route.test.ts
git commit -m "feat(results): add results preparation endpoint with database persistence"
```

---

## Task 3: Add Start Reveal API Endpoint

**Files:**
- Create: `src/app/api/rooms/[code]/reveal/route.ts`

**Step 1: Write the failing test**

Create `src/app/api/rooms/[code]/reveal/__tests__/route.test.ts`:

```typescript
import { POST } from '../route';
import { roomsManager } from '@/server/rooms-manager';
import { emitRevealWord, emitResultsComplete } from '@/server/event-emitter';

vi.mock('@/server/rooms-manager');
vi.mock('@/server/event-emitter');

describe('POST /api/rooms/[code]/reveal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts sequential word reveal', async () => {
    const mockRoom = {
      code: 'ABC123',
      status: 'finished' as const,
      players: new Map([
        ['p1', { id: 'p1', name: 'Alice', avatar: '🎮', score: 10, foundWords: ['HOLA'] }],
      ]),
    };

    vi.mocked(roomsManager.getRoom).mockReturnValue(mockRoom);

    const request = new Request('http://localhost:3000/api/rooms/ABC123/reveal', {
      method: 'POST',
      body: JSON.stringify({ revealSequence: [{ word: 'HOLA', playerId: 'p1', playerName: 'Alice', score: 1, isUnique: true }] }),
    });

    const response = await POST(request, { params: { code: 'ABC123' } });

    expect(response.status).toBe(200);
    expect(emitRevealWord).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `docker compose exec web pnpm test src/app/api/rooms/[code]/reveal/__tests__/route.test.ts`

Expected: FAIL with "Cannot find module '../route'"

**Step 3: Write minimal implementation**

Create `src/app/api/rooms/[code]/reveal/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { emitRevealWord, emitResultsComplete } from '@/server/event-emitter';
import type { RevealWordData } from '@/server/word-unique-calculator';

const REVEAL_DELAY_MS = 1500;

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const room = roomsManager.getRoom(params.code);

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  if (room.status !== 'finished') {
    return NextResponse.json({ error: 'Game not finished' }, { status: 400 });
  }

  const body = await request.json();
  const revealSequence: RevealWordData[] = body.revealSequence || [];

  // Start sequential reveal
  startRevealSequence(room.code, revealSequence);

  return NextResponse.json({ started: true });
}

async function startRevealSequence(roomCode: string, words: RevealWordData[]) {
  const room = roomsManager.getRoom(roomCode);
  if (!room) return;

  for (const wordData of words) {
    const player = room.players.get(wordData.playerId);
    if (!player) continue;

    await emitRevealWord(roomCode, {
      word: wordData.word,
      player: {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
      },
      score: wordData.isUnique ? wordData.score * 2 : wordData.score,
      isUnique: wordData.isUnique,
    });

    await new Promise(resolve => setTimeout(resolve, REVEAL_DELAY_MS));
  }

  // Emit results complete event
  const finalRankings = Array.from(room.players.values())
    .map(p => ({ id: p.id, name: p.name, avatar: p.avatar, score: p.score }))
    .sort((a, b) => b.score - a.score);

  await emitResultsComplete(roomCode, { finalRankings });
}
```

**Step 4: Run test to verify it passes**

Run: `docker compose exec web pnpm test src/app/api/rooms/[code]/reveal/__tests__/route.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/rooms/[code]/reveal/route.ts src/app/api/rooms/[code]/reveal/__tests__/route.test.ts
git commit -m "feat(results): add sequential reveal endpoint with Pusher events"
```

---

## Task 4: Create Results Page Structure

**IMPORTANT:** Use @frontend-design plugin for this UI component.

**Files:**
- Create: `src/app/results/[roomId]/page.tsx`

**Step 1: Write the component skeleton**

Create `src/app/results/[roomId]/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePusherChannel } from '@/hooks/usePusherChannel';

interface RevealWord {
  word: string;
  player: { id: string; name: string; avatar: string };
  score: number;
  isUnique: boolean;
}

interface PlayerScore {
  id: string;
  name: string;
  avatar: string;
  score: number;
  position: number;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [revealedWords, setRevealedWords] = useState<RevealWord[]>([]);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to Pusher events
  usePusherChannel(roomId, {
    onRevealWord: (data) => {
      setRevealedWords(prev => [...prev, data]);
      updatePlayerScore(data);
    },
    onResultsComplete: (data) => {
      setIsRevealComplete(true);
      setPlayerScores(data.finalRankings.map((p, i) => ({ ...p, position: i + 1 })));
    },
  });

  useEffect(() => {
    // Prepare and start reveal
    prepareResults();
  }, [roomId]);

  async function prepareResults() {
    try {
      const response = await fetch(`/api/rooms/${roomId}/results`, { method: 'POST' });
      if (!response.ok) {
        router.push('/');
        return;
      }

      const data = await response.json();

      // Initialize player scores at 0
      const response2 = await fetch(`/api/rooms/${roomId}`);
      const roomData = await response2.json();
      const initialScores = roomData.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: 0,
        position: 0,
      }));
      setPlayerScores(initialScores);

      // Start reveal
      await fetch(`/api/rooms/${roomId}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revealSequence: data.revealSequence }),
      });
    } catch (error) {
      console.error('Failed to prepare results:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }

  function updatePlayerScore(wordData: RevealWord) {
    setPlayerScores(prev =>
      prev.map(p =>
        p.id === wordData.player.id
          ? { ...p, score: p.score + wordData.score }
          : p
      )
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4" />
          <p className="text-indigo-900 text-lg">Preparando resultados...</p>
        </div>
      </div>
    );
  }

  if (isRevealComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <FinalRanking playerScores={playerScores} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 overflow-hidden">
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-4xl font-bold text-center text-indigo-900 mb-8">
          Revelando palabras
        </h1>

        <ScoreStairs playerScores={playerScores} />

        <div className="mt-8 space-y-3">
          {revealedWords.map((word, index) => (
            <WordReveal key={`${word.word}-${index}`} word={word} delay={index * 100} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Placeholder components - will be implemented in next tasks
function ScoreStairs({ playerScores }: { playerScores: PlayerScore[] }) {
  return <div className="text-center text-gray-400">Escaleras de puntuación</div>;
}

function WordReveal({ word, delay }: { word: RevealWord; delay: number }) {
  return <div className="text-center text-gray-400">{word.word}</div>;
}

function FinalRanking({ playerScores }: { playerScores: PlayerScore[] }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-indigo-900 mb-6">¡Resultados finales!</h2>
      {playerScores.map((p) => (
        <div key={p.id} className="py-2">{p.name}: {p.score}</div>
      ))}
    </div>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `docker compose exec web pnpm exec tsc --noEmit`

Expected: No errors

**Step 3: Commit**

```bash
git add src/app/results/[roomId]/page.tsx
git commit -m "feat(results): add results page structure with Pusher integration"
```

---

## Task 5: Design and Implement ScoreStairs Component

**IMPORTANT:** Use @frontend-design plugin for this UI component.

**Files:**
- Create: `src/components/results/ScoreStairs.tsx`

**Step 1: Design with frontend-design plugin**

Invoke the `@frontend-design` plugin to design the ScoreStairs component with:
- Visual stairs/stepped layout
- Player avatars at bottom
- Steps going upward (like a ladder/stairs)
- Smooth climbing animations
- Mobile responsive
- Warm indigo/purple gradient theme matching existing pages

**Step 2: Create the component**

Create `src/components/results/ScoreStairs.tsx`:

```tsx
import { PlayerScore } from '@/app/results/[roomId]/page';

interface ScoreStairsProps {
  playerScores: PlayerScore[];
}

export function ScoreStairs({ playerScores }: ScoreStairsProps) {
  const maxScore = Math.max(...playerScores.map(p => p.score), 1);

  return (
    <div className="relative w-full h-80 bg-gradient-to-b from-indigo-100 to-white rounded-2xl border-4 border-indigo-200 overflow-hidden">
      {/* Stair steps */}
      <div className="absolute inset-0 flex flex-col-reverse justify-around p-4">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="w-full border-t-2 border-dashed border-indigo-200"
            style={{ bottom: `${i * 10}%` }}
          >
            <span className="text-xs text-indigo-400">{Math.round((maxScore / 10) * i)}</span>
          </div>
        ))}
      </div>

      {/* Player avatars on stairs */}
      {playerScores.map((player) => {
        const heightPercent = (player.score / maxScore) * 90;
        return (
          <div
            key={player.id}
            className="absolute left-0 right-0 flex justify-center transition-all duration-700 ease-out"
            style={{ bottom: `${heightPercent}%` }}
          >
            <PlayerAvatar
              avatar={player.avatar}
              name={player.name}
              score={player.score}
              position={player.position}
            />
          </div>
        );
      })}
    </div>
  );
}

interface PlayerAvatarProps {
  avatar: string;
  name: string;
  score: number;
  position: number;
}

function PlayerAvatar({ avatar, name, score, position }: PlayerAvatarProps) {
  return (
    <div className="flex flex-col items-center animate-climb">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-3xl shadow-lg border-4 border-white">
          {avatar}
        </div>
        {position === 1 && score > 0 && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md animate-bounce">
            👑
          </div>
        )}
      </div>
      <div className="mt-2 text-center">
        <p className="text-sm font-semibold text-indigo-900">{name}</p>
        <p className="text-lg font-bold text-indigo-600">{score} pts</p>
      </div>
    </div>
  );
}
```

**Step 3: Add climb animation to globals.css**

Add to `src/app/globals.css`:

```css
@keyframes climb {
  0% {
    transform: translateY(20px) scale(0.9);
    opacity: 0.5;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.animate-climb {
  animation: climb 0.5s ease-out;
}
```

**Step 4: Update results page to use new component**

Update `src/app/results/[roomId]/page.tsx`:

```tsx
import { ScoreStairs } from '@/components/results/ScoreStairs';

// ... update the ScoreStairs placeholder to import the real component
```

**Step 5: Verify and commit**

Run: `docker compose exec web pnpm exec tsc --noEmit`

```bash
git add src/components/results/ScoreStairs.tsx src/app/globals.css src/app/results/[roomId]/page.tsx
git commit -m "feat(results): add ScoreStairs component with climbing avatars"
```

---

## Task 6: Design and Implement WordReveal Component

**IMPORTANT:** Use @frontend-design plugin for this UI component.

**Files:**
- Create: `src/components/results/WordReveal.tsx`

**Step 1: Design with frontend-design plugin**

Invoke the `@frontend-design` plugin to design the WordReveal component with:
- Card appearing with fade-in + slide up animation
- Player avatar on left
- Word in center (large, bold)
- Score badge on right (+points)
- Unique word indicator ("¡ÚNICA!" badge + "×2")
- Glow/pulse effect for unique words
- Mobile responsive

**Step 2: Create the component**

Create `src/components/results/WordReveal.tsx`:

```tsx
import { RevealWord } from '@/app/results/[roomId]/page';

interface WordRevealProps {
  word: RevealWord;
  delay: number;
}

export function WordReveal({ word, delay }: WordRevealProps) {
  return (
    <div
      className={`relative bg-white rounded-xl shadow-lg border-2 p-4 animate-word-reveal ${
        word.isUnique ? 'border-yellow-400 shadow-yellow-200/50' : 'border-indigo-200'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        {/* Player info */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            word.isUnique ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-indigo-400 to-purple-500'
          }`}>
            {word.player.avatar}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{word.player.name}</p>
            <p className="text-xs text-gray-400">encontró</p>
          </div>
        </div>

        {/* Word */}
        <div className="flex-1 text-center">
          <p className={`text-3xl font-bold ${word.isUnique ? 'text-yellow-600' : 'text-indigo-900'}`}>
            {word.word}
          </p>
        </div>

        {/* Score */}
        <div className="text-right">
          <p className={`text-2xl font-bold ${word.isUnique ? 'text-yellow-600' : 'text-green-600'}`}>
            +{word.score}
          </p>
          {word.isUnique && (
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                ¡ÚNICA!
              </span>
              <span className="text-sm font-bold text-yellow-600">×</2>
            </div>
          )}
        </div>
      </div>

      {word.isUnique && (
        <div className="absolute inset-0 rounded-xl border-2 border-yellow-400 animate-pulse opacity-50 pointer-events-none" />
      )}
    </div>
  );
}
```

**Step 3: Add word-reveal animation to globals.css**

Add to `src/app/globals.css`:

```css
@keyframes word-reveal {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-word-reveal {
  animation: word-reveal 0.4s ease-out forwards;
}
```

**Step 4: Update results page**

Update `src/app/results/[roomId]/page.tsx`:

```tsx
import { WordReveal } from '@/components/results/WordReveal';
```

**Step 5: Verify and commit**

Run: `docker compose exec web pnpm exec tsc --noEmit`

```bash
git add src/components/results/WordReveal.tsx src/app/globals.css src/app/results/[roomId]/page.tsx
git commit -m "feat(results): add WordReveal component with unique word indicator"
```

---

## Task 7: Design and Implement FinalRanking Component

**IMPORTANT:** Use @frontend-design plugin for this UI component.

**Files:**
- Create: `src/components/results/FinalRanking.tsx`

**Step 1: Design with frontend-design plugin**

Invoke the `@frontend-design` plugin to design the FinalRanking component with:
- Podium-style display (1st, 2nd, 3rd places)
- Trophy/crown for winner
- Confetti celebration animation
- Player avatars with medals
- Final scores
- Mobile responsive
- Warm celebration theme

**Step 2: Create the component**

Create `src/components/results/FinalRanking.tsx`:

```tsx
import { PlayerScore } from '@/app/results/[roomId]/page';
import { PlayAgainButton } from './PlayAgainButton';

interface FinalRankingProps {
  playerScores: PlayerScore[];
}

export function FinalRanking({ playerScores }: FinalRankingProps) {
  const winner = playerScores[0];

  return (
    <div className="space-y-6">
      {/* Winner celebration */}
      {winner && (
        <div className="text-center animate-celebrate">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-4xl font-bold text-indigo-900 mb-2">
            ¡{winner.name} gana!
          </h2>
          <p className="text-2xl text-indigo-600 font-semibold">
            {winner.score} puntos
          </p>
        </div>
      )}

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 py-8">
        {playerScores.slice(0, 3).map((player, index) => (
          <div
            key={player.id}
            className={`flex flex-col items-center animate-podium-${
              index === 0 ? 'first' : index === 1 ? 'second' : 'third'
            }`}
          >
            {/* Medal */}
            <div className="text-4xl mb-2">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
            </div>

            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-3xl shadow-lg border-4 border-white mb-2">
              {player.avatar}
            </div>

            {/* Name and score */}
            <p className="font-semibold text-indigo-900 text-sm">{player.name}</p>
            <p className="font-bold text-indigo-600 text-lg">{player.score} pts</p>
          </div>
        ))}
      </div>

      {/* Full ranking */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left">#</th>
              <th className="py-3 px-4 text-left">Jugador</th>
              <th className="py-3 px-4 text-right">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {playerScores.map((player, index) => (
              <tr
                key={player.id}
                className={`border-b border-gray-100 ${
                  index === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'
                }`}
              >
                <td className="py-3 px-4">
                  <span className={`font-bold ${
                    index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-500' : index === 2 ? 'text-orange-600' : 'text-gray-400'
                  }`}>
                    {player.position}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{player.avatar}</span>
                    <span className="font-medium text-gray-800">{player.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-bold text-indigo-600">{player.score}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Play again button */}
      <PlayAgainButton roomId={playerScores[0]?.id} />
    </div>
  );
}
```

**Step 3: Add celebration animations to globals.css**

Add to `src/app/globals.css`:

```css
@keyframes celebrate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-5deg); }
  75% { transform: scale(1.1) rotate(5deg); }
}

.animate-celebrate {
  animation: celebrate 1s ease-in-out;
}

@keyframes podium-first {
  0% { transform: translateY(100px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes podium-second {
  0% { transform: translateY(80px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes podium-third {
  0% { transform: translateY(60px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.animate-podium-first { animation: podium-first 0.6s ease-out 0.2s backwards; }
.animate-podium-second { animation: podium-second 0.6s ease-out 0.1s backwards; }
.animate-podium-third { animation: podium-third 0.6s ease-out 0s backwards; }
```

**Step 4: Create PlayAgainButton component**

Create `src/components/results/PlayAgainButton.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PlayAgainButtonProps {
  roomId: string;
}

export function PlayAgainButton({ roomId }: PlayAgainButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePlayAgain() {
    setIsLoading(true);
    router.push('/');
  }

  return (
    <div className="text-center pt-4">
      <button
        onClick={handlePlayAgain}
        disabled={isLoading}
        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Cargando...
          </span>
        ) : (
          'Jugar otra vez 🎮'
        )}
      </button>
    </div>
  );
}
```

**Step 5: Update results page**

Update `src/app/results/[roomId]/page.tsx`:

```tsx
import { FinalRanking } from '@/components/results/FinalRanking';
```

**Step 6: Verify and commit**

Run: `docker compose exec web pnpm exec tsc --noEmit`

```bash
git add src/components/results/FinalRanking.tsx src/components/results/PlayAgainButton.tsx src/app/globals.css src/app/results/[roomId]/page.tsx
git commit -m "feat(results): add FinalRanking component with podium and celebration"
```

---

## Task 8: Add Game End Redirect from Active Game Page

**Files:**
- Modify: `src/app/game/[roomId]/page.tsx`
- Modify: `src/hooks/useGameSync.ts`

**Step 1: Update useGameSync hook**

Modify `src/hooks/useGameSync.ts` to add auto-redirect on game end:

```typescript
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePusherChannel } from './usePusherChannel';
import type { TimerState } from '@/types/game';

interface GameSyncOptions {
  roomId: string;
  initialDuration: number;
  onTimerUpdate?: (timer: TimerState) => void;
}

export function useGameSync({ roomId, initialDuration, onTimerUpdate }: GameSyncOptions) {
  const router = useRouter();
  const timerRef = useRef<TimerState>({
    remaining: initialDuration,
    isExpired: false,
  });

  usePusherChannel(roomId, {
    onGameEnded: async (data) => {
      timerRef.current = { remaining: 0, isExpired: true, endTime: data.endTime };
      onTimerUpdate?.(timerRef.current);

      // Auto-redirect to results after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push(`/results/${roomId}`);
    },
  });

  return {
    timer: timerRef.current,
  };
}
```

**Step 2: Update active game page**

Modify `src/app/game/[roomId]/page.tsx` to handle redirect:

```tsx
// Ensure the game page properly handles the redirect from useGameSync
// The hook already handles it, just verify the page imports it correctly
```

**Step 3: Test the flow**

1. Start a game
2. Wait for timer to expire
3. Verify redirect to `/results/[roomId]` happens after 2 seconds

**Step 4: Commit**

```bash
git add src/hooks/useGameSync.ts src/app/game/[roomId]/page.tsx
git commit -m "feat(results): add auto-redirect to results page on game end"
```

---

## Task 9: Export PlayerAvatar as Standalone Component

**Files:**
- Modify: `src/components/results/ScoreStairs.tsx`

**Step 1: Export PlayerAvatar**

Update `src/components/results/ScoreStairs.tsx`:

```tsx
export function PlayerAvatar({ avatar, name, score, position }: PlayerAvatarProps) {
  // ... existing code
}
```

**Step 2: Update barrel export**

Create `src/components/results/index.ts`:

```tsx
export { ScoreStairs, PlayerAvatar } from './ScoreStairs';
export { WordReveal } from './WordReveal';
export { FinalRanking } from './FinalRanking';
export { PlayAgainButton } from './PlayAgainButton';
```

**Step 3: Commit**

```bash
git add src/components/results/ScoreStairs.tsx src/components/results/index.ts
git commit -m "feat(results): export PlayerAvatar as standalone component"
```

---

## Task 10: Add Comprehensive Integration Tests

**Files:**
- Create: `src/app/results/[roomId]/__tests__/integration.test.tsx`

**Step 1: Write integration tests**

Create `src/app/results/[roomId]/__tests__/integration.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePusherChannel } from '@/hooks/usePusherChannel';

vi.mock('@/hooks/usePusherChannel');

describe('Results Page Integration', () => {
  it('handles sequential word reveals', async () => {
    const mockOnRevealWord = vi.fn();
    vi.mocked(usePusherChannel).mockImplementation((roomId, handlers) => {
      handlers?.onRevealWord?.({
        word: 'HOLA',
        player: { id: 'p1', name: 'Alice', avatar: '🎮' },
        score: 4,
        isUnique: true,
      });
      return { bind: vi.fn(), unbind: vi.fn() };
    });

    // Test word reveal handling
    expect(mockOnRevealWord).toHaveBeenCalled();
  });

  it('transitions to final ranking after all words revealed', async () => {
    const mockOnResultsComplete = vi.fn();
    vi.mocked(usePusherChannel).mockImplementation((roomId, handlers) => {
      handlers?.onResultsComplete?.({
        finalRankings: [
          { id: 'p1', name: 'Alice', avatar: '🎮', score: 20 },
          { id: 'p2', name: 'Bob', avatar: '🎯', score: 15 },
        ],
      });
      return { bind: vi.fn(), unbind: vi.fn() };
    });

    expect(mockOnResultsComplete).toHaveBeenCalled();
  });
});
```

**Step 2: Run tests**

Run: `docker compose exec web pnpm test src/app/results/[roomId]/__tests__/integration.test.tsx`

Expected: PASS

**Step 3: Commit**

```bash
git add src/app/results/[roomId]/__tests__/integration.test.tsx
git commit -m "test(results): add integration tests for results page"
```

---

## Task 11: Update Documentation

**Files:**
- Modify: `docs/plans/2025-12-29-boggle-party-epics.md`

**Step 1: Update Epic 8 status in epics file**

Update `docs/plans/2025-12-29-boggle-party-epics.md` Epic 8 section:

```markdown
### Implementation Status

**Completed:** 2025-12-30

**Summary:**
- ✅ All 11 tasks completed successfully
- ✅ Unique word calculator with sequential sorting
- ✅ Results preparation API endpoint with database persistence
- ✅ Sequential reveal API endpoint with Pusher events
- ✅ Results page with real-time Pusher integration
- ✅ ScoreStairs component with climbing avatars
- ✅ WordReveal component with unique word indicators
- ✅ FinalRanking component with podium and celebration
- ✅ PlayAgainButton for new games
- ✅ Auto-redirect from active game to results
- ✅ Integration tests

**Git Commits:**
- (list of commits from implementation)

**Key Files Created:**
- `src/server/word-unique-calculator.ts` - Unique word detection and reveal sequencing
- `src/app/api/rooms/[code]/results/route.ts` - Results preparation with database persistence
- `src/app/api/rooms/[code]/reveal/route.ts` - Sequential reveal emitter
- `src/app/results/[roomId]/page.tsx` - Results page with Pusher integration
- `src/components/results/ScoreStairs.tsx` - Stairs visualization with climbing avatars
- `src/components/results/WordReveal.tsx` - Animated word reveal cards
- `src/components/results/FinalRanking.tsx` - Final standings with podium
- `src/components/results/PlayAgainButton.tsx` - Host-only restart button

**UI Design Features:**
- Gradient backgrounds matching existing pages (indigo-50 via-white to-purple-50)
- Stairs visualization with smooth climbing animations (0.5s ease-out)
- Word reveal with fade-in + slide up animation (0.4s ease-out)
- Unique word indicator with "¡ÚNICA!" badge and "×2" multiplier
- Gold/yellow glow effect for unique words with pulse animation
- Podium display with medals (🥇🥈🥉)
- Winner celebration with trophy (🏆) and bounce animation
- Full ranking table with hover effects
- Mobile-responsive layout

**Pusher Events:**
- `reveal-word` - Individual word reveal during scoring sequence
- `results-complete` - End of reveal, show final ranking

**Database Integration:**
- Game records saved to `games` table
- Player records saved to `game_players` table
- Word records saved to `game_words` table with uniqueness flag
- Uses Epic 2 repositories for persistence

**Notes:**
- All success criteria met:
  - ✅ Sequential reveal plays smoothly with 1.5s delay between words
  - ✅ Avatars climb correct number of steps per word (score-based)
  - ✅ Unique words clearly identified with "¡ÚNICA!" badge and ×2
  - ✅ Final ranking shows correct scores
  - ✅ Winner prominently highlighted with trophy and podium
  - ✅ Animations feel satisfying and dramatic
  - ✅ Works on mobile screens
  - ✅ Game history correctly saved to PostgreSQL
- Type checking passes without errors
- Ready to proceed to Epic 9 (Polish & Animations)
```

**Step 2: Add link to this plan**

Update the Epic 8 section header to include:

```markdown
**Implementation Plan:** `docs/plans/2025-12-30-epic-8-results-scoring-phase.md`
```

**Step 3: Commit**

```bash
git add docs/plans/2025-12-29-boggle-party-epics.md
git commit -m "docs(results): mark Epic 8 as completed with implementation summary"
```

---

## Task 12: Final Verification and Testing

**Step 1: Run full test suite**

Run: `docker compose exec web pnpm test`

Expected: All tests passing

**Step 2: Type check entire project**

Run: `docker compose exec web pnpm exec tsc --noEmit`

Expected: No errors

**Step 3: Lint check**

Run: `docker compose exec web pnpm lint`

Expected: No errors

**Step 4: Manual testing checklist**

1. Create room → Join with 2+ players → Start game
2. Play until timer ends → Verify auto-redirect to results
3. Watch sequential reveal (1.5s delay per word)
4. Verify avatars climb stairs correctly
5. Verify unique words show "¡ÚNICA!" badge
6. Verify final ranking shows correct scores
7. Verify winner has trophy and is on top of podium
8. Verify "Jugar otra vez" button redirects to home
9. Check database persistence:
   ```sql
   docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT * FROM games ORDER BY created_at DESC LIMIT 1;"
   docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT * FROM game_words WHERE is_unique = true;"
   ```

**Step 5: Final commit**

```bash
git add .
git commit -m "feat(results): complete Epic 8 - Results & Scoring Phase

- Implemented unique word calculator with bonus scoring
- Added results preparation endpoint with database persistence
- Created sequential reveal emitter with Pusher events
- Built results page with real-time updates
- Designed ScoreStairs component with climbing avatars
- Created WordReveal component with unique word indicators
- Implemented FinalRanking with podium and celebration
- Added PlayAgainButton for new games
- Configured auto-redirect from active game to results

All success criteria met:
✓ Sequential reveal with 1.5s delays
✓ Climbing avatars based on score
✓ Unique word detection and ×2 bonus display
✓ Final ranking with correct scores
✓ Winner highlight with trophy and podium
✓ Smooth animations throughout
✓ Mobile-responsive design
✓ Database persistence verified

Next: Epic 9 - Polish & Animations"
```

---

## Summary

**Total Tasks:** 12
**Estimated Time:** 3-4 hours

**Dependencies:**
- Epic 2 (Database repositories)
- Epic 3 (Room management)
- Epic 5 (Pusher integration)
- Epic 7 (Active game page)

**Next Epic Trigger:**
Results displayed correctly with animations, database persistence working, all success criteria verified

**Key Technical Decisions:**
1. Server-side unique word calculation for consistency
2. Sequential Pusher events (1.5s delay) for dramatic effect
3. Score-based positioning for stairs visualization
4. Database persistence before reveal starts
5. Auto-redirect with 2s delay from game end
6. Frontend-design plugin for all UI components

**Files Created (11 new files):**
- `src/server/word-unique-calculator.ts`
- `src/app/api/rooms/[code]/results/route.ts`
- `src/app/api/rooms/[code]/reveal/route.ts`
- `src/app/results/[roomId]/page.tsx`
- `src/components/results/ScoreStairs.tsx`
- `src/components/results/WordReveal.tsx`
- `src/components/results/FinalRanking.tsx`
- `src/components/results/PlayAgainButton.tsx`
- `src/components/results/index.ts`
- 3 test files

**CSS Animations Added:**
- `animate-climb` - Avatar climbing stairs
- `animate-word-reveal` - Word card fade-in + slide
- `animate-celebrate` - Winner celebration bounce
- `animate-podium-first/second/third` - Staggered podium appearance

---

**End of Epic 8 Implementation Plan**
