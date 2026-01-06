# WebSocket Migration: Replace Pusher with Socket.io

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **IMPORTANT:** During implementation, you MUST use the `@websocket-implementation` skill for all WebSocket-related tasks. This skill provides specialized knowledge for Socket.io implementation, real-time event handling, and WebSocket architecture patterns.

**Goal:** Replace Pusher Channels with self-hosted Socket.io server for real-time game events, eliminating external service dependency and 200K daily event limit.

**Architecture:** Hybrid approach - separate WebSocket server container that Next.js communicates with via HTTP. Clients connect directly to WebSocket server. No Redis initially (can add later for horizontal scaling).

**Tech Stack:** Socket.io v4 (server + client), Express.js (internal API), Docker Compose, TypeScript 5, Zod (validation)

---

## Prerequisites

**Existing Code to Understand:**
- `src/server/pusher-client.ts` - Current Pusher singleton with `triggerEvent()` function
- `src/server/event-emitter.ts` - Typed event emitters (`emitPlayerJoined`, etc.)
- `src/lib/pusher.ts` - Frontend Pusher client singleton and utilities
- `src/hooks/usePusherChannel.ts` - React hook for subscribing to Pusher channels
- `src/server/types.ts` - Event type definitions (PlayerJoinedEvent, etc.)
- `docker-compose.yml` - Current Docker setup

**Key Dependencies to Add:**
- `socket.io` - WebSocket server (new)
- `socket.io-client` - WebSocket client (replaces pusher-js)
- `express` - HTTP server for internal API (new)
- `zod` - Event payload validation (already in project)

**New Environment Variables:**
```bash
# WebSocket server URLs
WS_HTTP_URL=http://websocket:3001           # Internal (Next.js → WebSocket)
NEXT_PUBLIC_WS_URL=ws://localhost:3002     # Public (client → WebSocket)
CORS_ORIGIN=http://localhost:3000          # CORS for WebSocket
```

**Required Skill:**
- **@websocket-implementation** - MUST be used for all WebSocket server implementation, Socket.io configuration, event handling, and real-time architecture tasks. This skill provides expertise in WebSocket patterns, connection management, and scalable real-time systems.

---

## Migration Strategy

**Phase 1: WebSocket Server** (Tasks 1-7)
- Build standalone Socket.io server with internal HTTP API
- Docker container with health check
- **Use @websocket-implementation skill**

**Phase 2: Next.js Integration** (Tasks 8-14)
- Replace Pusher client with WebSocket client
- Update event emitters to call WebSocket HTTP API
- Update React hooks to use Socket.io client
- **Use @websocket-implementation skill for integration tasks**

**Phase 3: Testing & Cleanup** (Tasks 15-18)
- End-to-end testing
- Remove Pusher dependencies
- Update documentation

---

## Phase 1: WebSocket Server

### Task 1: Create WebSocket Server Directory Structure

**Skill Required:** @websocket-implementation

**Files:**
- Create: `websocket-server/package.json`
- Create: `websocket-server/tsconfig.json`
- Create: `websocket-server/src/index.ts`

**Step 1: Create package.json**

```bash
mkdir -p websocket-server/src
```

Create `websocket-server/package.json`:
```json
{
  "name": "boggle-websocket-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "socket.io": "^4.7.5",
    "express": "^4.19.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.9",
    "tsup": "^8.2.0",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3"
  }
}
```

**Step 2: Create tsconfig.json**

Create `websocket-server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create entry point**

Create `websocket-server/src/index.ts`:
```typescript
import { createHttpServer } from './http.js';
import { createWebSocketServer, getIo } from './websocket.js';

const HTTP_PORT = parseInt(process.env.HTTP_PORT ?? '3001', 10);
const WS_PORT = parseInt(process.env.PORT ?? '3002', 10);

// Start HTTP API server (internal, for Next.js)
const httpServer = createHttpServer();
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`HTTP API listening on port ${HTTP_PORT}`);
});

// Start WebSocket server (public, for clients)
const wsServer = createWebSocketServer(WS_PORT);
wsServer.listen(WS_PORT, '0.0.0.0', () => {
  console.log(`WebSocket server listening on port ${WS_PORT}`);
});

// Export io instance for HTTP server to use
export { getIo };
```

**Step 4: Verify structure**

Run: `ls -la websocket-server/`
Expected: `package.json`, `tsconfig.json`, `src/` directory

**Step 5: Commit**

```bash
git add websocket-server/
git commit -m "feat(wss): create websocket server directory structure"
```

---

### Task 2: Create WebSocket Server Module

**Skill Required:** @websocket-implementation

**Files:**
- Create: `websocket-server/src/websocket.ts`

**Step 1: Create websocket.ts**

Create `websocket-server/src/websocket.ts`:
```typescript
import { Server, type Socket } from 'socket.io';
import { createServer } from 'http';
import { getCorsOrigin } from './config.js';

let io: Server | null = null;

export interface SocketServerConfig {
  port: number;
  corsOrigin: string;
}

/**
 * Get the Socket.io server instance
 * @throws Error if server not initialized
 */
export function getIo(): Server {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
}

/**
 * Create and configure the WebSocket server
 */
export function createWebSocketServer(port: number): ReturnType<typeof createServer> {
  const httpServer = createServer();
  const corsOrigin = getCorsOrigin();

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Handle client connections
  io.on('connection', (socket: Socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // Join a game room
    socket.on('join-room', (roomCode: string) => {
      const roomName = `game-${roomCode}`;
      socket.join(roomName);
      console.log(`[WS] Socket ${socket.id} joined room: ${roomName}`);
    });

    // Leave a game room
    socket.on('leave-room', (roomCode: string) => {
      const roomName = `game-${roomCode}`;
      socket.leave(roomName);
      console.log(`[WS] Socket ${socket.id} left room: ${roomName}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  return httpServer;
}
```

**Step 2: Run type check**

Run: `cd websocket-server && pnpm type-check`
Expected: No errors (may fail if config.ts doesn't exist yet)

**Step 3: Commit**

```bash
git add websocket-server/src/websocket.ts
git commit -m "feat(wss): create websocket server with room management"
```

---

### Task 3: Create Configuration Module

**Skill Required:** @websocket-implementation

**Files:**
- Create: `websocket-server/src/config.ts`

**Step 1: Create config.ts**

Create `websocket-server/src/config.ts`:
```typescript
/**
 * Get CORS origin from environment variable
 * Defaults to wildcard for development
 */
export function getCorsOrigin(): string {
  const origin = process.env.CORS_ORIGIN;
  if (origin) {
    return origin;
  }
  // Default: allow all origins in development
  return '*';
}

/**
 * Get HTTP port for internal API
 */
export function getHttpPort(): number {
  return parseInt(process.env.HTTP_PORT ?? '3001', 10);
}

/**
 * Get WebSocket port for public connections
 */
export function getWsPort(): number {
  return parseInt(process.env.PORT ?? '3002', 10);
}
```

**Step 2: Run type check**

Run: `cd websocket-server && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add websocket-server/src/config.ts
git commit -m "feat(wss): add configuration module"
```

---

### Task 4: Create Event Types and Validation

**Skill Required:** @websocket-implementation

**Files:**
- Create: `websocket-server/src/types.ts`

**Step 1: Create types.ts**

Create `websocket-server/src/types.ts`:
```typescript
import { z } from 'zod';

// =========================================================================
// Event Name Constants
// =========================================================================

export const SOCKET_EVENTS = {
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  GAME_STARTED: 'game-started',
  GAME_ENDED: 'game-ended',
  ROOM_CLOSED: 'room-closed',
  WORD_FOUND: 'word-found',
  REVEAL_WORD: 'reveal-word',
  RESULTS_COMPLETE: 'results-complete',
  REMATCH_REQUESTED: 'rematch-requested',
} as const;

// =========================================================================
// Event Payload Schemas (Zod)
// =========================================================================

/**
 * Player schema
 */
export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  isHost: z.boolean(),
  score: z.number(),
  foundWords: z.array(z.object({
    word: z.string(),
    score: z.number(),
    timestamp: z.number(),
  })),
  createdAt: z.coerce.date(),
});

/**
 * Player joined event payload
 */
export const PlayerJoinedEventSchema = z.object({
  player: PlayerSchema,
  totalPlayers: z.number(),
});

/**
 * Player left event payload
 */
export const PlayerLeftEventSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  totalPlayers: z.number(),
});

/**
 * Game started event payload
 */
export const GameStartedEventSchema = z.object({
  startTime: z.number(),
  duration: z.number(),
  board: z.array(z.array(z.string())),
});

/**
 * Game ended event payload
 */
export const GameEndedEventSchema = z.object({
  endTime: z.number(),
});

/**
 * Word found event payload
 */
export const WordFoundEventSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  word: z.string(),
  score: z.number(),
  isUnique: z.boolean(),
});

/**
 * Reveal word event payload
 */
export const RevealWordEventSchema = z.object({
  word: z.string(),
  player: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string(),
  }),
  score: z.number(),
  isUnique: z.boolean(),
});

/**
 * Results complete event payload
 */
export const ResultsCompleteEventSchema = z.object({
  finalRankings: z.array(z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string(),
    score: z.number(),
  })),
});

/**
 * Rematch requested event payload
 */
export const RematchRequestedEventSchema = z.object({
  requestedBy: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

/**
 * Room closed event payload
 */
export const RoomClosedEventSchema = z.object({
  reason: z.string(),
  message: z.string(),
});

// =========================================================================
// HTTP API Types
// =========================================================================

/**
 * Emit event request from Next.js
 */
export const EmitRequestSchema = z.object({
  channel: z.string(),
  event: z.string(),
  data: z.any(),
});

/**
 * Emit event response
 */
export interface EmitResponse {
  success: true;
  deliveredTo: number;
}
```

**Step 2: Run type check**

Run: `cd websocket-server && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add websocket-server/src/types.ts
git commit -m "feat(wss): add event types and zod validation schemas"
```

---

### Task 5: Create HTTP API Server

**Skill Required:** @websocket-implementation

**Files:**
- Create: `websocket-server/src/http.ts`

**Step 1: Create http.ts**

Create `websocket-server/src/http.ts`:
```typescript
import express, { type Request, type Response } from 'express';
import { getIo } from './websocket.js';
import {
  EmitRequestSchema,
  PlayerJoinedEventSchema,
  PlayerLeftEventSchema,
  GameStartedEventSchema,
  GameEndedEventSchema,
  WordFoundEventSchema,
  RevealWordEventSchema,
  ResultsCompleteEventSchema,
  RematchRequestedEventSchema,
  RoomClosedEventSchema,
  SOCKET_EVENTS,
} from './types.js';

const app = express();

// Parse JSON body
app.use(express.json());

/**
 * POST /emit - Emit an event to a room/channel
 * Called by Next.js to broadcast events to connected clients
 */
app.post('/emit', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = EmitRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: result.error.errors,
      });
    }

    const { channel, event, data } = result.data;
    const io = getIo();

    // Validate event data based on event type
    try {
      switch (event) {
        case SOCKET_EVENTS.PLAYER_JOINED:
          PlayerJoinedEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.PLAYER_LEFT:
          PlayerLeftEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.GAME_STARTED:
          GameStartedEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.GAME_ENDED:
          GameEndedEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.WORD_FOUND:
          WordFoundEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.REVEAL_WORD:
          RevealWordEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.RESULTS_COMPLETE:
          ResultsCompleteEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.REMATCH_REQUESTED:
          RematchRequestedEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.ROOM_CLOSED:
          RoomClosedEventSchema.parse(data);
          break;
        default:
          console.warn(`[WS] Unknown event type: ${event}`);
      }
    } catch (validationError) {
      console.error(`[WS] Event validation failed for ${event}:`, validationError);
      return res.status(400).json({
        success: false,
        error: 'Event data validation failed',
      });
    }

    // Get room size
    const room = io.sockets.adapter.rooms.get(channel);
    const roomSize = room?.size ?? 0;

    // Emit event to all clients in the room
    io.to(channel).emit(event, data);

    console.log(`[WS] Emitted "${event}" to "${channel}" (${roomSize} clients)`);

    // Return success with client count
    res.json({
      success: true,
      deliveredTo: roomSize,
    });
  } catch (error) {
    console.error('[WS] Error emitting event:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  const io = getIo();
  const roomCount = io.sockets.adapter.rooms.size;
  const clientCount = io.sockets.sockets.size;

  res.json({
    status: 'healthy',
    rooms: roomCount,
    clients: clientCount,
    timestamp: Date.now(),
  });
});

/**
 * Create and configure the Express HTTP server
 */
export function createHttpServer() {
  return app;
}
```

**Step 2: Run type check**

Run: `cd websocket-server && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add websocket-server/src/http.ts
git commit -m "feat(wss): add http api server for event emission"
```

---

### Task 6: Create Build Configuration

**Skill Required:** @websocket-implementation

**Files:**
- Create: `websocket-server/tsup.config.ts`

**Step 1: Create tsup.config.ts**

Create `websocket-server/tsup.config.ts`:
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2022',
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
});
```

**Step 2: Update index.ts to fix exports**

Check `websocket-server/src/index.ts` - remove the `export { getIo }` line at the bottom (it's not needed for the build).

**Step 3: Test build**

Run: `cd websocket-server && pnpm build`
Expected: `dist/` directory created with `index.js`, `index.js.map`

**Step 4: Commit**

```bash
git add websocket-server/tsup.config.ts
git commit -m "feat(wss): add tsup build configuration"
```

---

### Task 7: Create Dockerfile

**Skill Required:** @websocket-implementation

**Files:**
- Create: `websocket-server/Dockerfile`

**Step 1: Create Dockerfile**

Create `websocket-server/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production

# Expose ports
# 3001: Internal HTTP API (Next.js → WebSocket)
# 3002: Public WebSocket (Client → WebSocket)
EXPOSE 3001 3002

# Run the server
CMD ["node", "dist/index.js"]
```

**Step 2: Add .dockerignore**

Create `websocket-server/.dockerignore`:
```
node_modules
dist
.git
*.log
.env
.DS_Store
```

**Step 3: Commit**

```bash
git add websocket-server/Dockerfile websocket-server/.dockerignore
git commit -m "feat(wss): add dockerfile for containerization"
```

---

## Phase 2: Next.js Integration

### Task 8: Create WebSocket Client Module (Next.js)

**Skill Required:** @websocket-implementation

**Files:**
- Create: `src/lib/socket.ts`

**Step 1: Create socket.ts**

Create `src/lib/socket.ts`:
```typescript
/**
 * Socket.io client utilities for frontend
 * Handles Socket.io instance creation and room management
 */

import { io, type Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

/**
 * Get Socket.io client instance for frontend
 * Returns singleton instance to avoid duplicate connections
 */
export function getSocketClient(): Socket {
  if (socketInstance) {
    return socketInstance;
  }

  const url = process.env.NEXT_PUBLIC_WS_URL;
  if (!url) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_WS_URL');
  }

  socketInstance = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socketInstance;
}

/**
 * Generate room name for a game room
 * @param roomCode - Room code (6-character string like 'JX4XU3')
 * @returns Room name in format 'game-{roomCode}'
 */
export function getRoomChannelName(roomCode: string): string {
  return `game-${roomCode}`;
}

/**
 * Event names for Socket.io rooms
 */
export const SOCKET_EVENTS = {
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  GAME_STARTED: 'game-started',
  GAME_ENDED: 'game-ended',
  ROOM_CLOSED: 'room-closed',
  WORD_FOUND: 'word-found',
  REVEAL_WORD: 'reveal-word',
  RESULTS_COMPLETE: 'results-complete',
  REMATCH_REQUESTED: 'rematch-requested',
} as const;

/**
 * Type for Socket.io event names
 */
export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
```

**Step 2: Install socket.io-client**

Run: `pnpm add socket.io-client`
Expected: package added to dependencies

**Step 3: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/socket.ts package.json pnpm-lock.yaml
git commit -m "feat: add socket.io client utilities"
```

---

### Task 9: Create WebSocket HTTP Client (Next.js Server)

**Skill Required:** @websocket-implementation

**Files:**
- Create: `src/server/websocket-client.ts`

**Step 1: Create websocket-client.ts**

Create `src/server/websocket-client.ts`:
```typescript
/**
 * WebSocket server HTTP client
 * Allows Next.js API routes to emit events via the WebSocket server
 */

const WS_HTTP_URL = process.env.WS_HTTP_URL ?? 'http://localhost:3001';

interface EmitResponse {
  success: true;
  deliveredTo: number;
}

/**
 * Emit an event to a room/channel via the WebSocket server
 * @param channel - Room/channel name (e.g., 'game-ABC123')
 * @param event - Event name (e.g., 'player-joined')
 * @param data - Event payload
 * @returns Response with number of clients the event was delivered to
 */
export async function emitEvent(
  channel: string,
  event: string,
  data: unknown
): Promise<EmitResponse> {
  const response = await fetch(`${WS_HTTP_URL}/emit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, event, data }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to emit event: ${response.statusText} - ${text}`);
  }

  return response.json() as Promise<EmitResponse>;
}
```

**Step 2: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/server/websocket-client.ts
git commit -m "feat: add websocket server http client"
```

---

### Task 10: Update Event Emitters to Use WebSocket

**Skill Required:** @websocket-implementation

**Files:**
- Modify: `src/server/event-emitter.ts`

**Step 1: Update imports**

Replace line 6:
```typescript
import { triggerEvent } from './pusher-client';
```

With:
```typescript
import { emitEvent } from './websocket-client';
```

**Step 2: Update all emit functions**

Replace all occurrences of `triggerEvent` with `emitEvent` (9 occurrences total in the file).

**Step 3: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/server/event-emitter.ts
git commit -m "refactor: update event emitters to use websocket client"
```

---

### Task 11: Create useSocketRoom Hook

**Skill Required:** @websocket-implementation

**Files:**
- Create: `src/hooks/useSocketRoom.ts`

**Step 1: Create useSocketRoom.ts**

Create `src/hooks/useSocketRoom.ts`:
```typescript
/**
 * React hook for subscribing to Socket.io rooms
 * Handles room join/leave, event binding, and automatic cleanup
 */

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocketClient, getRoomChannelName, SOCKET_EVENTS } from '@/lib/socket';

/**
 * Event handlers for Socket.io events
 */
export interface SocketEventHandlers {
  onPlayerJoined?: (data: { player: { id: string; name: string; avatar: string; isHost: boolean; score: number; foundWords: Array<{ word: string; score: number; timestamp: number }> }; totalPlayers: number }) => void;
  onPlayerLeft?: (data: { playerId: string; playerName: string; totalPlayers: number }) => void;
  onGameStarted?: (data: { startTime: number; duration: number; board: string[][] }) => void;
  onGameEnded?: (data: { endTime: number }) => void;
  onRoomClosed?: (data: { reason: string; message: string }) => void;
  onWordFound?: (data: { playerId: string; playerName: string; word: string; score: number; isUnique: boolean }) => void;
  onRevealWord?: (data: { word: string; player: { id: string; name: string; avatar: string }; score: number; isUnique: boolean }) => void;
  onResultsComplete?: (data: { finalRankings: Array<{ id: string; name: string; avatar: string; score: number }> }) => void;
  onRematchRequested?: (data: { requestedBy: { id: string; name: string } }) => void;
}

/**
 * Options for the hook
 */
export interface UseSocketRoomOptions {
  enabled?: boolean;
}

/**
 * Subscribe to a Socket.io room and bind event handlers
 *
 * @param roomCode - Room code (6-character string like 'JX4XU3')
 * @param handlers - Event callback functions
 * @param options - Configuration options
 */
export function useSocketRoom(
  roomCode: string | null,
  handlers: SocketEventHandlers,
  options: UseSocketRoomOptions = {}
): void {
  const { enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref updated without re-subscribing
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled || !roomCode) {
      return;
    }

    let socket: Socket | null = null;

    try {
      // Get or create Socket.io client
      socket = getSocketClient();
      socketRef.current = socket;

      const roomName = getRoomChannelName(roomCode);

      // Join the room
      socket.emit('join-room', roomCode);
      console.log(`[Socket] Joined room: ${roomName}`);

      // Bind event handlers
      const cleanup: Array<() => void> = [];

      if (handlers.onPlayerJoined) {
        const handler = (data: unknown) => {
          handlersRef.current.onPlayerJoined?.(data as Parameters<NonNullable<typeof handlers.onPlayerJoined>>[0]);
        };
        socket.on(SOCKET_EVENTS.PLAYER_JOINED, handler);
        cleanup.push(() => socket.off(SOCKET_EVENTS.PLAYER_JOINED, handler));
      }

      if (handlers.onPlayerLeft) {
        const handler = (data: unknown) => {
          handlersRef.current.onPlayerLeft?.(data as Parameters<NonNullable<typeof handlers.onPlayerLeft>>[0]);
        };
        socket.on(SOCKET_EVENTS.PLAYER_LEFT, handler);
        cleanup.push(() => socket.off(SOCKET_EVENTS.PLAYER_LEFT, handler));
      }

      if (handlers.onGameStarted) {
        const handler = (data: unknown) => {
          handlersRef.current.onGameStarted?.(data as Parameters<NonNullable<typeof handlers.onGameStarted>>[0]);
        };
        socket.on(SOCKET_EVENTS.GAME_STARTED, handler);
        cleanup.push(() => socket.off(SOCKET_EVENTS.GAME_STARTED, handler));
      }

      if (handlers.onGameEnded) {
        const handler = (data: unknown) => {
          handlersRef.current.onGameEnded?.(data as Parameters<NonNullable<typeof handlers.onGameEnded>>[0]);
        };
        socket.on(SOCKET_EVENTS.GAME_ENDED, handler);
        cleanup.push(() => socket.off(SOCKET_EVENTS.GAME_ENDED, handler));
      }

      if (handlers.onRoomClosed) {
        const handler = (data: unknown) => {
          handlersRef.current.onRoomClosed?.(data as Parameters<NonNullable<typeof handlers.onRoomClosed>>[0]);
        };
        socket.on(SOCKET_EVENTS.ROOM_CLOSED, handler);
        cleanup.push(() => socket.off(SOCKET_EVENTS.ROOM_CLOSED, handler));
      }

      if (handlers.onWordFound) {
        const handler = (data: unknown) => {
          handlersRef.current.onWordFound?.(data as Parameters<NonNullable<typeof handlers.onWordFound>>[0]);
        };
        socket.on(SOCKET_EVENTS.WORD_FOUND, handler);
        cleanup.push(() => socket.off(SOCKET_EVENTS.WORD_FOUND, handler));
      }

      if (handlers.onRevealWord) {
        const handler = (data: unknown) => {
          handlersRef.current.onRevealWord?.(data as Parameters<NonNullable<typeof handlers.onRevealWord>>[0]);
        };
        socket.on(SOCKET_EVENTS.REVEAL_WORD, handler);
        cleanup.push(() => socket.off(SOCKET_EVENTS.REVEAL_WORD, handler));
      }

      if (handlers.onResultsComplete) {
        const handler = (data: unknown) => {
          handlersRef.current.onResultsComplete?.(data as Parameters<NonNullable<typeof handlers.onResultsComplete>>[0]);
        };
        socket.on(SOCKET_EVENTS.RESULTS_COMPLETE, handler);
        cleanup.push(() => socket.off(SOCKET_EVENTS.RESULTS_COMPLETE, handler));
      }

      if (handlers.onRematchRequested) {
        const handler = (data: unknown) => {
          handlersRef.current.onRematchRequested?.(data as Parameters<NonNullable<typeof handlers.onRematchRequested>>[0]);
        };
        socket.on(SOCKET_EVENTS.REMATCH_REQUESTED, handler);
        cleanup.push(() => socket.off(SOCKET_EVENTS.REMATCH_REQUESTED, handler));
      }
    } catch (error) {
      console.error('[Socket] Failed to connect:', error);
    }

    // Cleanup function
    return () => {
      if (socket && roomCode) {
        // Leave the room
        socket.emit('leave-room', roomCode);
        console.log(`[Socket] Left room: ${roomCode}`);

        // Unbind all events (cleanup handles this, but as fallback)
        socket.offAny();
      }
    };
  }, [roomCode, enabled]);
}
```

**Step 2: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useSocketRoom.ts
git commit -m "feat: add useSocketRoom hook for socket.io subscriptions"
```

---

### Task 12: Update Components to Use useSocketRoom

**Skill Required:** @websocket-implementation

**Files:**
- Modify: All files that import `usePusherChannel`

**Step 1: Find all files using usePusherChannel**

Run: `grep -r "usePusherChannel" src/ --files-with-matches`
Expected: List of files to update

**Step 2: For each file, replace import**

Find:
```typescript
import { usePusherChannel, type PusherEventHandlers } from '@/hooks/usePusherChannel';
```

Replace with:
```typescript
import { useSocketRoom, type SocketEventHandlers } from '@/hooks/useSocketRoom';
```

**Step 3: For each file, replace hook usage**

Find:
```typescript
usePusherChannel(
```

Replace with:
```typescript
useSocketRoom(
```

**Step 4: For each file, replace type references**

Find:
```typescript
PusherEventHandlers
```

Replace with:
```typescript
SocketEventHandlers
```

**Step 5: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
# Add all modified files
git add src/app/room/[code]/page.tsx src/app/game/[roomId]/page.tsx src/app/results/[roomId]/page.tsx src/hooks/useGameSync.ts
git commit -m "refactor: replace usePusherChannel with useSocketRoom in components"
```

---

### Task 13: Update Docker Compose

**Skill Required:** @websocket-implementation

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Update docker-compose.yml**

Replace entire content with:
```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - WS_HTTP_URL=http://websocket:3001
      - NEXT_PUBLIC_WS_URL=ws://localhost:3002
      - CORS_ORIGIN=http://localhost:3000
    env_file:
      - .env.local
    depends_on:
      db:
        condition: service_healthy
      websocket:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    restart: unless-stopped

  websocket:
    build:
      context: ./websocket-server
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    environment:
      - PORT=3002
      - HTTP_PORT=3001
      - NODE_ENV=development
      - CORS_ORIGIN=http://localhost:3000
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    container_name: boggle_postgres
    environment:
      POSTGRES_DB: boggle_party
      POSTGRES_USER: boggle_user
      POSTGRES_PASSWORD: dev_password_change_me
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U boggle_user -d boggle_party"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

**Step 2: Verify syntax**

Run: `docker compose config`
Expected: Valid YAML output

**Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add websocket server to docker compose"
```

---

### Task 14: Update Environment Variables

**Skill Required:** @websocket-implementation

**Files:**
- Modify: `.env.example`
- Modify: `.env.local` (local only, don't commit)

**Step 1: Update .env.example**

Add to `.env.example`:
```bash
# WebSocket Server
WS_HTTP_URL=http://websocket:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3002
CORS_ORIGIN=http://localhost:3000
```

**Step 2: Update .env.local**

Add to `.env.local`:
```bash
# WebSocket Server
WS_HTTP_URL=http://websocket:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3002
CORS_ORIGIN=http://localhost:3000
```

**Step 3: Commit .env.example**

```bash
git add .env.example
git commit -m "feat: add websocket environment variables"
```

---

## Phase 3: Testing & Cleanup

### Task 15: Test WebSocket Server Locally

**Skill Required:** @websocket-implementation

**Files:**
- Test: `websocket-server/`

**Step 1: Start services**

Run: `docker compose up -d websocket db`
Expected: Containers running

**Step 2: Check websocket server logs**

Run: `docker compose logs websocket`
Expected: `WebSocket server listening on port 3002`

**Step 3: Test health endpoint**

Run: `curl http://localhost:3001/health`
Expected: JSON response with status, rooms, clients

**Step 4: Test emit endpoint**

Run:
```bash
curl -X POST http://localhost:3001/emit \
  -H "Content-Type: application/json" \
  -d '{"channel":"game-TEST","event":"test","data":{"hello":"world"}}'
```

Expected: `{"success":true,"deliveredTo":0}`

**Step 5: Test websocket connection**

Create test client file `test-websocket.js`:
```javascript
const io = require('socket.io-client');

const socket = io('ws://localhost:3002');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('join-room', 'TEST');
  socket.on('test', (data) => {
    console.log('Received:', data);
    socket.disconnect();
    process.exit(0);
  });
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
  process.exit(1);
});
```

Run: `node test-websocket.js` (in websocket-server directory after `pnpm add socket.io-client`)
Expected: Connected, joins room, receives test event

**Step 6: Commit test files (optional)**

```bash
git add websocket-server/test-client.js
git commit -m "test(wss): add websocket test client"
```

---

### Task 16: End-to-End Integration Test

**Skill Required:** @websocket-implementation

**Files:**
- Test: Full application

**Step 1: Start all services**

Run: `docker compose up -d`
Expected: web, websocket, db all running

**Step 2: Check all services are healthy**

Run: `docker compose ps`
Expected: All services show "healthy"

**Step 3: Open application**

Open browser to `http://localhost:3000`
Expected: Landing page loads

**Step 4: Create a room**

1. Enter name in "Crear Sala" card
2. Click "¡Crear Sala!"
Expected: Redirected to waiting room

**Step 5: Open second browser window**

Open new window to `http://localhost:3000`
Expected: Landing page loads

**Step 6: Join the room**

1. Copy room code from first window
2. Enter name and room code in "Unirse a Sala" card
3. Click "¡Unirse!"
Expected: Both windows show 2 players

**Step 7: Check browser console**

Open DevTools Console in both windows
Expected: No errors, `[Socket] Joined room: game-XXX` log

**Step 8: Start game**

1. Host clicks "Comenzar Partida"
Expected: Both windows show game board simultaneously

**Step 9: Submit a word**

1. Select letters in first window
2. Release to submit
Expected: Both windows update with found word

**Step 10: Verify websocket server logs**

Run: `docker compose logs websocket | tail -20`
Expected: Event emission logs

---

### Task 17: Remove Pusher Dependencies

**Skill Required:** @websocket-implementation

**Files:**
- Delete: `src/lib/pusher.ts`
- Delete: `src/hooks/usePusherChannel.ts`
- Delete: `src/server/pusher-client.ts`
- Modify: `package.json`
- Modify: `.env.example`

**Step 1: Remove pusher files**

Run:
```bash
rm src/lib/pusher.ts
rm src/hooks/usePusherChannel.ts
rm src/server/pusher-client.ts
```

**Step 2: Remove pusher dependencies**

Run: `pnpm remove pusher pusher-js @types/pusher-js`

**Step 3: Update .env.example**

Remove from `.env.example`:
```bash
# Pusher (deprecated - use WebSocket instead)
# PUSHER_APP_ID=your_app_id
# PUSHER_KEY=your_key
# PUSHER_SECRET=your_secret
# PUSHER_CLUSTER=your_cluster
# PUSHER_USE_TLS=true
# NEXT_PUBLIC_PUSHER_KEY=your_key
# NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

**Step 4: Update CLAUDE.md**

Find and replace Pusher references with Socket.io in documentation.

**Step 5: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 6: Run build**

Run: `pnpm build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add .
git commit -m "chore: remove pusher dependencies and files"
```

---

### Task 18: Update Documentation

**Skill Required:** @websocket-implementation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md` (if exists)
- Create: `docs/WEBSOCKET.md`

**Step 1: Update CLAUDE.md**

Find the section describing Pusher and update to describe Socket.io architecture:

```markdown
## Real-Time Events (Socket.io)

Channel: `game-{roomCode}` where `{roomCode}` is the 6-character room code (e.g., `game-JX4XU3`)

WebSocket Server:
- Separate Node.js container running Socket.io
- HTTP API on port 3001 (internal, Next.js → WebSocket)
- WebSocket server on port 3002 (public, Client → WebSocket)
- Events: `player-joined`, `player-left`, `game-started`, `game-ended`, `word-found`, `reveal-word`, `results-complete`, `rematch-requested`

Server Integration:
- `src/server/websocket-client.ts` - HTTP client for emitting events
- `src/server/event-emitter.ts` - Typed event emitters

Client Integration:
- `src/lib/socket.ts` - Socket.io client singleton
- `src/hooks/useSocketRoom.ts` - React hook for room subscriptions
```

**Step 2: Create WEBSOCKET.md**

Create `docs/WEBSOCKET.md`:
```markdown
# WebSocket Architecture

## Overview

Boggle Party uses a self-hosted Socket.io server for real-time game synchronization.

## Components

### WebSocket Server (`websocket-server/`)

Standalone Node.js server with Socket.io and Express.

**Ports:**
- `3001` - HTTP API (internal, Next.js → WebSocket)
- `3002` - WebSocket server (public, Client → WebSocket)

**API Endpoints:**
- `POST /emit` - Emit event to room
- `GET /health` - Health check

**Socket Events:**
- `join-room` - Join a game room
- `leave-room` - Leave a game room

### Next.js Integration

**Server-side:**
- `src/server/websocket-client.ts` - HTTP client for emitting events
- `src/server/event-emitter.ts` - Typed wrapper functions

**Client-side:**
- `src/lib/socket.ts` - Socket.io client singleton
- `src/hooks/useSocketRoom.ts` - React hook for subscriptions

## Scaling

Currently uses in-memory room management. To scale horizontally:

1. Add Redis to docker-compose.yml
2. Install `socket.io-redis` adapter
3. Update `createWebSocketServer()` to use Redis adapter

See: https://socket.io/docs/v4/redis-adapter/
```

**Step 3: Commit**

```bash
git add CLAUDE.md docs/WEBSOCKET.md
git commit -m "docs: update documentation for websocket architecture"
```

---

## Success Criteria

- [ ] WebSocket server starts without errors
- [ ] Health check returns 200 OK
- [ ] Next.js can emit events via HTTP API
- [ ] Clients can connect via WebSocket
- [ ] Clients receive events in real-time (<100ms latency)
- [ ] All existing game flows work (create, join, start, play, results)
- [ ] No Pusher dependencies remain
- [ ] Build succeeds
- [ ] TypeScript compilation passes
- [ ] Docker Compose brings up all services successfully

---

## Migration Notes

**What Changed:**
- Pusher Channels → Socket.io
- `pusher-js` → `socket.io-client`
- `triggerEvent()` → `emitEvent()`
- `usePusherChannel()` → `useSocketRoom()`
- `PUSHER_EVENTS` → `SOCKET_EVENTS`

**What Stayed the Same:**
- Event names (`player-joined`, `game-started`, etc.)
- Event payloads/types
- API route signatures
- Room state management
- All game logic

**Rollback Plan:**
If issues arise:
1. Stop WebSocket server
2. Restore Pusher environment variables
3. Revert event-emitter.ts to use `triggerEvent()`
4. Restore usePusherChannel hook
5. Reinstall pusher-js client dependency

---

## Future Enhancements

**Phase 4 (Optional - When Scaling is Needed):**
- Add Redis adapter to Socket.io for horizontal scaling
- Implement connection authentication
- Add event replay for reconnection scenarios
- Metrics and monitoring (Prometheus/Grafana)
- Rate limiting on emit endpoint
