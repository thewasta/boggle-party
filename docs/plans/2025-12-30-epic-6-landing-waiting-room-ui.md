# Epic 6: Landing & Waiting Room UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build landing page and waiting room with real-time player list for Boggle Party multiplayer game

**Architecture:** Client-side forms call existing Next.js API routes (`/api/rooms` for create, `/api/rooms/[code]/join` for join). Waiting room uses `usePusherChannel` hook for real-time player updates. UI components use Tailwind CSS v4. All UI design MUST use @frontend-design plugin.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4, Pusher Channels, React Compiler

---

## Prerequisites

**Required context files:**
- `src/server/types.ts` - Player, Room, RoomStateDTO, Pusher event types
- `src/hooks/usePusherChannel.ts` - Pusher subscription hook
- `src/lib/pusher.ts` - Pusher client utilities
- `src/app/api/rooms/route.ts` - POST endpoint for room creation
- `src/app/api/rooms/[code]/join/route.ts` - POST endpoint for joining
- `src/app/api/rooms/[code]/start/route.ts` - POST endpoint for starting game
- `src/server/api-utils.ts` - getDefaultAvatar function (emoji selection)

**API Endpoints available:**
- `POST /api/rooms` - Create room (body: `{ playerName, avatar?, gridSize? }`)
- `POST /api/rooms/[code]/join` - Join room (body: `{ playerName, avatar? }`)
- `POST /api/rooms/[code]/start` - Start game (body: `{ gridSize }`)
- `GET /api/rooms/[code]` - Get room state

**Pusher Events:**
- `player-joined` - `{ player, totalPlayers }`
- `player-left` - `{ playerId, playerName, totalPlayers }`
- `game-started` - `{ startTime, duration, board }`

---

## Task 1: Create Shared UI Utilities

**Files:**
- Create: `src/lib/utils.ts`

**Step 1: Create utility functions**

This file provides common UI utilities (cn for class merging, copy to clipboard).

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
```

**Step 2: Install missing dependencies**

Run: `pnpm add clsx tailwind-merge`
Expected: Package installed successfully

**Step 3: Commit**

```bash
git add src/lib/utils.ts package.json pnpm-lock.yaml
git commit -m "feat: add UI utility functions (cn, copyToClipboard)"
```

---

## Task 2: Update Root Layout Metadata

**Files:**
- Modify: `src/app/layout.tsx:15-18`

**Step 1: Update metadata**

Change generic Next.js metadata to Boggle Party branding.

```typescript
export const metadata: Metadata = {
  title: "Boggle Party - Juego de palabras multijugador",
  description: "Juego de Boggle en español en tiempo real. Únete a una sala y encuentra las palabras ocultas antes de que se acabe el tiempo.",
};
```

**Step 2: Verify dev server**

Run: `pnpm dev`
Expected: Server starts on http://localhost:3000

**Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "docs: update app metadata for Boggle Party"
```

---

## Task 3: Create Landing Page UI with @frontend-design

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/landing/CreateRoomForm.tsx`
- Create: `src/components/landing/JoinRoomForm.tsx`

**Step 1: Generate Landing Page Design using @frontend-design**

IMPORTANT: First invoke the frontend-design skill to generate the landing page UI. The skill will create distinctive, production-grade UI that avoids generic AI aesthetics.

**Invoke @frontend-design with prompt:**
```
Create a landing page for "Boggle Party" - a multiplayer word game in Spanish.
The page should have:
- A centered card layout with two main sections: "Crear Sala" (Create Room) and "Unirse a Sala" (Join Room)
- Create Room section: Input for player name, button to create new room
- Join Room section: Input for room code (6 characters), input for player name, button to join
- Modern, playful design with a purple/indigo color scheme
- Clean typography, good use of whitespace
- Mobile responsive (stack vertically on small screens)
- Subtle hover effects on buttons
- Use emoji accents (🎮 🎲 📝)
```

Then use the generated code to create `src/app/page.tsx`.

**Step 2: Create CreateRoomForm component**

```typescript
// src/components/landing/CreateRoomForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface CreateRoomFormProps {
  onCreateRoom?: (roomCode: string, playerId: string) => void;
}

export function CreateRoomForm({ onCreateRoom }: CreateRoomFormProps) {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Error al crear sala');
          return;
        }

        if (onCreateRoom) {
          onCreateRoom(data.room.code, data.playerId);
        } else {
          router.push(`/room/${data.room.code}?playerId=${data.playerId}`);
        }
      } catch {
        setError('Error de conexión');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Tu nombre"
          maxLength={20}
          disabled={isPending}
          className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Creando...' : 'Crear Sala'}
      </button>
    </form>
  );
}
```

**Step 3: Create JoinRoomForm component**

```typescript
// src/components/landing/JoinRoomForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface JoinRoomFormProps {
  onJoinRoom?: (roomCode: string, playerId: string) => void;
}

export function JoinRoomForm({ onJoinRoom }: JoinRoomFormProps) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Código de sala inválido (6 caracteres)');
      return;
    }

    if (!playerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/rooms/${roomCode.toUpperCase()}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Error al unirse');
          return;
        }

        if (onJoinRoom) {
          onJoinRoom(roomCode.toUpperCase(), data.playerId);
        } else {
          router.push(`/room/${roomCode.toUpperCase()}?playerId=${data.playerId}`);
        }
      } catch {
        setError('Error de conexión');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Código de sala"
          maxLength={6}
          disabled={isPending}
          className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 uppercase text-center tracking-widest text-lg"
        />
      </div>
      <div>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Tu nombre"
          maxLength={20}
          disabled={isPending}
          className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Uniéndose...' : 'Unirse a Sala'}
      </button>
    </form>
  );
}
```

**Step 4: Update page.tsx with generated design**

Replace entire content of `src/app/page.tsx` with the frontend-design generated code, integrating the form components above.

**Step 5: Test landing page manually**

Run: `pnpm dev`
Expected: Landing page loads at http://localhost:3000 with two forms

**Step 6: Commit**

```bash
git add src/app/page.tsx src/components/landing/CreateRoomForm.tsx src/components/landing/JoinRoomForm.tsx
git commit -m "feat: add landing page with create/join room forms"
```

---

## Task 4: Create Waiting Room Page Structure

**Files:**
- Create: `src/app/room/[code]/page.tsx`

**Step 1: Create waiting room page scaffold**

```typescript
// src/app/room/[code]/page.tsx
import { redirect } from 'next/navigation';
import type { RouteParams } from '@/server/types';

interface WaitingRoomPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ playerId?: string }>;
}

export default async function WaitingRoomPage({
  params,
  searchParams,
}: WaitingRoomPageProps) {
  const { code } = await params;
  const { playerId } = await searchParams;

  if (!playerId) {
    redirect('/');
  }

  // Fetch room state server-side for initial render
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/rooms/${code}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    redirect('/');
  }

  const data = await response.json();

  return (
    <WaitingRoomClient
      roomCode={code}
      roomId={data.room.id}
      initialPlayers={data.room.players}
      initialHost={data.room.host}
      initialGridSize={data.room.gridSize}
      initialStatus={data.room.status}
      currentPlayerId={playerId}
    />
  );
}

// Client component will be created in next task
function WaitingRoomClient(props: {
  roomCode: string;
  roomId: string;
  initialPlayers: Array<{ id: string; name: string; avatar: string; isHost: boolean }>;
  initialHost: { id: string };
  initialGridSize: number;
  initialStatus: string;
  currentPlayerId: string;
}) {
  return <div>Waiting Room: {props.roomCode}</div>;
}
```

**Step 2: Test page loads**

Run: `pnpm dev`
Visit: http://localhost:3000/room/TEST01?playerId=123
Expected: Page renders without error (may show "Room not found" if test room doesn't exist)

**Step 3: Commit**

```bash
git add src/app/room/[code]/page.tsx
git commit -m "feat: add waiting room page scaffold"
```

---

## Task 5: Create Waiting Room Components with @frontend-design

**Files:**
- Create: `src/components/waiting-room/RoomCodeDisplay.tsx`
- Create: `src/components/waiting-room/PlayerList.tsx`
- Create: `src/components/waiting-room/GridSizeSelector.tsx`
- Create: `src/components/waiting-room/StartGameButton.tsx`

**Step 1: Generate Waiting Room Design using @frontend-design**

Invoke @frontend-design with prompt:
```
Create a waiting room component for "Boggle Party" game. The waiting room should show:
- Large room code display at the top (6 characters) with a copy button
- Player list section showing all connected players with avatars, names, and host badge
- Grid size selector (radio buttons or card selector) for 4×4, 5×5, 6×6 - only visible to host
- Start game button - only visible to host, disabled if less than 2 players
- Player count indicator (e.g., "3/8 players")
- Modern purple/indigo theme matching the landing page
- Card-based layout with subtle shadows
- Smooth transitions for player additions/removals
```

**Step 2: Create RoomCodeDisplay component**

```typescript
// src/components/waiting-room/RoomCodeDisplay.tsx
'use client';

import { useState } from 'react';
import { copyToClipboard } from '@/lib/utils';

interface RoomCodeDisplayProps {
  roomCode: string;
}

export function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(roomCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Comparte este código con tus amigos
      </p>
      <div className="flex items-center gap-3">
        <code className="text-4xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
          {roomCode}
        </code>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Copiar código"
        >
          {copied ? (
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
      {copied && (
        <p className="text-sm text-green-600 dark:text-green-400">¡Copiado!</p>
      )}
    </div>
  );
}
```

**Step 3: Create PlayerList component**

```typescript
// src/components/waiting-room/PlayerList.tsx
'use client';

import type { Player } from '@/server/types';

interface PlayerListProps {
  players: Player[];
  hostId: string;
  maxPlayers?: number;
}

export function PlayerList({ players, hostId, maxPlayers = 8 }: PlayerListProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Jugadores
        </h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {players.length}/{maxPlayers}
        </span>
      </div>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800"
          >
            <span className="text-3xl">{player.avatar}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100 flex-1">
              {player.name}
            </span>
            {player.id === hostId && (
              <span className="px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-full">
                Anfitrión
              </span>
            )}
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
            Esperando jugadores...
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Create GridSizeSelector component**

```typescript
// src/components/waiting-room/GridSizeSelector.tsx
'use client';

import type { GridSize } from '@/server/db/schema';

interface GridSizeSelectorProps {
  value: GridSize;
  onChange: (size: GridSize) => void;
  disabled?: boolean;
}

const GRID_OPTIONS: Array<{ value: GridSize; label: string; description: string }> = [
  { value: 4, label: '4 × 4', description: '2 minutos' },
  { value: 5, label: '5 × 5', description: '3 minutos' },
  { value: 6, label: '6 × 6', description: '6 minutos' },
];

export function GridSizeSelector({ value, onChange, disabled }: GridSizeSelectorProps) {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Tamaño del tablero
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {GRID_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${value === option.value
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {option.label}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {option.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 5: Create StartGameButton component**

```typescript
// src/components/waiting-room/StartGameButton.tsx
'use client';

interface StartGameButtonProps {
  playerCount: number;
  onStartGame: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function StartGameButton({
  playerCount,
  onStartGame,
  disabled,
  isLoading,
}: StartGameButtonProps) {
  const minPlayers = 2;
  const cantStartReason = playerCount < minPlayers
    ? `Mínimo ${minPlayers} jugadores`
    : null;

  return (
    <button
      onClick={onStartGame}
      disabled={disabled || isLoading || !!cantStartReason}
      className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-700 text-white font-bold text-lg rounded-lg transition-colors disabled:cursor-not-allowed"
    >
      {isLoading ? 'Iniciando...' : cantStartReason || '¡Empezar Juego!'}
    </button>
  );
}
```

**Step 6: Test components individually**

Run: `pnpm dev`
Expected: All components compile without errors

**Step 7: Commit**

```bash
git add src/components/waiting-room/
git commit -m "feat: add waiting room components"
```

---

## Task 6: Create Waiting Room Client Component with Pusher Integration

**Files:**
- Modify: `src/app/room/[code]/page.tsx` (replace WaitingRoomClient implementation)

**Step 1: Replace WaitingRoomClient with full implementation**

```typescript
// In src/app/room/[code]/page.tsx, replace the WaitingRoomClient function:

'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { usePusherChannel } from '@/hooks/usePusherChannel';
import type { Player, GridSize } from '@/server/types';
import { RoomCodeDisplay } from '@/components/waiting-room/RoomCodeDisplay';
import { PlayerList } from '@/components/waiting-room/PlayerList';
import { GridSizeSelector } from '@/components/waiting-room/GridSizeSelector';
import { StartGameButton } from '@/components/waiting-room/StartGameButton';

function WaitingRoomClient(props: {
  roomCode: string;
  roomId: string;
  initialPlayers: Array<{ id: string; name: string; avatar: string; isHost: boolean; score: number; foundWords: string[] }>;
  initialHost: { id: string };
  initialGridSize: GridSize;
  initialStatus: string;
  currentPlayerId: string;
}) {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>(props.initialPlayers);
  const [gridSize, setGridSize] = useState<GridSize>(props.initialGridSize);
  const [status, setStatus] = useState(props.initialStatus);
  const [isStarting, setIsStarting] = useTransition();

  const isHost = props.currentPlayerId === props.initialHost.id;

  // Redirect to game page when game starts
  useEffect(() => {
    if (status === 'playing') {
      router.push(`/game/${props.roomCode}?playerId=${props.currentPlayerId}`);
    }
  }, [status, props.roomCode, props.currentPlayerId, router]);

  // Subscribe to Pusher events
  usePusherChannel(props.roomId, {
    onPlayerJoined: (data) => {
      setPlayers((prev) => {
        const exists = prev.some((p) => p.id === data.player.id);
        if (exists) return prev;
        return [...prev, data.player as Player];
      });
    },
    onPlayerLeft: (data) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    },
    onGameStarted: () => {
      setStatus('playing');
    },
  });

  const handleStartGame = async () => {
    if (players.length < 2) return;

    setIsStarting(async () => {
      try {
        const response = await fetch(`/api/rooms/${props.roomCode}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gridSize }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('Failed to start game:', data.error);
        }
      } catch (error) {
        console.error('Error starting game:', error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Sala de Espera
            </h1>
            <RoomCodeDisplay roomCode={props.roomCode} />
          </div>

          {/* Player List */}
          <PlayerList
            players={players}
            hostId={props.initialHost.id}
            maxPlayers={8}
          />

          {/* Host Controls */}
          {isHost && status === 'waiting' && (
            <div className="space-y-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <GridSizeSelector
                value={gridSize}
                onChange={setGridSize}
                disabled={status !== 'waiting'}
              />
              <StartGameButton
                playerCount={players.length}
                onStartGame={handleStartGame}
                disabled={status !== 'waiting'}
                isLoading={isStarting}
              />
            </div>
          )}

          {/* Non-host waiting message */}
          {!isHost && status === 'waiting' && (
            <div className="text-center py-6 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-zinc-600 dark:text-zinc-400">
                Esperando a que el anfitrión inicie el juego...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Test waiting room flow**

Run: `pnpm dev`
1. Create a room from landing page
2. Verify redirect to waiting room
3. Check room code displays
4. Verify host sees grid selector and start button
5. Verify start button is disabled with < 2 players

**Step 3: Test multi-player flow (open second browser)**

1. Join room with second player from different browser/incognito
2. Verify player list updates in real-time via Pusher
3. Verify player count updates
4. Verify host can now start game

**Step 4: Commit**

```bash
git add src/app/room/[code]/page.tsx
git commit -m "feat: implement waiting room with Pusher real-time updates"
```

---

## Task 7: Add Error Handling and Edge Cases

**Files:**
- Modify: `src/app/room/[code]/page.tsx`

**Step 1: Add error state handling**

Update the WaitingRoomClient component to handle errors gracefully:

```typescript
// Add to WaitingRoomClient component state:
const [error, setError] = useState<string | null>(null);

// Add error boundary effect:
useEffect(() => {
  if (props.initialStatus === 'playing') {
    setError('El juego ya empezó');
    setTimeout(() => {
      router.push(`/game/${props.roomCode}?playerId=${props.currentPlayerId}`);
    }, 2000);
  }
}, [props.initialStatus, props.roomCode, props.currentPlayerId, router]);

// Add error display in JSX:
{error && (
  <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
    {error}
  </div>
)}
```

**Step 2: Test error cases**

1. Try to join a non-existent room
2. Try to join an already-started game
3. Try to join with 8+ players (if possible)

**Step 3: Commit**

```bash
git add src/app/room/[code]/page.tsx
git commit -m "feat: add error handling for edge cases"
```

---

## Task 8: Mobile Responsiveness Testing

**Files:**
- No files created/modified - testing only

**Step 1: Test on mobile viewports**

Run: `pnpm dev`
Test at viewport widths:
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (tablet)

Verify:
- Forms stack vertically on small screens
- Text remains readable
- Buttons remain tappable (min 44px height)
- Room code doesn't overflow

**Step 2: Fix any responsiveness issues**

If issues found, update component styles with appropriate Tailwind breakpoints.

**Step 3: Commit if changes made**

```bash
git add -A
git commit -m "fix: improve mobile responsiveness"
```

---

## Task 9: Final Testing and Verification

**Files:**
- None - verification only

**Step 1: Verify all success criteria**

Checklist:
- [x] Can create room and redirect to waiting room
- [x] Can join room with code and see waiting room
- [x] Player list updates in real-time when players join/leave
- [x] Only host sees grid selector and start button
- [x] Cannot start game with < 2 players
- [x] Copy to clipboard works for room code
- [x] Mobile-responsive layout

**Step 2: Run linter**

Run: `pnpm lint`
Expected: No errors

**Step 3: Build production bundle**

Run: `pnpm build`
Expected: Build succeeds without errors

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Epic 6 - Landing & Waiting Room UI"
```

---

## Next Epic Trigger

**Epic 7 can begin when:**
- Players can create/join rooms via landing page
- Players gather in waiting room with real-time updates
- Host can select grid size and start game
- Game transitions to playing state (Epic 7 will build the game board UI)

**Files to reference for Epic 7:**
- `src/app/room/[code]/page.tsx` - Contains router.push to `/game/[code]` route (to be built)
- `src/hooks/usePusherChannel.ts` - Will be used for game events
- `src/server/types.ts` - GameStartedEvent contains board data needed for game UI
