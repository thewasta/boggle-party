# Boggle Party - Epic Implementation Plan

> **For Claude:** This is the EPIC-LEVEL plan. Each epic below will be expanded into a separate detailed implementation plan with bite-sized tasks using superpowers:writing-plans.

**Goal:** Build a real-time multiplayer Boggle game in Spanish with room management, word validation, animated scoring reveals, and Docker containerization

**Architecture:** Next.js 16 + Pusher Channels for real-time events, PostgreSQL for persistent data, Docker Compose for local development (web + db services), in-memory Spanish dictionary (7.9MB) for O(1) word validation, unique board per player generated from Spanish letter frequencies

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, Pusher Channels, PostgreSQL, Docker & Docker Compose, Zod, nanoid, Biome

---

## Epic 1: Project Foundation & Infrastructure ✅ **COMPLETED** (2025-12-29)

**Objective:** Set up core project dependencies, Docker environment, Pusher configuration, and development environment

**Deliverables:**
- Docker environment with two services: `web` (Next.js) and `db` (PostgreSQL)
- Dockerfile for Next.js application
- docker-compose.yml with web and db services
- PostgreSQL volume for local persistence
- Pusher account setup and credentials configured
- Required dependencies installed (pusher, pusher-js, zod, nanoid, pg)
- Environment variables template created
- Base TypeScript configuration extended
- Spanish dictionary file downloaded and placed in `data/dictionary.json`
- Development server running in Docker with all dependencies

**Docker Architecture:**

**Services:**
1. **web** - Next.js application
   - Build: Multi-stage Dockerfile (dev + production)
   - Ports: 3000 (local development)
   - Environment variables from .env
   - Hot reload in development
   - Depends on: db

2. **db** - PostgreSQL database
   - Image: postgres:16-alpine
   - Port: 5432
   - Environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
   - Volume: Named volume for data persistence
   - Database: boggle_party

**Files to Create:**
- `Dockerfile` - Next.js multi-stage build
- `docker-compose.yml` - Web + db services orchestration
- `.dockerignore` - Exclude node_modules, .next, etc.
- `.env.example` - Environment variables template (updated with DB vars)
- `.env.local` - Local credentials (gitignored)

**Database Configuration:**
- PostgreSQL 16
- Database: `boggle_party`
- Initial schema: Created via migration in Epic 2
- Volume: `postgres_data` for persistence

**Dependencies:**
```bash
pnpm add pusher pusher-js zod nanoid pg
pnpm add -D @types/pusher-js
```

**Environment Variables:**
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

**Docker Commands:**
```bash
# Development
docker compose up -d

# Rebuild web service
docker compose up -d --build web

# View logs
docker compose logs -f web

# Stop services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

**Success Criteria:**
- `docker compose up -d` starts both web and db services
- Web service accessible at http://localhost:3000
- Database service accepts connections on port 5432
- PostgreSQL volume persists data between container restarts
- `pnpm dev` runs without errors in container
- Dictionary file loads successfully
- Pusher credentials are accessible in environment
- Hot reload works in development mode

**Testing Docker Setup:**
- Test web service health endpoint
- Test database connection from web container
- Test volume persistence (restart container, data remains)
- Test environment variables are injected correctly

**Why First:** Foundation for all other epics - containerization, database, real-time communication and word validation depend on this

**Next Epic Trigger:** Infrastructure validated, Docker environment running, database accessible

### Implementation Status

**Completed:** 2025-12-29

**Summary:**
- ✅ All 17 tasks completed successfully
- ✅ Docker environment running with web and db services
- ✅ Health check endpoint operational (http://localhost:3000/api/health)
- ✅ PostgreSQL 16.11 accepting connections
- ✅ Spanish dictionary (8.0MB) loaded and committed
- ✅ Volume persistence verified
- ✅ Hot reload working in development
- ✅ Setup and verification scripts created
- ✅ Comprehensive documentation (DOCKER.md)

**Git Milestone:** `e692ba1` - "milestone: Epic 1 complete - Docker Infrastructure"

**Key Files Created:**
- `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`
- `.env.example`, `.env.local`
- `data/dictionary.json`, `data/README.md`
- `src/server/db/connection.ts`
- `src/app/api/health/route.ts`
- `scripts/setup.sh`, `scripts/verify-setup.sh`
- `DOCKER.md`

**Notes:**
- Fixed path resolution issue by moving `server/` to `src/server/`
- All success criteria met and verified
- Ready to proceed to Epic 2

---

## Epic 2: Database Schema & Persistent Data Layer

**Objective:** Design and implement PostgreSQL schema for persistent game data, set up migration system

**Deliverables:**
- Database schema design
- Migration system setup (using pure SQL or a migration tool)
- Initial migration with tables for: games, players, game_words (history)
- Database connection utility in Next.js
- Repository pattern for data access

**Core Features:**
- Persistent game history (optional, for analytics)
- Player statistics tracking (optional, future feature)
- Migration system for schema versioning
- Connection pooling for performance

**Proposed Schema (Initial):**

```sql
-- Game history table (for analytics/statistics)
CREATE TABLE games (
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

-- Players in games
CREATE TABLE game_players (
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

-- Words found in games (for history/analytics)
CREATE TABLE game_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  word VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  is_unique BOOLEAN DEFAULT false,
  found_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_game_words_game_id ON game_words(game_id);
CREATE INDEX idx_game_words_player_id ON game_words(player_id);
```

**Note:** Room state during active games will still be in-memory (server-side Map) for performance. Database is for historical records, statistics, and future analytics.

**Files to Create:**
- `server/db/migrations/001_initial_schema.sql` - Initial schema
- `server/db/connection.ts` - PostgreSQL connection utility
- `server/db/repositories/games.repository.ts` - Games data access
- `server/db/repositories/players.repository.ts` - Players data access
- `server/db/schema.ts` - TypeScript types matching schema
- `server/db/migrate.ts` - Migration runner script

**Migration System Options:**
1. **Simple SQL files** - Manual execution, version tracking in table
2. **node-pg-migrate** - Popular, CLI-based migrations
3. **Prisma** - ORM with migrations (adds complexity)
4. **Drizzle** - Lightweight, type-safe queries

**Recommendation:** Start with simple SQL files + custom migration runner (YAGNI principle)

**Success Criteria:**
- Migration runs successfully in Docker environment
- All tables created with correct indexes
- Can connect to database from Next.js API routes
- Connection pooling configured
- TypeScript types match database schema
- Repository methods work (create, find, update)

**Testing Strategy:**
- Unit tests for repository methods
- Integration tests with test database
- Migration rollback testing
- Connection pool stress testing

**Next Epic Trigger:** Database schema deployed, can persist game history

### Implementation Status

**Completed:** 2025-12-29

**Summary:**
- ✅ All 14 tasks completed successfully
- ✅ Database schema created with games, game_players, game_words tables
- ✅ Migration system implemented (SQL files + custom runner)
- ✅ 3 migrations applied (001, 002, 003) with critical design improvements
- ✅ Repository pattern implemented (Games, Players, Words repositories)
- ✅ TypeScript types match database schema
- ✅ Integration tests passing (8/8 tests)
- ✅ Health check endpoint enhanced with schema verification
- ✅ Comprehensive database documentation created

**Git Milestone:** Commits `dfcf78f` through `a1e431a` (multiple commits for Epic 2)

**Key Files Created:**
- `src/server/db/schema.ts` - TypeScript types for database models
- `src/server/db/migrations/001_initial_schema.sql` - Initial migration
- `src/server/db/migrations/002_add_missing_critical_fields.sql` - Host, word length, path fields
- `src/server/db/migrations/003_move_board_to_games.sql` - Shared board architecture
- `src/server/db/migrate.ts` - Migration runner
- `src/server/db/repositories/games.repository.ts` - Games repository
- `src/server/db/repositories/players.repository.ts` - Players repository
- `src/server/db/repositories/words.repository.ts` - Words repository
- `src/server/db/repositories/index.ts` - Barrel exports
- `src/server/db/index.ts` - Main db module export
- `src/server/db/__tests__/repositories.integration.test.ts` - Integration tests
- `src/app/api/db/migrate/route.ts` - Migration API endpoint
- `vitest.config.ts` - Test configuration
- `docs/DATABASE.md` - Comprehensive database documentation

**Additional Migrations Beyond Original Plan:**
- **Migration 002:** Added `host_id` (room ownership), `is_host` (player identification), `word_length` (scoring analytics), `path` (word validation coordinates)
- **Migration 003:** Moved `board` from game_players to games table - implements **shared board per room** (traditional Boggle rules)

**Notes:**
- Fixed TypeScript error by making timestamp fields optional in Create*Input types
- All success criteria met and verified:
  - ✅ Migration runs successfully (3 migrations applied)
  - ✅ All tables created with correct indexes (4 tables, 13 indexes)
  - ✅ Can connect to database from Next.js API routes (health check: database="up", schema="migrated")
  - ✅ Connection pooling configured (from Epic 1)
  - ✅ TypeScript types match database schema
  - ✅ Repository methods work (all integration tests passing)
- Database ready for game history persistence
- Ready to proceed to Epic 3 (Room Management System)

---

## Epic 3: Server-Side Core - Room Management System

**Objective:** Implement centralized room state management, creation, joining, and player tracking

**Deliverables:**
- `server/rooms-manager.ts` - In-memory room state management with Map structure
- `server/types.ts` - TypeScript types for Room, Player, WordSubmission
- Room creation API: `POST /api/rooms`
- Join room API: `POST /api/rooms/{code}/join`
- Leave room API: `POST /api/rooms/{code}/leave`
- Get room state API: `GET /api/rooms/{code}`
- 6-character unique room code generation
- Player management (add, remove, update)
- Host tracking and permissions
- Database integration for game history (optional, save finished games)

**Core Features:**
- Room state stored in `Map<string, Room>` on server (in-memory for performance)
- Room code generation: 6 alphanumeric characters (A-Z, 0-9)
- Minimum 2 players to start game
- Host-only controls (start game, select grid size)
- Player join/leave events emitted via Pusher
- Finished games persisted to PostgreSQL (via Epic 2 repositories)

**Pusher Events:**
- `player-joined` - New player joins waiting room
- `player-left` - Player leaves room

**Validation:**
- Zod schemas for API payloads
- Room code uniqueness validation (check in-memory + database)
- Max players limit (to be defined, suggest 8)
- Player name/avatar validation

**Files to Create:**
- `server/rooms-manager.ts` - Core room management logic
- `server/types.ts` - Shared TypeScript types
- `src/app/api/rooms/route.ts` - POST endpoint (create room)
- `src/app/api/rooms/[code]/route.ts` - GET endpoint (get room state)
- `src/app/api/rooms/[code]/join/route.ts` - POST endpoint (join room)
- `src/app/api/rooms/[code]/leave/route.ts` - POST endpoint (leave room)

**Database Integration (via Epic 2):**
- When game ends → save to `games` table
- Save players to `game_players` table
- Save words to `game_words` table
- Use repository pattern for data access

**Success Criteria:**
- Can create room and receive 6-character code
- Can join room with valid code
- Player list updates in real-time via Pusher
- Cannot join non-existent room
- Cannot start game with < 2 players
- Room state persists during server runtime
- Finished games are saved to database
- Database persistence works after server restart

**Testing Strategy:**
- Unit tests for room code generation uniqueness
- API integration tests for create/join/leave flows
- Pusher event emission verification
- Database repository integration tests

**Next Epic Trigger:** Room creation/joining working, players can see each other in waiting room, database persistence verified

---

## Epic 4: Server-Side Core - Spanish Dictionary & Word Validation

**Objective:** Load Spanish dictionary into memory, implement O(1) word validation, adjacency checking

**Deliverables:**
- `server/dictionary.ts` - Dictionary loader and validator
- `server/word-validator.ts` - Word validation logic (dictionary + adjacency)
- `server/board-generator.ts` - Board generation from Spanish letter frequencies
- Word validation API: `POST /api/games/{roomId}/words`
- Instant validation response with scoring

**Core Features:**
- Dictionary loaded once at server startup into `Set<string>`
- O(1) word lookup validation
- Adjacency validation (horizontal, vertical, diagonal)
- Path validation (no repeated cells in same word)
- Length-based scoring:
  - 3-4 letters: 1pt
  - 5 letters: 2pt
  - 6 letras: 3pt
  - 7+ letters: 5pt
- Duplicate word detection per player

**Spanish Letter Distribution:**
Based on frequency (E, A, O most common; W, K, X rare). Create weighted array for generation.

**Board Generation:**
- Grid sizes: 4×4, 5×5, 6×6
- Unique board per player
- Random generation with frequency weighting
- Returns `string[][]`

**Validation Logic:**
```typescript
interface WordSubmission {
  playerId: string
  word: string
  path: {row: number, col: number}[]
}

Validation checks:
1. Word length >= 3
2. Word exists in dictionary
3. Path length === word.length
4. Each step in path is adjacent to previous (max 1 row/col difference)
5. No repeated cells in path
6. Player hasn't already submitted this word
```

**Files to Create:**
- `server/dictionary.ts` - Dictionary loader and esValida() function
- `server/word-validator.ts` - Word validation with adjacency checking
- `server/board-generator.ts` - Board generation with Spanish letter frequencies
- `src/app/api/games/[roomId]/words/route.ts` - POST endpoint (submit word)

**Success Criteria:**
- Dictionary loads from `data/dictionary.json` on startup
- Valid Spanish words pass validation
- Invalid words rejected with reason
- Adjacency rules enforced correctly
- Duplicate submissions rejected per player
- Returns correct score based on word length
- Dictionary loads efficiently in Docker container

**Testing Strategy:**
- Unit tests for adjacency checking (valid/invalid paths)
- Unit tests for scoring logic
- Integration tests with real dictionary words
- Edge cases: minimum length, repeated cells, non-adjacent moves
- Performance test for dictionary load time

**Next Epic Trigger:** Word validation working correctly with scoring

---

## Epic 5: Real-Time Synchronization - Pusher Integration

**Objective:** Implement all Pusher event emission for game state synchronization

**Deliverables:**
- `server/pusher-client.ts` - Pusher server client singleton
- `server/event-emitter.ts` - Typed Pusher event emitters
- Client-side Pusher hook: `src/hooks/usePusherChannel.ts`
- Presence channels for each room
- Event handlers on client for all game events

**Pusher Events to Emit:**

**Waiting Room:**
- `player-joined` - `{player: Player}`
- `player-left` - `{playerId: string}`

**Game Start:**
- `game-started` - `{startTime: number, duration: number, board: string[][]}`

**Game End:**
- `game-ended` - `{endTime: number}`

**Results Phase:**
- `reveal-word` - `{word: string, player: Player, score: number, isUnique: boolean}`
- `results-complete` - `{finalRankings: Player[]}`

**Channel Naming:**
- `presence-game-{roomId}` - Main game channel with presence

**Client Integration:**
- Subscribe to channel on mount
- Unsubscribe on unmount
- Handle reconnection logic
- Type-safe event callbacks

**Files to Create:**
- `server/pusher-client.ts` - Pusher server client initialization
- `server/event-emitter.ts` - Typed event emitter functions
- `src/hooks/usePusherChannel.ts` - React hook for Pusher subscription
- `src/lib/pusher.ts` - Shared Pusher types and utilities

**Success Criteria:**
- All clients in same room receive events simultaneously
- Presence shows connected players
- No duplicate events on reconnection
- Events emit within 100ms of trigger
- Client gracefully handles connection loss
- Works correctly in Docker environment

**Testing Strategy:**
- Manual testing with multiple browser windows
- Event ordering verification
- Reconnection simulation
- Presence membership tracking
- Cross-container testing (if running multiple web containers)

**Next Epic Trigger:** Real-time events flowing between multiple clients

---

## Epic 6: Game Flow - Room Management UI (Landing & Waiting Room)

**Objective:** Build landing page and waiting room with real-time player list

**Deliverables:**
- Landing page: Create/Join room UI
- Waiting room page: Room code display, player list, host controls
- Grid size selector (4×4, 5×5, 6×6) - host only
- Start game button - host only
- Real-time player updates via Pusher
- Copy room code to clipboard

**Pages:**
- `src/app/page.tsx` - Landing page (root)
- `src/app/room/[code]/page.tsx` - Waiting room page

**Components:**
- `src/components/landing/CreateRoomForm.tsx` - Create room form
- `src/components/landing/JoinRoomForm.tsx` - Join with code form
- `src/components/waiting-room/RoomCodeDisplay.tsx` - Display code + copy button
- `src/components/waiting-room/PlayerList.tsx` - List of connected players
- `src/components/waiting-room/GridSizeSelector.tsx` - Host-only grid selector
- `src/components/waiting-room/StartGameButton.tsx` - Host-only start button

**UI Features:**
- Clean, modern landing with clear CTA
- Room code prominently displayed
- Player avatars (use emoji or simple icons)
- Player count indicator (e.g., "3/8 players")
- Host badge next to host name
- Loading states for API calls
- Error handling (invalid code, room full, etc.)

**State Management:**
- Local component state (forms)
- Pusher events for player list updates
- Query params for room code

**Validation:**
- Room code format validation (6 chars)
- Empty name handling
- API error display

**Files to Create:**
- `src/app/page.tsx` - Landing page
- `src/app/room/[code]/page.tsx` - Waiting room
- `src/components/landing/CreateRoomForm.tsx`
- `src/components/landing/JoinRoomForm.tsx`
- `src/components/waiting-room/RoomCodeDisplay.tsx`
- `src/components/waiting-room/PlayerList.tsx`
- `src/components/waiting-room/GridSizeSelector.tsx`
- `src/components/waiting-room/StartGameButton.tsx`

**Success Criteria:**
- Can create room and redirect to waiting room
- Can join room with code and see waiting room
- Player list updates in real-time when players join/leave
- Only host sees grid selector and start button
- Cannot start game with < 2 players
- Copy to clipboard works for room code
- Mobile-responsive layout

**Testing Strategy:**
- Visual regression testing for layouts
- Multi-browser testing for real-time updates
- Mobile viewport testing
- Form validation testing

**Next Epic Trigger:** Players can gather in waiting room and start game

---

## Epic 7: Game Flow - Active Game Phase

**Objective:** Build interactive game board with drag-to-select word input, timer, and real-time validation

**Deliverables:**
- Game page: Board, timer, current word HUD, word list
- Countdown 3-2-1 before game starts
- Touch/mouse drag interaction for selecting letters
- Visual line showing current selection path
- Real-time word validation feedback (✓/✗)
- Found words list with per-player visibility
- Synchronized timer
- Game end when timer reaches 0

**Pages:**
- `src/app/game/[roomId]/page.tsx` - Active game page

**Components:**
- `src/components/game/GameBoard.tsx` - Grid of letters with drag interaction
- `src/components/game/CurrentWordDisplay.tsx` - HUD showing current word + validity
- `src/components/game/Timer.tsx` - Synchronized countdown timer
- `src/components/game/FoundWordsList.tsx` - List of found words (per player)
- `src/components/game/Countdown.tsx` - 3-2-1 countdown overlay

**Interaction Logic:**
1. Touch/mouse down on first letter → start selection
2. Drag to adjacent letters → add to path, show line
3. Only allow adjacent moves (highlight valid neighbors)
4. Prevent selecting same cell twice
5. Release → submit word to server
6. Show feedback (shake animation for invalid, checkmark for valid)

**HUD Layout:**
- Top 30% of screen
- Center: Timer (large, prominent)
- Below timer: Current word being formed
- Right side: Validity indicator (✓ green / ✗ red)
- Corner: Found words count

**Validation Feedback:**
- While dragging: Word appears with gray indicator
- On release:
  - Valid + new: Green check, word added to list, success animation
  - Invalid: Red X, shake animation, "no válida" message
  - Duplicate: Yellow warning, "ya encontrada" message

**Found Words Display:**
- Only show current player's found words
- List with score per word
- Scrollable if many words
- Newest words at top

**Files to Create:**
- `src/app/game/[roomId]/page.tsx` - Game page
- `src/components/game/GameBoard.tsx` - Board grid with interaction
- `src/components/game/CurrentWordDisplay.tsx` - HUD word display
- `src/components/game/Timer.tsx` - Countdown timer
- `src/components/game/FoundWordsList.tsx` - Player's found words
- `src/components/game/Countdown.tsx` - 3-2-1 overlay

**Success Criteria:**
- Countdown displays correctly on all clients
- Timer synchronized within 1s across all clients
- Drag interaction feels smooth and responsive
- Visual feedback is immediate and clear
- Word validation matches server rules
- Game ends when timer reaches 0
- Board locks after game ends

**Testing Strategy:**
- Multi-device timer synchronization testing
- Touch interaction testing on mobile
- Mouse interaction testing on desktop
- Word validation accuracy testing
- Edge cases: rapid drag, diagonal moves, release outside board

**Next Epic Trigger:** Full game playable from start to timer end

---

## Epic 8: Game Flow - Results & Scoring Phase

**Objective:** Build animated results screen with sequential word reveal and final ranking

**Deliverables:**
- Results page: Stairs/steps layout, avatars, word reveal animation
- Sequential word reveal (1-2s delay between words)
- Player avatar climbs stairs as points accumulate
- Unique word indicator with ×2 bonus
- Final ranking with winner highlight
- Play again button (optional, host-only)
- Game history saved to database

**Pages:**
- `src/app/results/[roomId]/page.tsx` - Results page

**Components:**
- `src/components/results/ScoreStairs.tsx` - Visual stairs/stepped display
- `src/components/results/PlayerAvatar.tsx` - Avatar with current score
- `src/components/results/WordReveal.tsx` - Individual word reveal card
- `src/components/results/FinalRanking.tsx` - Final standings display
- `src/components/results/PlayAgainButton.tsx` - Host-only restart button

**Visual Design:**
- Stairs/steps layout: Players at bottom, steps going up
- Each word reveal:
  1. Word card appears with player avatar
  2. Points shown (e.g., "+3")
  3. Si es única: "¡ÚNICA!" badge + "×2"
  4. Player's avatar climbs that many steps
  5. Player's score updates
- After all words: Show final ranking table
- Highlight winner with crown/trophy

**Reveal Logic:**
- Server emits `reveal-word` events sequentially (1-2s apart)
- Each event contains: word, player, score, isUnique
- Client queues and displays in order
- After all reveals: `results-complete` event
- Animate from stairs to final ranking view

**Animations:**
- Word fade-in + slide up
- Avatar climb with smooth transition
- Score increment counter
- Unique word pulse/glow effect
- Winner celebration (confetti optional)

**Unique Word Calculation:**
- Server analyzes all found words across all players
- If word found by only 1 player: isUnique = true
- Score doubles for unique words
- Calculated after game ends, before reveal

**Database Integration:**
- When results complete → save game to database
- Use Epic 2 repositories to persist:
  - Game record (room code, duration, final scores)
  - Player records (names, final scores, words found)
  - Word records (each word found, with player and score)

**Files to Create:**
- `src/app/results/[roomId]/page.tsx` - Results page
- `src/components/results/ScoreStairs.tsx` - Stairs layout
- `src/components/results/PlayerAvatar.tsx` - Avatar component
- `src/components/results/WordReveal.tsx` - Word reveal card
- `src/components/results/FinalRanking.tsx` - Final standings
- `src/components/results/PlayAgainButton.tsx` - Restart button

**Success Criteria:**
- Sequential reveal plays smoothly with correct timing
- Avatars climb correct number of steps per word
- Unique words clearly identified with ×2
- Final ranking shows correct scores
- Winner is prominently highlighted
- Animation feels satisfying and dramatic
- Works on mobile screens
- Game history correctly saved to PostgreSQL

**Testing Strategy:**
- Multi-client reveal synchronization
- Animation performance testing
- Score calculation verification
- Unique word detection accuracy
- Mobile viewport testing for stairs layout
- Database persistence verification

**Next Epic Trigger:** Results displayed correctly with animations, database persistence working

---

## Epic 9: Polish & Animations

**Objective:** Add visual polish, micro-interactions, animations, and accessibility improvements

**Deliverables:**
- Page transitions (fade, slide)
- Button hover/active states
- Loading spinners/skeletons
- Success/error animations
- Sound effects (optional, can be separate epic)
- Accessibility improvements (ARIA labels, keyboard navigation)
- Responsive design refinements
- Error boundary implementation
- Dark mode support (optional)

**Components to Polish:**
- Landing page CTAs
- Room code copy feedback
- Player list join animations
- Countdown animation
- Word selection line glow
- Valid word success burst
- Invalid word shake
- Results reveal timing adjustments

**Performance:**
- Optimize re-renders with React Compiler
- Lazy load heavy components
- Optimize dictionary loading (lazy if needed)
- Pusher event throttling if necessary
- Image optimization for avatars
- Docker build optimization (multi-stage builds)

**Accessibility:**
- ARIA labels for all interactive elements
- Keyboard navigation for board (arrow keys + enter)
- Focus management on page transitions
- Screen reader announcements for game events
- Color contrast WCAG AA compliance
- Touch target sizes (min 44×44px)

**Error Handling:**
- Boundary components for each page
- Graceful Pusher reconnection
- Network error handling with retry
- Server error messages in Spanish
- Fallback for missing Pusher events
- Database connection error handling

**Files to Modify:**
- All component files from previous epics
- `src/app/layout.tsx` - Global styles and error boundary
- Add animation library if needed (Framer Motion or CSS)

**Docker Optimization:**
- Optimize Dockerfile layers
- Use .dockerignore properly
- Multi-stage build for production
- Health checks for web service

**Success Criteria:**
- Smooth 60fps animations
- No layout shifts during transitions
- All interactions have visual feedback
- Keyboard navigation works end-to-end
- Screen reader can play game independently
- Mobile touch targets are properly sized
- Error states are handled gracefully
- Docker image size is optimized

**Testing Strategy:**
- Lighthouse accessibility audit
- Keyboard-only playthrough testing
- Screen reader testing (NVDA/VoiceOver)
- Animation performance profiling
- Cross-browser testing
- Network throttling testing
- Docker build performance testing

**Next Epic Trigger:** Polish complete, ready for production

---

## Epic 10: Testing & Deployment

**Objective:** Comprehensive testing suite and production deployment setup

**Deliverables:**
- Unit tests for core logic (dictionary, validation, board generation)
- Integration tests for API routes
- E2E tests for critical user flows (Playwright)
- Load testing for room management
- Production Docker configuration
- Deployment configuration (Vercel/Railway/AWS)
- Environment variable documentation
- Monitoring setup (optional)

**Unit Tests:**
- `server/__tests__/dictionary.test.ts` - Word validation
- `server/__tests__/board-generator.test.ts` - Board generation
- `server/__tests__/word-validator.test.ts` - Adjacency validation
- `server/__tests__/rooms-manager.test.ts` - Room state management
- `server/db/__tests__/repositories.test.ts` - Database repositories

**Integration Tests:**
- Room creation and joining flow
- Word submission and scoring
- Pusher event emission (mocked)
- Game state transitions
- Database persistence

**E2E Tests (Playwright):**
- Create room → join → start game → play word → finish → see results
- Multi-player scenario (2+ browser contexts)
- Invalid word submission
- Reconnection scenario
- Mobile viewport flow

**Load Testing:**
- 100 concurrent rooms
- 8 players per room
- Word submission rate (10 words/sec per player)
- Memory usage monitoring
- Pusher message rate limits
- Database connection pool stress testing

**Production Deployment:**

**Option 1: Vercel (simplest)**
- Deploy Next.js to Vercel
- Use managed PostgreSQL (Vercel Postgres or Supabase)
- Pusher for real-time (already external)
- Environment variables via Vercel dashboard

**Option 2: Self-hosted with Docker**
- Deploy docker-compose to server (AWS Lightsail, DigitalOcean)
- PostgreSQL container with volume
- Nginx reverse proxy
- SSL with Let's Encrypt

**Option 3: Kubernetes (for scale)**
- Container registry setup
- Kubernetes manifests
- Ingress controller
- Managed PostgreSQL (RDS)

**Files to Create:**
- `server/__tests__/` - Unit test files
- `tests/e2e/` - E2E test files
- `Dockerfile.prod` - Production Dockerfile (optimized)
- `docker-compose.prod.yml` - Production compose
- `vercel.json` or `.platform.yaml` - Deployment config
- `DEPLOYMENT.md` - Deployment guide
- `.env.example` - Updated with all variables
- `nginx.conf` - Reverse proxy config (if self-hosting)

**Success Criteria:**
- 80%+ code coverage
- All E2E tests passing
- Can handle 100+ concurrent players
- Deployed to production successfully
- Database backups configured
- SSL certificates working
- Monitoring configured (if applicable)

**Testing Strategy:**
- Run unit tests in CI/CD
- Run E2E tests before deployment
- Manual QA with real users
- Beta test with small group
- Load testing before major releases

**Next Epic Trigger:** Production-ready with comprehensive test coverage

---

## Epic 11: DevOps & Monitoring (Production-Ready)

**Objective:** Set up production infrastructure, monitoring, logging, and automated backups

**Deliverables:**
- Production Docker configuration
- CI/CD pipeline (GitHub Actions)
- Database backup strategy
- Application monitoring (error tracking, performance)
- Log aggregation
- Health checks
- SSL/HTTPS setup
- Scaling strategy

**CI/CD Pipeline:**
- GitHub Actions workflow
- Run tests on PR
- Build Docker image on merge
- Deploy to staging/production
- Automated database migrations

**Monitoring:**
- Error tracking (Sentry or similar)
- Performance monitoring (Vercel Analytics or custom)
- Uptime monitoring
- Database performance metrics
- Pusher quota monitoring

**Backups:**
- Automated PostgreSQL backups (daily)
- Backup retention policy (30 days)
- Restore procedure documented
- Disaster recovery plan

**Health Checks:**
- `/api/health` endpoint
- Database connection check
- Pusher connection check
- Docker health checks
- Load balancer health checks

**Files to Create:**
- `.github/workflows/ci.yml` - CI/CD pipeline
- `.github/workflows/deploy.yml` - Deployment workflow
- `server/health.ts` - Health check endpoint
- `scripts/backup-db.sh` - Database backup script
- `docker-compose.prod.yml` - Production compose with monitoring
- `MONITORING.md` - Monitoring setup guide

**Success Criteria:**
- CI/CD pipeline runs successfully
- Tests pass automatically on PR
- Deployments are automated
- Database backups run daily
- Monitoring alerts configured
- Health checks responding
- SSL certificates valid and auto-renewing

**Testing Strategy:**
- CI/CD pipeline testing
- Disaster recovery drill
- Backup restoration testing
- Load testing production infrastructure

**Next Epic Trigger:** Production infrastructure fully operational

---

## Epic 12: Post-Launch Features (Future)

**Objective:** Nice-to-have features for future iterations after MVP launch

**Potential Features:**
- Custom room durations
- Game mode variations (themes, special tiles)
- Player statistics and history (from database)
- Rematch functionality
- Spectator mode
- Replay best words
- Sound effects and music
- Localization (English, Portuguese)
- Social sharing of results
- Push notifications for game starting
- Profile pictures upload
- Achievements/badges
- Leaderboards (from database history)
- Analytics dashboard (game statistics)
- Tournament mode

**Note:** These are NOT part of initial MVP. Implement after core game is stable and user feedback is collected.

---

## Implementation Order Recommendation

### Phase 1: Foundation (Week 1)
1. **Epic 1** (Docker & Infrastructure) - MUST BE FIRST
2. **Epic 2** (Database Schema) - After Epic 1

### Phase 2: Core Server (Week 2)
3. **Epic 3** (Room Management) + **Epic 4** (Word Validation) - Can be parallel
4. **Epic 5** (Pusher Integration) - After Epic 3

### Phase 3: Core UI (Week 3)
5. **Epic 6** (Landing/Waiting UI) - After Epic 3, 5
6. **Epic 7** (Active Game) - After Epic 4, 5, 6

### Phase 4: Complete Game Loop (Week 4)
7. **Epic 8** (Results) - After Epic 7

### Phase 5: Polish & Launch (Week 5-6)
8. **Epic 9** (Polish) - Can be done incrementally alongside 6-8
9. **Epic 10** (Testing/Deployment) - After all features complete
10. **Epic 11** (DevOps/Monitoring) - After Epic 10, before full launch

### Phase 6: Post-Launch (Future)
11. **Epic 12** (Post-Launch Features) - Future iterations

---

## Docker Development Workflow

### Daily Development
```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f web

# Stop services
docker compose down

# Rebuild after dependency changes
docker compose up -d --build web
```

### Database Management
```bash
# Access PostgreSQL directly
docker compose exec db psql -U boggle_user -d boggle_party

# Run migrations
docker compose exec web node server/db/migrate.js

# Backup database
docker compose exec db pg_dump -U boggle_user boggle_party > backup.sql
```

### Troubleshooting
```bash
# Check container status
docker compose ps

# Restart specific service
docker compose restart web

# Clean slate (remove volumes)
docker compose down -v
docker compose up -d --build
```

---

## Next Steps

Each epic above should be expanded into a detailed implementation plan using the superpowers:writing-plans skill. The detailed plans will include:

- Exact file paths for every component
- Step-by-step implementation tasks (2-5 minutes each)
- Complete code snippets
- Docker configuration details
- Test cases with expected outputs
- Commit messages for each task
- Dependencies between tasks

**Recommended Starting Point:** Begin with **Epic 1 (Project Foundation, Docker & Infrastructure)** to set up the development environment, Docker containers, and dependencies.

---

**End of Epic Plan**
