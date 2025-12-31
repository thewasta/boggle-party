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
  initialRemaining?: number; // Calculated by server for page reload scenarios
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
