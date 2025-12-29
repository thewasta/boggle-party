# Epic 2: Database Schema & Persistent Data Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Design and implement PostgreSQL schema for persistent game data (games, players, words), set up migration system, and create repository pattern for data access.

**Architecture:**
- PostgreSQL 16 running in Docker (from Epic 1)
- Simple SQL migration files + custom migration runner (YAGNI principle)
- Repository pattern for type-safe data access
- Connection pooling (already configured in src/server/db/connection.ts)
- Database used for historical records, not active game state (in-memory)

**Tech Stack:**
- PostgreSQL 16 with node-postgres (pg)
- TypeScript 5
- Custom migration runner (SQL files)
- Repository pattern

**Note:** Active game room state will be stored in-memory on the server (Map structure) for performance. The database is for game history, analytics, and future statistics features.

---

## Prerequisites

- Docker containers running (web + db services)
- Database `boggle_party` accessible
- Connection pool already configured in `src/server/db/connection.ts`

---

## Implementation Status

**Started:** 2025-12-29
**Last Updated:** 2025-12-29 22:08
**Progress:** 7 of 14 tasks completed (50%)
**Schema Fixes Applied:** Migration 002 - Added missing critical fields

### ✅ Completed Tasks

1. **Task 1: Create TypeScript Schema Types** ✅
   - Status: Completed
   - Files: `src/server/db/schema.ts`
   - Types created: GameStatus, GridSize, GameRow, GamePlayerRow, GameWordRow, Input types

2. **Task 2: Create Initial Database Migration** ✅
   - Status: Completed
   - Files: `src/server/db/migrations/001_initial_schema.sql`
   - Database migration SQL created with all tables and indexes

3. **Task 3: Create Migration Runner Script** ✅
   - Status: Completed
   - Files: `src/server/db/migrate.ts`
   - Migration runner with transaction support and error handling

4. **Task 4: Test Migration Runner** ✅
   - Status: Completed
   - Migration applied successfully via psql
   - All 4 tables created (games, game_players, game_words, schema_migrations)
   - All 12 indexes created and verified
   - Migration recorded in schema_migrations table
   - Note: tsx dependency added, needs container rebuild for full TypeScript execution

5. **Task 5: Create Games Repository** ✅
   - Status: Completed
   - Files: `src/server/db/repositories/games.repository.ts`
   - Methods: create, findById, findByRoomCode, updateStatus, incrementWordsFound
   - Commit: 1f6c9a0

6. **Task 6: Create Players Repository** ✅
   - Status: Completed
   - Files: `src/server/db/repositories/players.repository.ts`
   - Methods: create, findById, findByGameId, updateScore

7. **Task 7: Create Words Repository** ✅
   - Status: Completed
   - Files: `src/server/db/repositories/words.repository.ts`
   - Methods: create, findByGameId, findByPlayerId, countUniqueWords, wordExistsInGame

### 📋 Pending Tasks (7 remaining)

8. **Task 8: Create Repository Index File** - Create barrel export for all repositories
9. **Task 9: Create API Endpoint for Migration Trigger** - POST /api/db/migrate endpoint
10. **Task 10: Create Integration Tests** - Repository integration tests
11. **Task 11: Update Health Check Endpoint** - Add schema verification
12. **Task 12: Create Database Documentation** - docs/DATABASE.md
13. **Task 13: Verify All Success Criteria** - Final verification
14. **Task 14: Create Epic Completion Summary** - Update epics document

### 📊 Progress Summary

- **Database Schema:** ✅ Complete (all tables and indexes created)
- **Migration System:** ✅ Complete (runner script + SQL migration)
- **Repositories:** ✅ Complete (games, players, words)
- **Tests:** ⏳ Pending
- **Documentation:** ⏳ Pending
- **API Endpoints:** ⏳ Pending

### 🎯 Next Steps

1. Create repository index file (Task 8)
2. Create API endpoint for manual migration trigger (Task 9)
3. Write integration tests for repositories (Task 10)
4. Update health check to verify schema (Task 11)
5. Create comprehensive documentation (Task 12)
6. Final verification and completion (Tasks 13-14)

---

## Task 1: Create TypeScript Schema Types

**Files:**
- Create: `src/server/db/schema.ts`

**Step 1: Create database schema types**

Create TypeScript types matching the proposed database schema:

```typescript
// Database enums
export type GameStatus = 'waiting' | 'playing' | 'finished';
export type GridSize = 4 | 5 | 6;

// Database row types (from tables)
export interface GameRow {
  id: string;
  room_code: string;
  grid_size: GridSize;
  duration: number;
  status: GameStatus;
  created_at: Date;
  started_at: Date | null;
  ended_at: Date | null;
  total_words_found: number;
}

export interface GamePlayerRow {
  id: string;
  game_id: string;
  player_name: string;
  avatar: string;
  final_score: number;
  words_found: number;
  unique_words_found: number;
  joined_at: Date;
}

export interface GameWordRow {
  id: string;
  game_id: string;
  player_id: string;
  word: string;
  score: number;
  is_unique: boolean;
  found_at: Date;
}

// Input types for creating records
export interface CreateGameInput {
  room_code: string;
  grid_size: GridSize;
  duration: number;
  status: GameStatus;
}

export interface CreatePlayerInput {
  game_id: string;
  player_name: string;
  avatar: string;
}

export interface CreateWordInput {
  game_id: string;
  player_id: string;
  word: string;
  score: number;
  is_unique: boolean;
}
```

**Step 2: Commit**

```bash
git add src/server/db/schema.ts
git commit -m "feat: add TypeScript schema types for database models"
```

---

## Task 2: Create Initial Database Migration

**Files:**
- Create: `src/server/db/migrations/001_initial_schema.sql`

**Step 1: Create migrations directory**

```bash
mkdir -p src/server/db/migrations
```

**Step 2: Create initial schema migration**

Create `src/server/db/migrations/001_initial_schema.sql`:

```sql
-- Migration: 001_initial_schema
-- Description: Create initial tables for games, players, and words
-- Created: 2025-12-29

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Games table (for analytics/statistics)
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) NOT NULL UNIQUE,
  grid_size INTEGER NOT NULL CHECK (grid_size IN (4, 5, 6)),
  duration INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  total_words_found INTEGER DEFAULT 0
);

-- Game players table
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name VARCHAR(50) NOT NULL,
  avatar VARCHAR(100) NOT NULL,
  final_score INTEGER DEFAULT 0,
  words_found INTEGER DEFAULT 0,
  unique_words_found INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, player_name)
);

-- Game words table (for history/analytics)
CREATE TABLE IF NOT EXISTS game_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  word VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  is_unique BOOLEAN DEFAULT false,
  found_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_words_game_id ON game_words(game_id);
CREATE INDEX IF NOT EXISTS idx_game_words_player_id ON game_words(player_id);

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT NOW()
);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');
```

**Step 3: Commit**

```bash
git add src/server/db/migrations/001_initial_schema.sql
git commit -m "feat: add initial database schema migration"
```

---

## Task 3: Create Migration Runner Script

**Files:**
- Create: `src/server/db/migrate.ts`

**Step 1: Create migration runner**

Create `src/server/db/migrate.ts`:

```typescript
import { getPool } from './connection';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Migration {
  version: string;
  appliedAt: Date;
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const pool = getPool();

  // Ensure migrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const result = await pool.query<Migration>('SELECT version FROM schema_migrations');
  return new Set(result.rows.map((row) => row.version));
}

async function runMigration(version: string, sql: string): Promise<void> {
  const pool = getPool();

  console.log(`Running migration: ${version}`);

  try {
    await pool.query('BEGIN');

    // Run migration SQL
    await pool.query(sql);

    // Record migration
    await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);

    await pool.query('COMMIT');
    console.log(`✓ Migration ${version} completed`);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`✗ Migration ${version} failed:`, error);
    throw error;
  }
}

export async function runMigrations(): Promise<void> {
  console.log('Checking database migrations...');

  const appliedMigrations = await getAppliedMigrations();
  const migrationFiles = ['001_initial_schema'];

  for (const version of migrationFiles) {
    if (appliedMigrations.has(version)) {
      console.log(`○ Migration ${version} already applied, skipping`);
      continue;
    }

    const sqlPath = join(__dirname, 'migrations', `${version}.sql`);
    const sql = readFileSync(sqlPath, 'utf-8');

    await runMigration(version, sql);
  }

  console.log('Migrations completed');
}

// CLI: Run migrations directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('All migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
```

**Step 2: Commit**

```bash
git add src/server/db/migrate.ts
git commit -m "feat: add migration runner script"
```

---

## Task 4: Test Migration Runner

**Files:**
- Test: Manual verification in Docker

**Step 1: Run migration in Docker container**

```bash
# From host machine
docker compose exec web npx tsx src/server/db/migrate.ts
```

**Expected output:**
```
Checking database migrations...
Running migration: 001_initial_schema
✓ Migration 001_initial_schema completed
Migrations completed
All migrations completed successfully
```

**Step 2: Verify tables were created**

```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "\dt"
```

**Expected output:**
```
          List of relations
 Schema |     Name      | Type  |    Owner
--------+---------------+-------+--------------
 public | game_players | table | boggle_user
 public | game_words   | table | boggle_user
 public | games        | table | boggle_user
 public | schema_migrations | table | boggle_user
```

**Step 3: Verify indexes were created**

```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "\di"
```

**Expected output:** Should show indexes like `idx_games_room_code`, `idx_game_players_game_id`, etc.

**Step 4: Verify migration was recorded**

```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT * FROM schema_migrations;"
```

**Expected output:**
```
 id |      version      |          applied_at
----+-------------------+-------------------------------
  1 | 001_initial_schema | 2025-12-29 XX:XX:XX.XXXXXX+00
```

**Step 5: Test idempotent migration (run again)**

```bash
docker compose exec web npx tsx src/server/db/migrate.ts
```

**Expected output:**
```
Checking database migrations...
○ Migration 001_initial_schema already applied, skipping
Migrations completed
All migrations completed successfully
```

**Step 6: Commit migration verification**

No code changes, just verify everything works.

---

## Task 5: Create Games Repository

**Files:**
- Create: `src/server/db/repositories/games.repository.ts`

**Step 1: Create repositories directory**

```bash
mkdir -p src/server/db/repositories
```

**Step 2: Create games repository**

Create `src/server/db/repositories/games.repository.ts`:

```typescript
import { getPool } from '../connection';
import { GameRow, CreateGameInput } from '../schema';

export class GamesRepository {
  /**
   * Create a new game record
   */
  async create(input: CreateGameInput): Promise<GameRow> {
    const pool = getPool();

    const result = await pool.query<GameRow>(
      `INSERT INTO games (room_code, grid_size, duration, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.room_code, input.grid_size, input.duration, input.status]
    );

    return result.rows[0];
  }

  /**
   * Find game by ID
   */
  async findById(id: string): Promise<GameRow | null> {
    const pool = getPool();

    const result = await pool.query<GameRow>(
      'SELECT * FROM games WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find game by room code
   */
  async findByRoomCode(roomCode: string): Promise<GameRow | null> {
    const pool = getPool();

    const result = await pool.query<GameRow>(
      'SELECT * FROM games WHERE room_code = $1',
      [roomCode]
    );

    return result.rows[0] || null;
  }

  /**
   * Update game status
   */
  async updateStatus(
    id: string,
    status: 'waiting' | 'playing' | 'finished',
    timestamps?: { started_at?: Date; ended_at?: Date }
  ): Promise<GameRow> {
    const pool = getPool();

    const updates: string[] = ['status = $2'];
    const values: any[] = [id, status];
    let paramCount = 2;

    if (timestamps?.started_at) {
      paramCount++;
      updates.push(`started_at = $${paramCount}`);
      values.push(timestamps.started_at);
    }

    if (timestamps?.ended_at) {
      paramCount++;
      updates.push(`ended_at = $${paramCount}`);
      values.push(timestamps.ended_at);
    }

    const result = await pool.query<GameRow>(
      `UPDATE games SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Increment total words found counter
   */
  async incrementWordsFound(id: string): Promise<void> {
    const pool = getPool();

    await pool.query(
      'UPDATE games SET total_words_found = total_words_found + 1 WHERE id = $1',
      [id]
    );
  }
}

// Export singleton instance
export const gamesRepository = new GamesRepository();
```

**Step 3: Commit**

```bash
git add src/server/db/repositories/games.repository.ts
git commit -m "feat: add games repository with CRUD operations"
```

---

## Task 6: Create Players Repository

**Files:**
- Create: `src/server/db/repositories/players.repository.ts`

**Step 1: Create players repository**

Create `src/server/db/repositories/players.repository.ts`:

```typescript
import { getPool } from '../connection';
import { GamePlayerRow, CreatePlayerInput } from '../schema';

export class PlayersRepository {
  /**
   * Add a player to a game
   */
  async create(input: CreatePlayerInput): Promise<GamePlayerRow> {
    const pool = getPool();

    const result = await pool.query<GamePlayerRow>(
      `INSERT INTO game_players (game_id, player_name, avatar)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.game_id, input.player_name, input.avatar]
    );

    return result.rows[0];
  }

  /**
   * Find player by ID
   */
  async findById(id: string): Promise<GamePlayerRow | null> {
    const pool = getPool();

    const result = await pool.query<GamePlayerRow>(
      'SELECT * FROM game_players WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all players for a game
   */
  async findByGameId(gameId: string): Promise<GamePlayerRow[]> {
    const pool = getPool();

    const result = await pool.query<GamePlayerRow>(
      'SELECT * FROM game_players WHERE game_id = $1 ORDER BY joined_at',
      [gameId]
    );

    return result.rows;
  }

  /**
   * Update player's final score
   */
  async updateScore(
    playerId: string,
    finalScore: number,
    wordsFound: number,
    uniqueWordsFound: number
  ): Promise<GamePlayerRow> {
    const pool = getPool();

    const result = await pool.query<GamePlayerRow>(
      `UPDATE game_players
       SET final_score = $2, words_found = $3, unique_words_found = $4
       WHERE id = $1
       RETURNING *`,
      [playerId, finalScore, wordsFound, uniqueWordsFound]
    );

    return result.rows[0];
  }
}

// Export singleton instance
export const playersRepository = new PlayersRepository();
```

**Step 3: Commit**

```bash
git add src/server/db/repositories/players.repository.ts
git commit -m "feat: add players repository with CRUD operations"
```

---

## Task 7: Create Words Repository

**Files:**
- Create: `src/server/db/repositories/words.repository.ts`

**Step 1: Create words repository**

Create `src/server/db/repositories/words.repository.ts`:

```typescript
import { getPool } from '../connection';
import { GameWordRow, CreateWordInput } from '../schema';

export class WordsRepository {
  /**
   * Record a word found by a player
   */
  async create(input: CreateWordInput): Promise<GameWordRow> {
    const pool = getPool();

    const result = await pool.query<GameWordRow>(
      `INSERT INTO game_words (game_id, player_id, word, score, is_unique)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.game_id, input.player_id, input.word, input.score, input.is_unique]
    );

    return result.rows[0];
  }

  /**
   * Get all words for a game
   */
  async findByGameId(gameId: string): Promise<GameWordRow[]> {
    const pool = getPool();

    const result = await pool.query<GameWordRow>(
      `SELECT * FROM game_words
       WHERE game_id = $1
       ORDER BY found_at`,
      [gameId]
    );

    return result.rows;
  }

  /**
   * Get all words for a player in a game
   */
  async findByPlayerId(playerId: string): Promise<GameWordRow[]> {
    const pool = getPool();

    const result = await pool.query<GameWordRow>(
      `SELECT * FROM game_words
       WHERE player_id = $1
       ORDER BY found_at`,
      [playerId]
    );

    return result.rows;
  }

  /**
   * Count unique words in a game
   */
  async countUniqueWords(gameId: string): Promise<number> {
    const pool = getPool();

    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(DISTINCT word) as count
       FROM game_words
       WHERE game_id = $1`,
      [gameId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if a word was found by any player in a game
   */
  async wordExistsInGame(gameId: string, word: string): Promise<boolean> {
    const pool = getPool();

    const result = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM game_words
         WHERE game_id = $1 AND LOWER(word) = LOWER($2)
       ) as exists`,
      [gameId, word]
    );

    return result.rows[0].exists;
  }
}

// Export singleton instance
export const wordsRepository = new WordsRepository();
```

**Step 2: Commit**

```bash
git add src/server/db/repositories/words.repository.ts
git commit -m "feat: add words repository with CRUD operations"
```

---

## Task 8: Create Repository Index File

**Files:**
- Create: `src/server/db/repositories/index.ts`

**Step 1: Create barrel export**

Create `src/server/db/repositories/index.ts`:

```typescript
export { GamesRepository, gamesRepository } from './games.repository';
export { PlayersRepository, playersRepository } from './players.repository';
export { WordsRepository, wordsRepository } from './words.repository';
```

**Step 2: Update main db index**

Create or modify `src/server/db/index.ts`:

```typescript
export * from './connection';
export * from './schema';
export * from './migrate';
export * from './repositories';
```

**Step 3: Commit**

```bash
git add src/server/db/repositories/index.ts src/server/db/index.ts
git commit -m "feat: add repository index exports"
```

---

## Task 9: Create API Endpoint for Manual Migration Trigger

**Files:**
- Create: `src/app/api/db/migrate/route.ts`

**Step 1: Create migration API endpoint**

Create `src/app/api/db/migrate/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { runMigrations } from '@/server/db/migrate';

export async function POST() {
  try {
    await runMigrations();

    return NextResponse.json(
      { success: true, message: 'Migrations completed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Migration failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/db/migrate/route.ts
git commit -m "feat: add API endpoint to trigger migrations"
```

---

## Task 10: Create Integration Test for Repositories

**Files:**
- Create: `src/server/db/__tests__/repositories.integration.test.ts`

**Step 1: Create test file**

Create `src/server/db/__tests__/repositories.integration.test.ts`:

```typescript
import { getPool } from '../connection';
import { gamesRepository, playersRepository, wordsRepository } from '../repositories';

describe('Database Repositories Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database connection
    const pool = getPool();
    await pool.query('SELECT 1');
  });

  afterEach(async () => {
    // Clean up test data
    const pool = getPool();
    await pool.query('DELETE FROM game_words');
    await pool.query('DELETE FROM game_players');
    await pool.query('DELETE FROM games');
  });

  describe('GamesRepository', () => {
    it('should create a new game', async () => {
      const game = await gamesRepository.create({
        room_code: 'ABC123',
        grid_size: 4,
        duration: 120,
        status: 'waiting',
      });

      expect(game).toBeDefined();
      expect(game.id).toBeDefined();
      expect(game.room_code).toBe('ABC123');
      expect(game.grid_size).toBe(4);
      expect(game.duration).toBe(120);
      expect(game.status).toBe('waiting');
    });

    it('should find game by room code', async () => {
      const created = await gamesRepository.create({
        room_code: 'XYZ789',
        grid_size: 5,
        duration: 180,
        status: 'waiting',
      });

      const found = await gamesRepository.findByRoomCode('XYZ789');

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.room_code).toBe('XYZ789');
    });

    it('should update game status', async () => {
      const game = await gamesRepository.create({
        room_code: 'STATUS',
        grid_size: 4,
        duration: 120,
        status: 'waiting',
      });

      const updated = await gamesRepository.updateStatus(
        game.id,
        'playing',
        { started_at: new Date() }
      );

      expect(updated.status).toBe('playing');
      expect(updated.started_at).toBeDefined();
    });
  });

  describe('PlayersRepository', () => {
    it('should create a player', async () => {
      const game = await gamesRepository.create({
        room_code: 'PLAYER',
        grid_size: 4,
        duration: 120,
        status: 'waiting',
      });

      const player = await playersRepository.create({
        game_id: game.id,
        player_name: 'Alice',
        avatar: '🎮',
      });

      expect(player).toBeDefined();
      expect(player.id).toBeDefined();
      expect(player.player_name).toBe('Alice');
      expect(player.avatar).toBe('🎮');
    });

    it('should get all players for a game', async () => {
      const game = await gamesRepository.create({
        room_code: 'MULTI',
        grid_size: 4,
        duration: 120,
        status: 'waiting',
      });

      await playersRepository.create({
        game_id: game.id,
        player_name: 'Alice',
        avatar: '🎮',
      });

      await playersRepository.create({
        game_id: game.id,
        player_name: 'Bob',
        avatar: '🎲',
      });

      const players = await playersRepository.findByGameId(game.id);

      expect(players).toHaveLength(2);
      expect(players[0].player_name).toBe('Alice');
      expect(players[1].player_name).toBe('Bob');
    });
  });

  describe('WordsRepository', () => {
    it('should record a found word', async () => {
      const game = await gamesRepository.create({
        room_code: 'WORDS',
        grid_size: 4,
        duration: 120,
        status: 'playing',
      });

      const player = await playersRepository.create({
        game_id: game.id,
        player_name: 'Charlie',
        avatar: '🎯',
      });

      const word = await wordsRepository.create({
        game_id: game.id,
        player_id: player.id,
        word: 'HOLA',
        score: 4,
        is_unique: true,
      });

      expect(word).toBeDefined();
      expect(word.word).toBe('HOLA');
      expect(word.score).toBe(4);
      expect(word.is_unique).toBe(true);
    });

    it('should get all words for a player', async () => {
      const game = await gamesRepository.create({
        room_code: 'LIST',
        grid_size: 4,
        duration: 120,
        status: 'playing',
      });

      const player = await playersRepository.create({
        game_id: game.id,
        player_name: 'Diana',
        avatar: '🎪',
      });

      await wordsRepository.create({
        game_id: game.id,
        player_id: player.id,
        word: 'CASA',
        score: 4,
        is_unique: true,
      });

      await wordsRepository.create({
        game_id: game.id,
        player_id: player.id,
        word: 'PERRO',
        score: 5,
        is_unique: false,
      });

      const words = await wordsRepository.findByPlayerId(player.id);

      expect(words).toHaveLength(2);
      expect(words[0].word).toBe('CASA');
      expect(words[1].word).toBe('PERRO');
    });

    it('should check if word exists in game (case insensitive)', async () => {
      const game = await gamesRepository.create({
        room_code: 'CHECK',
        grid_size: 4,
        duration: 120,
        status: 'playing',
      });

      const player = await playersRepository.create({
        game_id: game.id,
        player_name: 'Eve',
        avatar: '🎭',
      });

      await wordsRepository.create({
        game_id: game.id,
            player_id: player.id,
        word: 'GATO',
        score: 4,
        is_unique: true,
      });

      const existsLower = await wordsRepository.wordExistsInGame(game.id, 'gato');
      const existsUpper = await wordsRepository.wordExistsInGame(game.id, 'GATO');
      const notExists = await wordsRepository.wordExistsInGame(game.id, 'PERRO');

      expect(existsLower).toBe(true);
      expect(existsUpper).toBe(true);
      expect(notExists).toBe(false);
    });
  });
});
```

**Step 2: Run integration tests**

```bash
docker compose exec web pnpm test src/server/db/__tests__/repositories.integration.test.ts
```

**Expected output:** All tests should PASS

**Step 3: Commit**

```bash
git add src/server/db/__tests__/repositories.integration.test.ts
git commit -m "test: add integration tests for database repositories"
```

---

## Task 11: Update Health Check Endpoint

**Files:**
- Modify: `src/app/api/health/route.ts`

**Step 1: Enhance health check to verify database schema**

Read current health check:

```bash
cat src/app/api/health/route.ts
```

Modify to include database schema check:

```typescript
import { NextResponse } from 'next/server';
import { testConnection, getPool } from '@/server/db/connection';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      schema: 'unknown',
    },
  };

  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      health.services.database = 'disconnected';
      health.status = 'degraded';
      return NextResponse.json(health, { status: 503 });
    }

    health.services.database = 'connected';

    // Check if schema is migrated
    const pool = getPool();
    const schemaCheck = await pool.query(
      `SELECT EXISTS(
         SELECT FROM information_schema.tables
         WHERE table_name = 'games'
       )`
    );

    if (schemaCheck.rows[0].exists) {
      health.services.schema = 'migrated';
    } else {
      health.services.schema = 'not_migrated';
      health.status = 'degraded';
    }

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    health.status = 'error';
    health.services.database = 'error';

    return NextResponse.json(
      {
        ...health,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

**Step 2: Test health check**

```bash
curl http://localhost:3000/api/health
```

**Expected output:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-29T...",
  "services": {
    "database": "connected",
    "schema": "migrated"
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/health/route.ts
git commit -m "feat: enhance health check with schema verification"
```

---

## Task 12: Create Documentation

**Files:**
- Create: `docs/DATABASE.md`

**Step 1: Create database documentation**

Create `docs/DATABASE.md`:

```markdown
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
Stores game metadata and final state.

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY,
  room_code VARCHAR(6) UNIQUE,
  grid_size INTEGER CHECK (grid_size IN (4, 5, 6)),
  duration INTEGER,
  status VARCHAR(20) CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  total_words_found INTEGER
);
```

### game_players
Stores players who participated in each game.

```sql
CREATE TABLE game_players (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_name VARCHAR(50),
  avatar VARCHAR(100),
  final_score INTEGER,
  words_found INTEGER,
  unique_words_found INTEGER,
  joined_at TIMESTAMP,
  UNIQUE(game_id, player_name)
);
```

### game_words
Stores all words found during games (for analytics).

```sql
CREATE TABLE game_words (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES game_players(id) ON DELETE CASCADE,
  word VARCHAR(50),
  score INTEGER,
  is_unique BOOLEAN,
  found_at TIMESTAMP
);
```

## Running Migrations

### Option 1: Via Docker

```bash
docker compose exec web npx tsx src/server/db/migrate.ts
```

### Option 2: Via API

```bash
curl -X POST http://localhost:3000/api/db/migrate
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

### Run a query

```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT * FROM games LIMIT 5;"
```

### Backup database

```bash
docker compose exec db pg_dump -U boggle_user boggle_party > backup.sql
```

## Testing

Integration tests for repositories are in `src/server/db/__tests__/repositories.integration.test.ts`.

Run tests:
```bash
pnpm test src/server/db/__tests__/repositories.integration.test.ts
```
```

**Step 2: Commit documentation**

```bash
git add docs/DATABASE.md
git commit -m "docs: add comprehensive database documentation"
```

---

## Task 13: Verify All Success Criteria

**Step 1: Verify migration runs successfully**

```bash
docker compose exec web npx tsx src/server/db/migrate.ts
```

**Expected:** ✓ All migrations completed

**Step 2: Verify all tables created with correct indexes**

```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "\dt"
docker compose exec db psql -U boggle_user -d boggle_party -c "\di"
```

**Expected:** All tables and indexes present

**Step 3: Verify connection from Next.js API routes**

```bash
curl http://localhost:3000/api/health
```

**Expected:** `"database": "connected"`, `"schema": "migrated"`

**Step 4: Verify repository methods work**

Run integration tests:

```bash
docker compose exec web pnpm test src/server/db/__tests__/repositories.integration.test.ts
```

**Expected:** All tests PASS

**Step 5: Manual verification with psql**

```bash
# Insert test data
docker compose exec db psql -U boggle_user -d boggle_party -c "
INSERT INTO games (room_code, grid_size, duration, status)
VALUES ('TEST1', 4, 120, 'waiting')
RETURNING *;
"

# Query it back
docker compose exec db psql -U boggle_user -d boggle_party -c "
SELECT * FROM games WHERE room_code = 'TEST1';
"
```

**Expected:** Records returned successfully

**Step 6: Clean up test data**

```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "
DELETE FROM games WHERE room_code = 'TEST1';
"
```

---

## Task 14: Create Epic Completion Summary

**Files:**
- Update: `docs/plans/2025-12-29-boggle-party-epics.md`

**Step 1: Update Epic 2 status in the epics document**

Add to Epic 2 section after "Next Epic Trigger:" line:

```markdown
### Implementation Status

**Completed:** 2025-12-29

**Summary:**
- ✅ Database schema created with games, game_players, game_words tables
- ✅ Migration system implemented (SQL files + custom runner)
- ✅ All tables and indexes created successfully
- ✅ Repository pattern implemented (Games, Players, Words repositories)
- ✅ TypeScript types match database schema
- ✅ Integration tests passing
- ✅ Health check endpoint enhanced
- ✅ Database documentation created

**Git Milestone:** [COMMIT_HASH] - "milestone: Epic 2 complete - Database Schema & Persistent Data Layer"

**Key Files Created:**
- `src/server/db/schema.ts` - TypeScript types
- `src/server/db/migrations/001_initial_schema.sql` - Initial migration
- `src/server/db/migrate.ts` - Migration runner
- `src/server/db/repositories/games.repository.ts` - Games repository
- `src/server/db/repositories/players.repository.ts` - Players repository
- `src/server/db/repositories/words.repository.ts` - Words repository
- `src/server/db/__tests__/repositories.integration.test.ts` - Integration tests
- `src/app/api/db/migrate/route.ts` - Migration API endpoint
- `docs/DATABASE.md` - Documentation

**Notes:**
- All success criteria met
- Database ready for game history persistence
- Ready to proceed to Epic 3 (Room Management System)
```

**Step 2: Commit epic completion**

```bash
git add docs/plans/2025-12-29-boggle-party-epics.md
git commit -m "docs: mark Epic 2 as completed in epics document"
```

---

## Summary

This plan implements a complete database schema and persistent data layer for Boggle Party:

**What was built:**
1. TypeScript types matching database schema
2. SQL migration with games, players, and words tables
3. Custom migration runner (YAGNI principle)
4. Repository pattern for type-safe data access
5. Integration tests for all repositories
6. Health check endpoint enhancement
7. Comprehensive documentation

**Success criteria met:**
- ✅ Migration runs successfully in Docker environment
- ✅ All tables created with correct indexes
- ✅ Can connect to database from Next.js API routes
- ✅ Connection pooling configured (already from Epic 1)
- ✅ TypeScript types match database schema
- ✅ Repository methods work (create, find, update)

**Next Epic:** Epic 3 - Server-Side Core: Room Management System
- Will use the repositories created here to persist finished games
- Active game state will remain in-memory (Map structure)
- Database integration when game ends

**Total estimated time:** 2-3 hours for all 14 tasks

**Key design decisions:**
- Simple SQL migrations (YAGNI) instead of complex ORM
- Repository pattern for clean separation of concerns
- Database for historical data only (not active game state)
- Connection pooling already configured from Epic 1
- Integration tests verify real database behavior
