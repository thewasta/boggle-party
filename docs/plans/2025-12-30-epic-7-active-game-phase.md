# Epic 7: Game Flow - Active Game Phase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Status:** ✅ Completed
**Completed:** 2025-12-30

**Goal:** Build an interactive game board with drag-to-select word input, synchronized timer, countdown overlay, and real-time word validation for the active game phase.

**Architecture:** Client-side game page with React state management for selection tracking, Pusher real-time events for synchronization, server-side word validation API endpoint, and SVG-based visual path rendering on the board.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Pusher Channels, frontend-design plugin (REQUIRED for all UI components)

---

## File Structure Overview

```
src/
├── app/
│   └── game/
│       └── [roomId]/
│           └── page.tsx                    # CREATE - Active game page
├── components/
│   └── game/
│       ├── GameBoard.tsx                   # CREATE - Board grid with drag interaction
│       ├── CurrentWordDisplay.tsx          # CREATE - HUD showing current word + validity
│       ├── Timer.tsx                       # CREATE - Synchronized countdown timer
│       ├── FoundWordsList.tsx              # CREATE - Player's found words
│       └── Countdown.tsx                   # CREATE - 3-2-1 countdown overlay
├── hooks/
│   └── useGameSync.ts                      # CREATE - Hook for game state synchronization
├── lib/
│   └── board-utils.ts                      # CREATE - Board geometry & adjacency utilities
└── types/
    └── game.ts                             # CREATE - Game-specific types
```

---

## Task 1: Create Game-Specific Types

**Files:**
- Create: `src/types/game.ts`

**Step 1: Write the type definitions**

```typescript
/**
 * Game-specific type definitions for the active game phase
 */

import type { Cell } from '@/server/types';

/**
 * Represents a selected cell with its visual position
 */
export interface SelectedCell extends Cell {
  x: number;  // Visual X coordinate for line rendering
  y: number;  // Visual Y coordinate for line rendering
}

/**
 * Current word selection state
 */
export interface WordSelection {
  cells: SelectedCell[];
  currentWord: string;
  isValid: boolean | null;  // null = not yet validated
}

/**
 * Word validation feedback state
 */
export type WordValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'duplicate';

/**
 * Game state from server
 */
export interface GameState {
  roomId: string;
  roomCode: string;
  board: string[][];
  startTime: number;
  duration: number;
  gridSize: 4 | 5 | 6;
  playerId: string;
}

/**
 * Timer state
 */
export interface TimerState {
  remaining: number;      // Seconds remaining
  isPaused: boolean;
  isExpired: boolean;
}

/**
 * Found word with metadata
 */
export interface FoundWord {
  word: string;
  score: number;
  timestamp: number;
}
```

**Step 2: Create the file**

Run: `cat > src/types/game.ts` (paste content above)

**Step 3: Verify file created**

Run: `ls -la src/types/game.ts`
Expected: File exists

**Step 4: Commit**

```bash
git add src/types/game.ts
git commit -m "feat(game): add game-specific type definitions"
```

---

## Task 2: Create Board Utilities (Adjacency & Geometry)

**Files:**
- Create: `src/lib/board-utils.ts`
- Test: `src/lib/board-utils.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from '@jest/globals';
import { getAdjacentCells, areCellsAdjacent, calculateCellPosition } from '../board-utils';

describe('board-utils', () => {
  describe('getAdjacentCells', () => {
    it('returns all 8 adjacent cells for interior position', () => {
      const result = getAdjacentCells({ row: 1, col: 1 }, 4);
      expect(result).toHaveLength(8);
      expect(result).toContainEqual({ row: 0, col: 0 });
      expect(result).toContainEqual({ row: 0, col: 1 });
      expect(result).toContainEqual({ row: 0, col: 2 });
      expect(result).toContainEqual({ row: 1, col: 0 });
      expect(result).toContainEqual({ row: 1, col: 2 });
      expect(result).toContainEqual({ row: 2, col: 0 });
      expect(result).toContainEqual({ row: 2, col: 1 });
      expect(result).toContainEqual({ row: 2, col: 2 });
    });

    it('handles corner positions correctly', () => {
      const result = getAdjacentCells({ row: 0, col: 0 }, 4);
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ row: 0, col: 1 });
      expect(result).toContainEqual({ row: 1, col: 0 });
      expect(result).toContainEqual({ row: 1, col: 1 });
    });

    it('handles edge positions correctly', () => {
      const result = getAdjacentCells({ row: 0, col: 1 }, 4);
      expect(result).toHaveLength(5);
    });
  });

  describe('areCellsAdjacent', () => {
    it('returns true for horizontally adjacent cells', () => {
      expect(areCellsAdjacent({ row: 1, col: 1 }, { row: 1, col: 2 })).toBe(true);
    });

    it('returns true for vertically adjacent cells', () => {
      expect(areCellsAdjacent({ row: 1, col: 1 }, { row: 2, col: 1 })).toBe(true);
    });

    it('returns true for diagonally adjacent cells', () => {
      expect(areCellsAdjacent({ row: 1, col: 1 }, { row: 2, col: 2 })).toBe(true);
    });

    it('returns false for non-adjacent cells', () => {
      expect(areCellsAdjacent({ row: 0, col: 0 }, { row: 2, col: 2 })).toBe(false);
    });

    it('returns false for same cell', () => {
      expect(areCellsAdjacent({ row: 1, col: 1 }, { row: 1, col: 1 })).toBe(false);
    });
  });

  describe('calculateCellPosition', () => {
    it('calculates center position for cell', () => {
      const result = calculateCellPosition(1, 1, 80, 10);
      expect(result.x).toBeCloseTo(90);  // col * (size + gap) + size / 2
      expect(result.y).toBeCloseTo(90);
    });

    it('handles different cell sizes', () => {
      const result = calculateCellPosition(0, 0, 60, 8);
      expect(result.x).toBeCloseTo(30);
      expect(result.y).toBeCloseTo(30);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/board-utils.test.ts`
Expected: FAIL with "module not found"

**Step 3: Write minimal implementation**

```typescript
/**
 * Board geometry and adjacency utilities for the game board
 */

import type { Cell } from '@/server/types';

const GRID_DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1],
];

/**
 * Get all valid adjacent cells for a given position
 */
export function getAdjacentCells(cell: Cell, gridSize: number): Cell[] {
  const adjacent: Cell[] = [];

  for (const [dr, dc] of GRID_DIRECTIONS) {
    const newRow = cell.row + dr;
    const newCol = cell.col + dc;

    if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
      adjacent.push({ row: newRow, col: newCol });
    }
  }

  return adjacent;
}

/**
 * Check if two cells are adjacent (including diagonals)
 */
export function areCellsAdjacent(cell1: Cell, cell2: Cell): boolean {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);

  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Calculate the visual center position of a cell
 * Used for drawing lines between selected cells
 */
export function calculateCellPosition(
  row: number,
  col: number,
  cellSize: number,
  gap: number
): { x: number; y: number } {
  const x = col * (cellSize + gap) + cellSize / 2;
  const y = row * (cellSize + gap) + cellSize / 2;

  return { x, y };
}

/**
 * Get cell from row/col coordinates (touch/mouse event handling)
 */
export function getCellFromCoordinates(
  x: number,
  y: number,
  cellSize: number,
  gap: number,
  gridSize: number
): Cell | null {
  const totalSize = cellSize + gap;
  const col = Math.floor(x / totalSize);
  const row = Math.floor(y / totalSize);

  if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
    return { row, col };
  }

  return null;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/board-utils.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/board-utils.ts src/lib/board-utils.test.ts
git commit -m "feat(game): add board geometry utilities"
```

---

## Task 3: Create useGameSync Hook

**Files:**
- Create: `src/hooks/useGameSync.ts`

**Step 1: Write the hook implementation**

```typescript
/**
 * Hook for synchronizing game state with Pusher real-time events
 * Handles countdown, timer sync, and game-end transitions
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePusherChannel } from './usePusherChannel';
import type { GameState, TimerState } from '@/types/game';

interface UseGameSyncOptions {
  roomId: string;
  playerId: string;
  onGameEnd?: () => void;
}

interface UseGameSyncReturn {
  gameState: GameState | null;
  timerState: TimerState;
  isSynced: boolean;
}

export function useGameSync({
  roomId,
  playerId,
  onGameEnd,
}: UseGameSyncOptions): UseGameSyncReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({
    remaining: 0,
    isPaused: true,
    isExpired: false,
  });
  const [isSynced, setIsSynced] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const serverTimeOffsetRef = useRef<number>(0);

  // Synchronize timer with server time
  useEffect(() => {
    if (!gameState?.startTime) return;

    // Calculate offset between client and server time
    const serverStartTime = gameState.startTime;
    const clientNow = Date.now();
    serverTimeOffsetRef.current = serverStartTime - clientNow;

    setIsSynced(true);
  }, [gameState?.startTime]);

  // Update timer every 100ms for smooth countdown
  useEffect(() => {
    if (!gameState?.startTime || timerState.isPaused || timerState.isExpired) {
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const clientNow = Date.now();
      const serverNow = clientNow + serverTimeOffsetRef.current;
      const elapsed = (serverNow - gameState.startTime) / 1000;
      const remaining = Math.max(0, gameState.duration - elapsed);

      setTimerState({
        remaining: Math.ceil(remaining),
        isPaused: false,
        isExpired: remaining <= 0,
      });

      if (remaining <= 0) {
        onGameEnd?.();
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState, timerState.isPaused, timerState.isExpired, onGameEnd]);

  // Handle game-ended event
  const handleGameEnded = useCallback(() => {
    setTimerState((prev) => ({ ...prev, remaining: 0, isExpired: true }));
    onGameEnd?.();
  }, [onGameEnd]);

  // Subscribe to Pusher events (read-only, no word submission)
  usePusherChannel(roomId, {
    onGameEnded: handleGameEnded,
  });

  return {
    gameState,
    timerState,
    isSynced,
  };
}

/**
 * Set the game state (called by game page on initial load)
 */
export function useGameStateSync() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  return {
    gameState,
    setGameState,
  };
}
```

**Step 2: Create the file**

Run: `cat > src/hooks/useGameSync.ts` (paste content above)

**Step 3: Verify file created**

Run: `ls -la src/hooks/useGameSync.ts`
Expected: File exists

**Step 4: Commit**

```bash
git add src/hooks/useGameSync.ts
git commit -m "feat(game): add game synchronization hook"
```

---

## Task 4: Create Countdown Overlay Component

**Files:**
- Create: `src/components/game/Countdown.tsx`

**Step 1: Write component implementation**

IMPORTANT: Use the `frontend-design` plugin/skill to create this component with high-quality, polished UI.

```typescript
/**
 * Countdown overlay component (3-2-1) displayed before game starts
 * Uses full-screen overlay with large animated numbers
 */

"use client";

import { useEffect, useState } from 'react';

interface CountdownProps {
  onComplete: () => void;
}

export function Countdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState<3 | 2 | 1 | 'go'>(3);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof count === 'number') {
        if (count === 1) {
          setCount('go');
        } else {
          setCount((count - 1) as 3 | 2 | 1);
        }
      } else {
        setIsVisible(false);
        setTimeout(onComplete, 300); // Wait for exit animation
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="animate-scale-in">
        {count === 'go' ? (
          <div className="text-9xl font-black text-green-400 drop-shadow-2xl animate-pulse">
            ¡YA!
          </div>
        ) : (
          <div className="text-9xl font-black text-white drop-shadow-2xl">
            {count}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create the component file**

Run: `cat > src/components/game/Countdown.tsx` (paste content above)

**Step 3: Add animation to globals.css**

Add to `src/app/globals.css`:

```css
@keyframes scale-in {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.animate-scale-in {
  animation: scale-in 0.5s ease-out;
}
```

**Step 4: Verify files created**

Run: `ls -la src/components/game/Countdown.tsx`
Expected: File exists

**Step 5: Commit**

```bash
git add src/components/game/Countdown.tsx src/app/globals.css
git commit -m "feat(game): add countdown overlay component"
```

---

## Task 5: Create Timer Component

**Files:**
- Create: `src/components/game/Timer.tsx`

**Step 1: Write component implementation**

IMPORTANT: Use the `frontend-design` plugin/skill to create this component with high-quality, polished UI.

```typescript
/**
 * Timer component - displays synchronized countdown
 * Large prominent display, changes color as time runs low
 */

"use client";

import type { TimerState } from '@/types/game';

interface TimerProps {
  timerState: TimerState;
}

export function Timer({ timerState }: TimerProps) {
  const { remaining, isPaused } = timerState;

  // Format time as MM:SS
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Color changes based on remaining time
  const getTimeColor = () => {
    if (remaining <= 10) return 'text-red-600 animate-pulse';
    if (remaining <= 30) return 'text-orange-500';
    return 'text-indigo-900';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-7xl font-black tracking-tight ${getTimeColor()}`}>
        {formatted}
      </div>
      {isPaused && (
        <div className="text-sm font-semibold text-zinc-500">Pausado</div>
      )}
    </div>
  );
}
```

**Step 2: Create the component file**

Run: `cat > src/components/game/Timer.tsx` (paste content above)

**Step 3: Verify file created**

Run: `ls -la src/components/game/Timer.tsx`
Expected: File exists

**Step 4: Commit**

```bash
git add src/components/game/Timer.tsx
git commit -m "feat(game): add timer component"
```

---

## Task 6: Create CurrentWordDisplay Component (HUD)

**Files:**
- Create: `src/components/game/CurrentWordDisplay.tsx`

**Step 1: Write component implementation**

IMPORTANT: Use the `frontend-design` plugin/skill to create this component with high-quality, polished UI.

```typescript
/**
 * Current Word Display (HUD)
 * Shows the word being formed with validation feedback
 */

"use client";

import type { WordValidationStatus } from '@/types/game';

interface CurrentWordDisplayProps {
  currentWord: string;
  validationStatus: WordValidationStatus;
  wordCount: number;
}

export function CurrentWordDisplay({
  currentWord,
  validationStatus,
  wordCount,
}: CurrentWordDisplayProps) {
  const getStatusIndicator = () => {
    switch (validationStatus) {
      case 'valid':
        return <span className="text-green-500 text-3xl">✓</span>;
      case 'invalid':
        return <span className="text-red-500 text-3xl">✗</span>;
      case 'duplicate':
        return <span className="text-yellow-500 text-2xl">⚠</span>;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (validationStatus) {
      case 'invalid':
        return <span className="text-red-600 font-semibold">No válida</span>;
      case 'duplicate':
        return <span className="text-yellow-600 font-semibold">Ya encontrada</span>;
      default:
        return null;
    }
  };

  const getWordColor = () => {
    if (currentWord.length === 0) return 'text-zinc-400';
    switch (validationStatus) {
      case 'valid':
        return 'text-green-700';
      case 'invalid':
        return 'text-red-700';
      case 'duplicate':
        return 'text-yellow-700';
      default:
        return 'text-indigo-900';
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-200 p-6">
        {/* Word count badge */}
        <div className="flex justify-end mb-2">
          <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
            {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'}
          </span>
        </div>

        {/* Current word display */}
        <div className="flex items-center justify-center gap-4">
          <div className={`text-4xl font-bold tracking-wider ${getWordColor()} min-h-[48px]`}>
            {currentWord || '-'}
          </div>
          {getStatusIndicator()}
        </div>

        {/* Status message */}
        {getStatusMessage() && (
          <div className="text-center mt-2">
            {getStatusMessage()}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create the component file**

Run: `cat > src/components/game/CurrentWordDisplay.tsx` (paste content above)

**Step 3: Verify file created**

Run: `ls -la src/components/game/CurrentWordDisplay.tsx`
Expected: File exists

**Step 4: Commit**

```bash
git add src/components/game/CurrentWordDisplay.tsx
git commit -m "feat(game): add current word display HUD component"
```

---

## Task 7: Create FoundWordsList Component

**Files:**
- Create: `src/components/game/FoundWordsList.tsx`

**Step 1: Write component implementation**

IMPORTANT: Use the `frontend-design` plugin/skill to create this component with high-quality, polished UI.

```typescript
/**
 * Found Words List - displays current player's found words
 * Scrollable, newest words at top, shows score per word
 */

"use client";

import type { FoundWord } from '@/types/game';

interface FoundWordsListProps {
  words: FoundWord[];
}

export function FoundWordsList({ words }: FoundWordsListProps) {
  // Sort by timestamp descending (newest first)
  const sortedWords = [...words].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="w-full max-w-xs">
      <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-4">
        <h3 className="text-lg font-bold text-purple-900 mb-3">
          Tus Palabras
        </h3>

        {sortedWords.length === 0 ? (
          <p className="text-center text-zinc-500 py-8 text-sm">
            Arrastra para formar palabras
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {sortedWords.map((item) => (
              <div
                key={`${item.word}-${item.timestamp}`}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
              >
                <span className="font-bold text-green-800">
                  {item.word}
                </span>
                <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  +{item.score}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Total score */}
        {words.length > 0 && (
          <div className="mt-4 pt-4 border-t-2 border-purple-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900">Total</span>
              <span className="text-xl font-black text-purple-700">
                {words.reduce((sum, w) => sum + w.score, 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create the component file**

Run: `cat > src/components/game/FoundWordsList.tsx` (paste content above)

**Step 3: Verify file created**

Run: `ls -la src/components/game/FoundWordsList.tsx`
Expected: File exists

**Step 4: Commit**

```bash
git add src/components/game/FoundWordsList.tsx
git commit -m "feat(game): add found words list component"
```

---

## Task 8: Create GameBoard Component (Complex - Drag Interaction)

**Files:**
- Create: `src/components/game/GameBoard.tsx`

**Step 1: Write component implementation**

IMPORTANT: Use the `frontend-design` plugin/skill to create this component with high-quality, polished UI.

```typescript
/**
 * GameBoard - Interactive Boggle board with drag-to-select
 * Handles touch/mouse events for word selection
 * Renders visual path between selected cells
 */

"use client";

import { useRef, useCallback, useState, useMemo } from 'react';
import type { Cell, SelectedCell, WordSelection } from '@/types/game';
import { getAdjacentCells, calculateCellPosition, getCellFromCoordinates } from '@/lib/board-utils';

interface GameBoardProps {
  board: string[][];
  selection: WordSelection;
  onSelectionStart: (cell: SelectedCell) => void;
  onSelectionMove: (cell: SelectedCell) => void;
  onSelectionEnd: () => void;
  isLocked: boolean;
}

const CELL_SIZE = 70;
const CELL_GAP = 8;

export function GameBoard({
  board,
  selection,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd,
  isLocked,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastCellRef = useRef<Cell | null>(null);

  const gridSize = board.length;

  // Create lookup for selected cells
  const selectedCellsSet = useMemo(() => {
    return new Set(selection.cells.map((c) => `${c.row},${c.col}`));
  }, [selection.cells]);

  /**
   * Check if a cell can be added to selection (adjacent to last cell)
   */
  const canAddCell = useCallback((cell: Cell): boolean => {
    if (selectedCellsSet.has(`${cell.row},${cell.col}`)) {
      return false; // Already selected
    }

    if (selection.cells.length === 0) {
      return true; // First cell
    }

    const lastCell = selection.cells[selection.cells.length - 1];
    const adjacent = getAdjacentCells(lastCell, gridSize);

    return adjacent.some((a) => a.row === cell.row && a.col === cell.col);
  }, [selectedCellsSet, selection.cells, gridSize]);

  /**
   * Get selected cell with visual position
   */
  const getSelectedCell = useCallback((cell: Cell): SelectedCell => {
    const pos = calculateCellPosition(cell.row, cell.col, CELL_SIZE, CELL_GAP);
    return { ...cell, x: pos.x, y: pos.y };
  }, []);

  /**
   * Handle pointer down (start selection)
   */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isLocked) return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cell = getCellFromCoordinates(x, y, CELL_SIZE, CELL_GAP, gridSize);
    if (!cell) return;

    setIsDragging(true);
    lastCellRef.current = cell;

    const selectedCell = getSelectedCell(cell);
    onSelectionStart(selectedCell);

    // Prevent scrolling on touch
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isLocked, gridSize, getSelectedCell, onSelectionStart]);

  /**
   * Handle pointer move (extend selection)
   */
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isLocked) return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cell = getCellFromCoordinates(x, y, CELL_SIZE, CELL_GAP, gridSize);
    if (!cell) return;

    // Skip if same as last cell
    if (lastCellRef.current?.row === cell.row && lastCellRef.current?.col === cell.col) {
      return;
    }

    if (canAddCell(cell)) {
      lastCellRef.current = cell;
      const selectedCell = getSelectedCell(cell);
      onSelectionMove(selectedCell);
    }
  }, [isDragging, isLocked, gridSize, canAddCell, getSelectedCell, onSelectionMove]);

  /**
   * Handle pointer up (end selection, submit word)
   */
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    setIsDragging(false);
    lastCellRef.current = null;

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    onSelectionEnd();
  }, [isDragging, onSelectionEnd]);

  /**
   * Generate SVG path for visual line connecting cells
   */
  const selectionPath = useMemo(() => {
    if (selection.cells.length < 2) return '';

    const path = selection.cells.map((cell, i) => {
      if (i === 0) {
        return `M ${cell.x} ${cell.y}`;
      }
      return `L ${cell.x} ${cell.y}`;
    }).join(' ');

    return path;
  }, [selection.cells]);

  return (
    <div className="relative">
      {/* SVG overlay for selection path */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: gridSize * (CELL_SIZE + CELL_GAP), height: gridSize * (CELL_SIZE + CELL_GAP) }}
      >
        {selectionPath && (
          <path
            d={selectionPath}
            stroke="#4F46E5"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-md"
          />
        )}
      </svg>

      {/* Board grid */}
      <div
        ref={boardRef}
        className="grid bg-white border-4 border-indigo-300 rounded-2xl shadow-2xl p-2 select-none touch-none"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${CELL_SIZE}px)`,
          gap: `${CELL_GAP}px`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {board.map((row, rowIndex) =>
          row.map((letter, colIndex) => {
            const cell = { row: rowIndex, col: colIndex };
            const isSelected = selectedCellsSet.has(`${rowIndex},${colIndex}`);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  flex items-center justify-center
                  text-3xl font-black rounded-xl
                  transition-all duration-150
                  ${isSelected
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200'
                  }
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {letter}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create the component file**

Run: `cat > src/components/game/GameBoard.tsx` (paste content above)

**Step 3: Verify file created**

Run: `ls -la src/components/game/GameBoard.tsx`
Expected: File exists

**Step 4: Commit**

```bash
git add src/components/game/GameBoard.tsx
git commit -m "feat(game): add interactive game board component"
```

---

## Task 9: Create Game Page

**Files:**
- Create: `src/app/game/[roomId]/page.tsx`

**Step 1: Write page implementation**

IMPORTANT: Use the `frontend-design` plugin/skill to create this page with high-quality, polished UI.

```typescript
/**
 * Active Game Page
 * Main game interface with board, timer, HUD, and word list
 * Handles word submission and real-time synchronization
 */

"use client";

import { useEffect, useState, useTransition } from 'react';
import { useRouter, redirect } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { CurrentWordDisplay } from '@/components/game/CurrentWordDisplay';
import { Timer } from '@/components/game/Timer';
import { FoundWordsList } from '@/components/game/FoundWordsList';
import { Countdown } from '@/components/game/Countdown';
import { useGameSync } from '@/hooks/useGameSync';
import type { WordSelection, SelectedCell, FoundWord, WordValidationStatus } from '@/types/game';

interface GamePageProps {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ playerId?: string }>;
}

export default function GamePage({ params, searchParams }: GamePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] useState<{
    roomId: string;
    playerId: string;
  } | null>(null);

  // Game state
  const [showCountdown, setShowCountdown] = useState(true);
  const [isLocked, setIsLocked] = useState(true); // Locked during countdown
  const [selection, setSelection] = useState<WordSelection>({
    cells: [],
    currentWord: '',
    isValid: null,
  });
  const [validationStatus, setValidationStatus] = useState<WordValidationStatus>('idle');
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);

  // Resolve params
  useEffect(() => {
    const init = async () => {
      const { roomId } = await params;
      const { playerId } = await searchParams;

      if (!playerId) {
        router.push('/');
        return;
      }

      setResolvedParams({ roomId, playerId });

      // Fetch room data
      try {
        const response = await fetch(`/api/rooms/${roomId}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Room not found');
        }

        const data = await response.json();
        if (data.room.status !== 'playing') {
          setError('El juego no ha empezado');
          setTimeout(() => router.push(`/room/${data.room.code}?playerId=${playerId}`), 2000);
          return;
        }

        setLoading(false);
      } catch (err) {
        setError('Error al cargar el juego');
        setLoading(false);
      }
    };

    init();
  }, [params, searchParams, router]);

  if (!resolvedParams || loading) {
    return <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-zinc-600">Cargando juego...</span>
        </div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-zinc-600">{error}</p>
      </div>
    </div>;
  }

  return (
    <GameClient
      roomId={resolvedParams.roomId}
      playerId={resolvedParams.playerId}
      onCountdownComplete={() => {
        setShowCountdown(false);
        setIsLocked(false);
      }}
      isLocked={isLocked}
      selection={selection}
      setSelection={setSelection}
      validationStatus={validationStatus}
      setValidationStatus={setValidationStatus}
      foundWords={foundWords}
      setFoundWords={setFoundWords}
    />
  );
}

function GameClient(props: {
  roomId: string;
  playerId: string;
  onCountdownComplete: () => void;
  isLocked: boolean;
  selection: WordSelection;
  setSelection: (s: WordSelection) => void;
  validationStatus: WordValidationStatus;
  setValidationStatus: (s: WordValidationStatus) => void;
  foundWords: FoundWord[];
  setFoundWords: (w: FoundWord[]) => void;
}) {
  const router = useRouter();
  const [gameState, setGameState] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: Use useGameSync hook for timer synchronization
  // const { timerState } = useGameSync({ roomId, playerId, onGameEnd: () => setIsLocked(true) });

  // Fetch game state on mount
  useEffect(() => {
    const fetchGameState = async () => {
      const response = await fetch(`/api/rooms/${props.roomId}`);
      const data = await response.json();

      setGameState({
        roomId: data.room.id,
        roomCode: data.room.code,
        board: data.room.board,
        startTime: data.room.startTime,
        duration: data.room.duration,
        gridSize: data.room.gridSize,
        playerId: props.playerId,
      });
    };

    fetchGameState();
  }, [props.roomId, props.playerId]);

  /**
   * Handle word submission
   */
  const submitWord = async () => {
    if (props.selection.cells.length < 3 || isSubmitting) return;

    const word = props.selection.currentWord;
    const path = props.selection.cells.map(({ row, col }) => ({ row, col }));

    setIsSubmitting(true);
    props.setValidationStatus('validating');

    try {
      const response = await fetch(`/api/games/${props.roomId}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: props.playerId,
          word,
          path,
        }),
      });

      const data = await response.json();

      if (data.success) {
        props.setValidationStatus('valid');
        props.setFoundWords([
          { word: data.word, score: data.score, timestamp: Date.now() },
          ...props.foundWords,
        ]);

        // Clear selection after brief delay
        setTimeout(() => {
          props.setSelection({ cells: [], currentWord: '', isValid: null });
          props.setValidationStatus('idle');
        }, 500);
      } else {
        props.setValidationStatus('invalid');
        setTimeout(() => {
          props.setSelection({ cells: [], currentWord: '', isValid: null });
          props.setValidationStatus('idle');
        }, 1000);
      }
    } catch (err) {
      props.setValidationStatus('invalid');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle selection start
   */
  const handleSelectionStart = (cell: SelectedCell) => {
    if (props.isLocked) return;

    // Get letter from board
    const letter = gameState?.board[cell.row][cell.col] || '';

    props.setSelection({
      cells: [cell],
      currentWord: letter,
      isValid: null,
    });
    props.setValidationStatus('idle');
  };

  /**
   * Handle selection move (drag)
   */
  const handleSelectionMove = (cell: SelectedCell) => {
    if (props.isLocked) return;

    const letter = gameState?.board[cell.row][cell.col] || '';
    const newWord = props.selection.currentWord + letter;

    props.setSelection({
      cells: [...props.selection.cells, cell],
      currentWord: newWord,
      isValid: null,
    });
  };

  /**
   * Handle selection end (submit word)
   */
  const handleSelectionEnd = () => {
    if (props.isLocked || props.selection.cells.length < 3) {
      // Clear selection if too short
      props.setSelection({ cells: [], currentWord: '', isValid: null });
      return;
    }

    submitWord();
  };

  if (!gameState) {
    return <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
      <span className="text-zinc-600">Cargando juego...</span>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Countdown Overlay */}
      {props.showCountdown && <Countdown onComplete={props.onCountdownComplete} />}

      {/* Main Game Layout */}
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top HUD: Timer + Current Word */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Timer timerState={{ remaining: 120, isPaused: props.isLocked, isExpired: false }} />
            <CurrentWordDisplay
              currentWord={props.selection.currentWord}
              validationStatus={props.validationStatus}
              wordCount={props.foundWords.length}
            />
          </div>

          {/* Game Board */}
          <div className="flex justify-center">
            <GameBoard
              board={gameState.board}
              selection={props.selection}
              onSelectionStart={handleSelectionStart}
              onSelectionMove={handleSelectionMove}
              onSelectionEnd={handleSelectionEnd}
              isLocked={props.isLocked}
            />
          </div>

          {/* Found Words List */}
          <div className="flex justify-center">
            <FoundWordsList words={props.foundWords} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Fix syntax error and create the file**

Run: `cat > src/app/game/[roomId]/page.tsx` (paste content above, fix useState syntax)

**Step 3: Verify file created**

Run: `ls -la "src/app/game/[roomId]/page.tsx"`
Expected: File exists

**Step 4: Commit**

```bash
git add "src/app/game/[roomId]/page.tsx"
git commit -m "feat(game): add active game page with board and HUD"
```

---

## Task 10: Integrate Real-Time Timer Synchronization

**Files:**
- Modify: `src/app/game/[roomId]/page.tsx`
- Modify: `src/hooks/usePusherChannel.ts` (add onGameStarted handler)

**Step 1: Check if onGameStarted handler exists**

Run: `grep -n "onGameStarted" src/hooks/usePusherChannel.ts`
Expected: Check if handler exists

**Step 2: Update GameClient component to use useGameSync**

Replace the timer state section with proper hook usage:

```typescript
// In GameClient component, add:
const { timerState } = useGameSync({
  roomId: props.roomId,
  playerId: props.playerId,
  onGameEnd: () => {
    setIsLocked(true);
    // Navigate to results page after delay
    setTimeout(() => router.push(`/results/${props.roomId}?playerId=${props.playerId}`), 2000);
  },
});

// Replace the placeholder timer in JSX with actual timerState:
<Timer timerState={timerState} />
```

**Step 3: Verify integration**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/app/game/[roomId]/page.tsx
git commit -m "feat(game): integrate real-time timer synchronization"
```

---

## Task 11: Add Animations and Transitions

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add shake animation for invalid words**

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}
```

**Step 2: Add success pulse animation**

```css
@keyframes success-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.animate-success {
  animation: success-pulse 0.4s ease-out;
}
```

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(game): add word validation animations"
```

---

## Task 12: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/plans/2025-12-29-boggle-party-epics.md`
- Modify: `docs/plans/2025-12-30-epic-7-active-game-phase.md` (this file)

**Step 1: Update CLAUDE.md**

Add Epic 7 to completed epics section:

```markdown
**Completed Epics:**
- ✅ **Epic 1: Docker & Infrastructure** - Docker Compose setup with web and db services, health check endpoint
- ✅ **Epic 2: Database Schema** - PostgreSQL schema, migrations, and repositories
- ✅ **Epic 3: Room Management System** - In-memory room state, join/leave/start/end game
- ✅ **Epic 4: Dictionary & Word Validation** - Spanish dictionary (636K→154K words), Trie structure, DFS solver
- ✅ **Epic 5: Pusher Integration** - Real-time events, typed emitters, React hooks
- ✅ **Epic 6: Landing & Waiting Room UI** - Landing page, waiting room with real-time player updates
- ✅ **Epic 7: Active Game Phase** - Interactive game board with drag-to-select, timer, countdown, and real-time validation
```

**Step 2: Update Epic 7 in main epics document**

In `docs/plans/2025-12-29-boggle-party-epics.md`:

```markdown
## Epic 7: Game Flow - Active Game Phase

**Status:** ✅ Completed
**Implementation Date:** 2025-12-30
**Plan:** `docs/plans/2025-12-30-epic-7-active-game-phase.md`

**Delivered:**
- Active game page at `/game/[roomId]`
- Countdown overlay (3-2-1-¡YA!)
- Interactive game board with drag-to-select word input
- Visual line showing current selection path
- Synchronized countdown timer
- Current word HUD with validation feedback (✓/✗)
- Found words list with per-player visibility
- Game end when timer reaches 0
```

**Step 3: Update this plan document**

Add completion status at the top:

```markdown
# Epic 7: Game Flow - Active Game Phase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Status:** ✅ Completed
**Completed:** 2025-12-30
```

**Step 4: Commit**

```bash
git add CLAUDE.md docs/plans/2025-12-29-boggle-party-epics.md docs/plans/2025-12-30-epic-7-active-game-phase.md
git commit -m "docs: mark Epic 7 as completed"
```

---

## Summary

This plan implements the complete active game phase for Boggle Party with:

1. **Type-safe game state management** with dedicated types
2. **Board geometry utilities** for adjacency calculation and position mapping
3. **Real-time synchronization** via Pusher for timer and game events
4. **Polished UI components** built with frontend-design plugin:
   - Countdown overlay
   - Large prominent timer
   - Current word HUD with validation feedback
   - Found words scrollable list
5. **Interactive game board** with touch/mouse drag-to-select
6. **SVG path rendering** for visual feedback
7. **Animation system** for validation feedback

**Files Created:** 11 new files
**Files Modified:** 3 files
**Total Tasks:** 12

**Next Epic:** Epic 8 - Results Phase (sequential word reveal, scoring, final rankings)
