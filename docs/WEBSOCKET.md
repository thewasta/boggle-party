# WebSocket Architecture

## Overview

Boggle Party uses a self-hosted Socket.io server for real-time game synchronization, replacing the previous Pusher Channels integration. This eliminates external service dependencies and removes the 200K daily event limit.

## Components

### WebSocket Server (`websocket-server/`)

Standalone Node.js server with Socket.io and Express.js.

**Ports:**
- `3001` - HTTP API (internal, Next.js → WebSocket)
- `3002` - WebSocket server (public, Client → WebSocket)

**API Endpoints:**
- `POST /emit` - Emit event to room/channel (used by Next.js server)
- `GET /health` - Health check with room and client counts

**Socket Events:**
- `join-room` - Join a game room (client → server)
- `leave-room` - Leave a game room (client → server)

**Game Events (server → client):**
- `player-joined` - New player joined the room
- `player-left` - Player left the room
- `game-started` - Game started with board and timer
- `game-ended` - Game ended, transition to results
- `word-found` - Real-time word submission notification
- `reveal-word` - Sequential word reveal during results
- `results-complete` - End of reveal phase
- `rematch-requested` - Host triggered rematch
- `room-closed` - Room closed (error/disconnect)

### Next.js Integration

**Server-side (API routes → WebSocket server):**
- `src/server/websocket-client.ts` - HTTP client for emitting events
  ```typescript
  await emitEvent('game-ABC123', 'player-joined', { player, totalPlayers });
  ```
- `src/server/event-emitter.ts` - Typed wrapper functions
  ```typescript
  await emitPlayerJoined(roomCode, player, totalPlayers);
  ```

**Client-side (Browser → WebSocket server):**
- `src/lib/socket.ts` - Socket.io client singleton
  ```typescript
  const socket = getSocketClient(); // Returns singleton instance
  socket.emit('join-room', roomCode);
  ```
- `src/hooks/useSocketRoom.ts` - React hook for subscriptions
  ```typescript
  useSocketRoom(roomCode, {
    onPlayerJoined: (data) => { /* ... */ },
    onGameStarted: (data) => { /* ... */ },
  });
  ```

## Data Flow

### Server → Client (Game Events)

```
[Next.js API Route] → [emitEvent()] → [WebSocket HTTP API]
    → [Socket.io Server] → [Connected Clients]
```

Example:
1. Player joins room via API (`/api/rooms/ABC123/join`)
2. API route calls `emitPlayerJoined(roomCode, player, totalPlayers)`
3. `websocket-client.ts` makes POST request to `http://websocket:3001/emit`
4. WebSocket server broadcasts `player-joined` event to all clients in `game-ABC123` room
5. Connected clients receive event via `useSocketRoom` hook

### Client → Server (Room Management)

```
[Browser] → [Socket.io Client] → [WebSocket Server]
```

Example:
1. Component mounts with `useSocketRoom('ABC123', handlers)`
2. Hook calls `socket.emit('join-room', 'ABC123')`
3. WebSocket server adds socket to `game-ABC123` room
4. Client now receives all events broadcast to that room

## Environment Variables

```env
# WebSocket Server (Next.js → WebSocket)
WS_HTTP_URL=http://websocket:3001

# WebSocket Client (Browser → WebSocket)
NEXT_PUBLIC_WS_URL=ws://localhost:3002

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Scaling

### Current Architecture (In-Memory)

- Single WebSocket server instance
- Room state stored in memory
- Suitable for single-server deployments
- Maximum connections limited by server resources

### Horizontal Scaling (Future)

To scale across multiple WebSocket server instances:

1. **Add Redis Adapter**
   ```bash
   cd websocket-server
   pnpm add socket.io-redis
   ```

2. **Update `websocket-server/src/websocket.ts`**
   ```typescript
   import { Server } from 'socket.io';
   import { createClient } from 'redis';
   import { createAdapter } from '@socket.io/redis-adapter';

   const io = new Server(httpServer, {
     adapter: createAdapter(
       createClient({ host: 'redis', port: 6379 }),
       createClient({ host: 'redis', port: 6379 })
     ),
   });
   ```

3. **Update `docker-compose.yml`**
   ```yaml
   redis:
     image: redis:7-alpine
     ports:
       - "6379:6379"

   websocket:
     deploy:
       replicas: 3  # Run 3 instances
   ```

See: https://socket.io/docs/v4/redis-adapter/

## Migration Notes

### What Changed
- **Pusher Channels** → **Socket.io**
- `pusher-js` → `socket.io-client`
- `triggerEvent()` → `emitEvent()`
- `usePusherChannel()` → `useSocketRoom()`
- `PUSHER_EVENTS` → `SOCKET_EVENTS`

### What Stayed the Same
- Event names (`player-joined`, `game-started`, etc.)
- Event payloads/types
- API route signatures
- Room state management
- All game logic

### Rollback Plan
If issues arise with WebSocket migration:
1. Stop WebSocket server
2. Restore Pusher environment variables
3. Revert `src/server/event-emitter.ts` to use `triggerEvent()`
4. Restore `usePusherChannel` hook
5. Reinstall `pusher-js` client dependency

## Troubleshooting

### WebSocket Connection Issues

**Problem:** Clients cannot connect to WebSocket server

**Solutions:**
1. Check WebSocket server logs: `docker compose logs websocket`
2. Verify CORS_ORIGIN matches client URL
3. Ensure port 3002 is accessible
4. Check browser console for connection errors

### Events Not Received

**Problem:** Server emits events but clients don't receive them

**Solutions:**
1. Verify client joined room: Check for `[Socket] Joined room: game-XXX` log
2. Check room name matches format `game-{roomCode}`
3. Verify WebSocket health endpoint: `curl http://localhost:3001/health`
4. Check event data matches Zod schema validation

### Performance Issues

**Problem:** High latency or dropped connections

**Solutions:**
1. Check WebSocket server resource usage
2. Enable WebSocket compression
3. Consider Redis adapter for multiple instances
4. Monitor room/client counts via health endpoint

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "rooms": 5,
  "clients": 12,
  "timestamp": 1736238400000
}
```

### Logs

WebSocket server logs include:
- `[WS] Client connected: {socketId}` - New connection
- `[WS] Client disconnected: {socketId}` - Disconnection
- `[WS] Socket {socketId} joined room: {roomName}` - Room join
- `[WS] Emitted "{event}" to "{channel}" ({count} clients)` - Event broadcast

### Metrics to Monitor

- Active rooms count
- Connected clients count
- Event emission rate
- Average latency
- Error rate
