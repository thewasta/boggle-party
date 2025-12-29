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
- Each player gets a unique board generated from Spanish letter frequency distribution
- Server-side validation prevents cheating
- Room state stored in server memory (Map structure)

## Development Commands

**Use `pnpm` for all package management - never npm.**

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run Biome linter
pnpm format           # Format code with Biome
```

**Biome is used for linting and formatting**, not ESLint/Prettier. It automatically organizes imports on save.

## Package Manager

**ALWAYS use `pnpm`, never npm.** When you encounter `npx` commands, use the pnpm equivalent instead (e.g., `pnpm dlx` instead of `npx`).

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
  board: string[][]         // Unique grid per player
}
```

### Spanish Dictionary

Located at `data/dictionary.json` (7.9MB), loaded into server memory on startup. Source: `an-array-of-spanish-words` npm package.

Letter distribution follows Spanish frequency (E, A, O most common; W, K, X rare).

## Environment Variables Required

```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                    # Shared utilities
├── types/                  # TypeScript type definitions
└── styles/                 # Global styles (if needed)

server/                     # Server-side code
├── dictionary.ts           # Spanish dictionary loader
├── rooms-manager.ts        # Room state management
└── board-generator.ts      # Board generation logic

data/
└── dictionary.json         # Spanish words dictionary
```

## Important Implementation Notes

- **Grid size determines game duration**: 4×4=2min, 5×5=3min, 6×6=6min
- **Each player has a unique board** - generated when game starts, not shared
- **Minimum 2 players required** to start a game
- **Word submission includes path**: Array of {row, col} coordinates to validate adjacency
- **Sequential word reveal**: Server emits `reveal-word` events one by one with 1-2s delay for dramatic effect
- **Touch interaction**: Touch-drag-release to select letters, visual line shows current selection

## Dependencies to Install

The project needs these additional packages (not yet installed):

```bash
pnpm add pusher pusher-js zod nanoid
pnpm add -D @types/pusher-js
```

## Path Aliases

`@/*` maps to `./src/*` - use this for imports (e.g., `@/components/GameBoard`)

## React Compiler

The project uses React Compiler (`reactCompiler: true` in next.config.ts) - optimize for automatic memoization.
