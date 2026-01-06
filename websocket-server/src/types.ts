import { z } from 'zod';

// =========================================================================
// Event Name Constants
// =========================================================================

export const SOCKET_EVENTS = {
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  GAME_STARTED: 'game-started',
  GAME_ENDED: 'game-ended',
  ROOM_CLOSED: 'room-closed',
  WORD_FOUND: 'word-found',
  REVEAL_WORD: 'reveal-word',
  RESULTS_COMPLETE: 'results-complete',
  REMATCH_REQUESTED: 'rematch-requested',
} as const;

// =========================================================================
// Event Payload Schemas (Zod)
// =========================================================================

/**
 * Player schema
 */
export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  isHost: z.boolean(),
  score: z.number(),
  foundWords: z.array(z.object({
    word: z.string(),
    score: z.number(),
    timestamp: z.number(),
  })),
  createdAt: z.coerce.date(),
});

/**
 * Player joined event payload
 */
export const PlayerJoinedEventSchema = z.object({
  player: PlayerSchema,
  totalPlayers: z.number(),
});

/**
 * Player left event payload
 */
export const PlayerLeftEventSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  totalPlayers: z.number(),
});

/**
 * Game started event payload
 */
export const GameStartedEventSchema = z.object({
  startTime: z.number(),
  duration: z.number(),
  board: z.array(z.array(z.string())),
});

/**
 * Game ended event payload
 */
export const GameEndedEventSchema = z.object({
  endTime: z.number(),
});

/**
 * Word found event payload
 */
export const WordFoundEventSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  word: z.string(),
  score: z.number(),
  isUnique: z.boolean(),
});

/**
 * Reveal word event payload
 */
export const RevealWordEventSchema = z.object({
  word: z.string(),
  player: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string(),
  }),
  score: z.number(),
  isUnique: z.boolean(),
});

/**
 * Results complete event payload
 */
export const ResultsCompleteEventSchema = z.object({
  finalRankings: z.array(z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string(),
    score: z.number(),
  })),
});

/**
 * Rematch requested event payload
 */
export const RematchRequestedEventSchema = z.object({
  requestedBy: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

/**
 * Room closed event payload
 */
export const RoomClosedEventSchema = z.object({
  reason: z.string(),
  message: z.string(),
});

// =========================================================================
// HTTP API Types
// =========================================================================

/**
 * Emit event request from Next.js
 */
export const EmitRequestSchema = z.object({
  channel: z.string(),
  event: z.string(),
  data: z.any(),
});

/**
 * Emit event response
 */
export interface EmitResponse {
  success: true;
  deliveredTo: number;
}
