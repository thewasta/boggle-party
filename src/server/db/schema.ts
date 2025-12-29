/**
 * Database schema types for Boggle Party
 * These types match the PostgreSQL schema for persisting game data
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type GameStatus = 'waiting' | 'playing' | 'finished';
export type GridSize = 4 | 5 | 6;

// ============================================================================
// Database Row Types
// ============================================================================

/**
 * Represents a row in the 'games' table
 */
export interface GameRow {
  id: string;
  room_code: string;
  grid_size: GridSize;
  duration: number; // in seconds
  status: GameStatus;
  host_id: string | null; // UUID of the host player
  created_at: Date;
  started_at: Date | null;
  ended_at: Date | null;
  total_words_found: number;
}

/**
 * Represents a row in the 'game_players' table
 */
export interface GamePlayerRow {
  id: string;
  game_id: string;
  player_name: string;
  avatar: string;
  is_host: boolean; // true if this player is the host
  board: string[][] | null; // unique board grid for this player
  final_score: number;
  words_found: number;
  unique_words_found: number;
  joined_at: Date;
}

/**
 * Represents a row in the 'game_words' table
 */
export interface GameWordRow {
  id: string;
  game_id: string;
  player_id: string;
  word: string;
  word_length: number; // length of the word (for scoring analytics)
  path: Array<{row: number, col: number}> | null; // coordinates path for validation
  score: number;
  is_unique: boolean;
  found_at: Date;
}

// ============================================================================
// Input Types for Creating Records
// ============================================================================

/**
 * Input type for creating a new game record
 */
export interface CreateGameInput {
  room_code: string;
  grid_size: GridSize;
  duration: number;
  status: GameStatus;
  created_at: Date;
  host_id?: string | null; // Optional: can be set later
}

/**
 * Input type for creating a new player record
 */
export interface CreatePlayerInput {
  game_id: string;
  player_name: string;
  avatar: string;
  is_host?: boolean;
  board?: string[][] | null;
  final_score?: number;
  words_found?: number;
  unique_words_found?: number;
  joined_at?: Date;
}

/**
 * Input type for creating a new word record
 */
export interface CreateWordInput {
  game_id: string;
  player_id: string;
  word: string;
  word_length: number;
  path?: Array<{row: number, col: number}> | null;
  score: number;
  is_unique: boolean;
  found_at: Date;
}
