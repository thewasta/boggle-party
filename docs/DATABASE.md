# Database Documentation

## Overview

Boggle Party uses PostgreSQL 16 for persistent game data. Active game state is stored in-memory on the server (Map structure) for performance, while completed games are persisted to the database for analytics and history.

## Architecture

- **Database:** PostgreSQL 16
- **Connection Pooling:** node-postgres (pg)
- **Migrations:** Custom SQL-based migration system
- **Access Layer:** Repository pattern

## Tables

### games

Stores game metadata and final state. **Important:** The `board` field is a shared board per room (traditional Boggle rules).

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) NOT NULL UNIQUE,
  grid_size INTEGER NOT NULL CHECK (grid_size IN (4, 5, 6)),
  duration INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')),
  host_id UUID REFERENCES game_players(id),
  board JSONB, -- Shared board for all players in this room
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  total_words_found INTEGER DEFAULT 0
);
```

**Indexes:**
- `idx_games_room_code` on `room_code`
- `idx_games_status` on `status`
- `idx_games_board` (GIN) on `board` for JSONB queries

### game_players

Stores players who participated in each game.

```sql
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name VARCHAR(50) NOT NULL,
  avatar VARCHAR(100) NOT NULL,
  is_host BOOLEAN DEFAULT false,
  final_score INTEGER DEFAULT 0,
  words_found INTEGER DEFAULT 0,
  unique_words_found INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, player_name)
);
```

**Indexes:**
- `idx_game_players_game_id` on `game_id`
- `idx_game_players_game_host` on `game_id, is_host`

### game_words

Stores all words found during games (for analytics).

```sql
CREATE TABLE game_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  word VARCHAR(50) NOT NULL,
  word_length INTEGER NOT NULL, -- For scoring analytics
  path JSONB, -- Coordinates path for word validation
  score INTEGER NOT NULL,
  is_unique BOOLEAN DEFAULT false,
  found_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_game_words_game_id` on `game_id`
- `idx_game_words_player_id` on `player_id`
- `idx_game_words_length` on `word_length`

### schema_migrations

Tracks applied database migrations.

```sql
CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT NOW()
);
```

## Running Migrations

### Option 1: Via Docker

```bash
docker compose exec web pnpm migrate
```

### Option 2: Via API

```bash
curl -X POST http://localhost:3000/api/db/migrate
```

### Option 3: Direct SQL

```bash
docker compose exec db psql -U boggle_user -d boggle_party -f - < src/server/db/migrations/001_initial_schema.sql
```

## Repository Usage

```typescript
import { gamesRepository, playersRepository, wordsRepository } from '@/server/db';

// Create a game
const game = await gamesRepository.create({
  room_code: 'ABC123',
  grid_size: 4,
  duration: 120,
  status: 'waiting',
});

// Add players
const player = await playersRepository.create({
  game_id: game.id,
  player_name: 'Alice',
  avatar: '🎮',
});

// Record found words
await wordsRepository.create({
  game_id: game.id,
  player_id: player.id,
  word: 'HOLA',
  word_length: 4,
  path: [{row: 0, col: 0}, {row: 0, col: 1}, {row: 1, col: 1}, {row: 1, col: 2}],
  score: 4,
  is_unique: true,
});

// Update game status
await gamesRepository.updateStatus(game.id, 'playing', {
  started_at: new Date(),
});
```

## Connection Pool Configuration

- Max clients: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

## Development Workflow

### Access database directly

```bash
docker compose exec db psql -U boggle_user -d boggle_party
```

### View all tables

```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "\dt"
```

### Describe table structure

```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "\d games"
```

### Run a query

```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT * FROM games LIMIT 5;"
```

### Check migration status

```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT * FROM schema_migrations;"
```

### Backup database

```bash
docker compose exec db pg_dump -U boggle_user boggle_party > backup.sql
```

### Restore database

```bash
docker compose exec -T db psql -U boggle_user boggle_party < backup.sql
```

## Testing

Integration tests for repositories are in `src/server/db/__tests__/repositories.integration.test.ts`.

Run tests:
```bash
pnpm test src/server/db/__tests__/repositories.integration.test.ts
```

## Important Notes

### Shared Board Architecture

- **Traditional Boggle Rules:** All players in a room see the SAME board
- The `board` field is stored in the `games` table (NOT per-player)
- Players compete to find words on the identical board
- This was implemented in **Migration 003**

### Host Identification

- Each game has a `host_id` in the `games` table
- Each player has an `is_host` flag in the `game_players` table
- Implemented in **Migration 002**

### Word Validation Paths

- The `path` field in `game_words` stores coordinates for each letter
- Format: `[{row: 0, col: 0}, {row: 0, col: 1}, ...]`
- Used for validating word adjacency rules
- Implemented in **Migration 002**

### Scoring Analytics

- The `word_length` field enables analytics on word length distribution
- Used for scoring: 3-4 letters = 1pt, 5 letters = 2pt, 6 letters = 3pt, 7+ letters = 5pt
- Implemented in **Migration 002**

## Migration History

### Migration 001: Initial Schema (2025-12-29)
- Created games, game_players, game_words tables
- Basic indexes for performance
- Migration tracking table

### Migration 002: Missing Critical Fields (2025-12-29 22:08)
- Added `host_id` to games table
- Added `is_host` to game_players table
- Added `board` to game_players table (later moved in Migration 003)
- Added `word_length` to game_words table
- Added `path` to game_words table
- Created additional indexes

### Migration 003: Move Board to Games (2025-12-29 22:30)
- **CRITICAL DESIGN CHANGE:** Moved `board` from game_players to games table
- Implements shared board per room (traditional Boggle rules)
- Removed `board` from game_players
- Created GIN index on `board` for JSONB queries

## Health Check

The `/api/health` endpoint provides database and schema status:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-29T...",
  "uptime": 123.456,
  "environment": "development",
  "services": {
    "database": "up",
    "schema": "migrated"
  }
}
```
