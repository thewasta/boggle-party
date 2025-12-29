# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Boggle Party is a real-time multiplayer Boggle game in Spanish. Players find words by dragging their finger across a letter board. The game features real-time synchronization, instant word validation, and an animated scoring reveal phase.

**Tech Stack:**
- Next.js 16 with App Router and React 19
- TypeScript 5
- Tailwind CSS v4
- Pusher Channels for real-time synchronization
- In-memory Spanish dictionary (7.9MB) for server-side validation
- Biome for linting and formatting

**Key Architecture:**
- Centralized server with Next.js API routes handling room creation, board generation, and word validation
- Pusher for real-time events (player joined/left, game started/ended, word reveals)
- **Shared board per room** (traditional Boggle rules) - all players see the same board and compete to find words
- Server-side validation prevents cheating
- Room state stored in server memory (Map structure)

## Development Commands

**IMPORTANT: Use `pnpm` for all package management - never npm.**

```bash
# Local development (outside Docker)
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run Biome linter
pnpm format           # Format code with Biome

# Database migrations
pnpm migrate          # Run database migrations (uses tsx)

# Package execution (use pnpm exec instead of npx)
pnpm exec tsx <file>  # Execute TypeScript files
pnpm exec <command>   # Run package binaries (instead of npx)
```

**Biome is used for linting and formatting**, not ESLint/Prettier. It automatically organizes imports on save.

## Docker Development

The application runs in Docker containers for local development:

```bash
# Start all services (web + db)
docker compose up -d

# View logs
docker compose logs -f web
docker compose logs -f db

# Stop services
docker compose down

# Restart web service after code changes
docker compose up -d --build web

# Run commands in web container
docker compose exec web pnpm <command>
docker compose exec web pnpm exec tsx src/server/db/migrate.ts

# Access PostgreSQL directly
docker compose exec db psql -U boggle_user -d boggle_party

# Clean slate (remove volumes)
docker compose down -v
```

**Services:**
- `web` - Next.js application on port 3000
- `db` - PostgreSQL 16 on port 5432

## Package Manager

**ALWAYS use `pnpm`, never npm.**

- **Instead of `npx`**, use `pnpm exec` or `pnpm dlx`
- Example: `pnpm exec tsx file.ts` instead of `npx tsx file.ts`
- In Docker: Always use `docker compose exec web pnpm <command>`

## High-Level Architecture

### Game Flow

1. **Room Creation**: Server generates 6-character room code, creates initial state with host
2. **Waiting Room**: Players join via code, host selects grid size (4×4, 5×5, 6×6) and starts game
3. **Active Game**: Each player gets unique board, 2-4 minute timer depending on grid size, drag-to-select word input
4. **Results Phase**: Sequential reveal of all found words with animated scoring, unique words get ×2 bonus

### Real-Time Events (Pusher)

Channel: `presence-game-{roomId}`

Events:
- `player-joined` / `player-left`: Update player list
- `game-started`: Includes startTime, duration, and unique board for each player
- `game-ended`: Transition to results screen
- `reveal-word`: Individual word reveal during scoring sequence
- `results-complete`: End of reveal, show final ranking

### Database & Persistence (Epic 1 & 2 - Completed)

**PostgreSQL Database:**
- Database: `boggle_party` (PostgreSQL 16)
- Connection pooling configured (max 20 clients)
- **Active game state**: In-memory on server (Map structure) for performance
- **Historical data**: Persisted to database for analytics

**Database Tables:**
- `games` - Game metadata (room_code, grid_size, duration, status, **shared board**, timestamps)
- `game_players` - Players in each game with final scores
- `game_words` - All words found during games with scores and uniqueness
- `schema_migrations` - Migration tracking

**Repository Pattern:**
All database access goes through repository classes in `src/server/db/repositories/`:
- `gamesRepository` - CRUD operations for games
- `playersRepository` - CRUD operations for players
- `wordsRepository` - CRUD operations for words

**Migrations:**
- SQL-based migrations in `src/server/db/migrations/`
- Run with: `pnpm migrate` or `docker compose exec web pnpm migrate`
- Custom migration runner in `src/server/db/migrate.ts`

### Word Validation

**Server-side:** Spanish dictionary loaded into Set for O(1) lookup, validates adjacency rules (DFS/BFS), prevents duplicate submissions

**Client-side:** Immediate visual feedback (✓ green valid, ✗ red invalid) while dragging

**Scoring:**
- 3-4 letters: 1pt
- 5 letters: 2pt
- 6 letters: 3pt
- 7+ letters: 5pt
- Unique word bonus: ×2 (only one player found it)

### Key Data Structures

```typescript
Room = {
  id: string
  code: string              // 6-character room code
  host: string
  players: Map<string, Player>
  gridSize: 4 | 5 | 6
  status: 'waiting' | 'playing' | 'finished'
  startTime?: number
  duration: number          // 120s (4×4), 180s (5×5), 240s (6×6)
}

Player = {
  id: string
  name: string
  avatar: string
  score: number
  foundWords: string[]
}
```

### Spanish Dictionary

Located at `data/dictionary.json` (7.9MB), loaded into server memory on startup. Source: `an-array-of-spanish-words` npm package.

Letter distribution follows Spanish frequency (E, A, O most common; W, K, X rare).

## Environment Variables Required

```env
# Database
POSTGRES_DB=boggle_party
POSTGRES_USER=boggle_user
POSTGRES_PASSWORD=dev_password_change_me
DATABASE_URL=postgresql://boggle_user:dev_password_change_me@db:5432/boggle_party

# Pusher
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
PUSHER_USE_TLS=true

NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── health/        # Health check endpoint
│   │   └── db/            # Database endpoints
│   └── ...
├── components/             # React components
├── lib/                    # Shared utilities
├── server/                 # Server-side code
│   └── db/                # Database layer
│       ├── connection.ts   # PostgreSQL connection pool
│       ├── schema.ts       # TypeScript schema types
│       ├── migrate.ts      # Migration runner
│       ├── migrations/     # SQL migration files
│       └── repositories/   # Repository pattern
│           ├── games.repository.ts
│           ├── players.repository.ts
│           └── words.repository.ts
├── types/                  # TypeScript type definitions
└── styles/                 # Global styles (if needed)

data/
└── dictionary.json         # Spanish words dictionary (7.9MB)

docs/
└── plans/                  # Epic implementation plans
    ├── 2025-12-29-boggle-party-epics.md
    ├── 2025-12-29-epic-1-docker-infrastructure.md
    └── 2025-12-29-epic-2-database-schema.md
```

## Important Implementation Notes

- **Grid size determines game duration**: 4×4=2min, 5×5=3min, 6×6=6min
- **Shared board per room** - All players see the same board and compete to find words (traditional Boggle rules)
- **Minimum 2 players required** to start a game
- **Word submission includes path**: Array of {row, col} coordinates to validate adjacency
- **Sequential word reveal**: Server emits `reveal-word` events one by one with 1-2s delay for dramatic effect
- **Touch interaction**: Touch-drag-release to select letters, visual line shows current selection

## Current Implementation Status

**Completed Epics:**
- ✅ **Epic 1: Docker & Infrastructure** - Docker Compose setup with web and db services, health check endpoint
- 🔄 **Epic 2: Database Schema** (50% complete) - PostgreSQL schema, migrations, and repositories (in progress)

**Next Epic:**
- Epic 3: Server-Side Core - Room Management System

See `docs/plans/2025-12-29-boggle-party-epics.md` for full project roadmap.

## Path Aliases

`@/*` maps to `./src/*` - use this for imports (e.g., `@/components/GameBoard`)

## React Compiler

The project uses React Compiler (`reactCompiler: true` in next.config.ts) - optimize for automatic memoization.

## Database Development Workflow

**Running Migrations:**
```bash
# Inside Docker container
docker compose exec web pnpm migrate

# Or via psql directly
docker compose exec db psql -U boggle_user -d boggle_party -f - < src/server/db/migrations/001_initial_schema.sql

# Check migration status
docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT * FROM schema_migrations;"
```

**Direct Database Access:**
```bash
# Access psql shell
docker compose exec db psql -U boggle_user -d boggle_party

# List tables
\dt

# Describe table
\d games

# Run query and exit
docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT * FROM games LIMIT 5;"
```

**Repository Usage:**
```typescript
import { gamesRepository, playersRepository, wordsRepository } from '@/server/db/repositories';

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
```

**Note:** Active game room state is managed in-memory (server-side Map). The database is only for historical records and analytics after games complete.