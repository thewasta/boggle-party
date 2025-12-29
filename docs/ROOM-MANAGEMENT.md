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
