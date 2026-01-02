/**
 * Typed Pusher event emitters for server-side code
 * Provides type-safe functions for all game events
 */

import { triggerEvent } from './pusher-client';
import type {
  PlayerJoinedEvent,
  PlayerLeftEvent,
  GameStartedEvent,
  GameEndedEvent,
  WordFoundEvent,
  RevealWordEvent,
  ResultsCompleteEvent,
  RematchRequestedEvent,
  Player,
} from './types';

/**
 * Emit player-joined event
 */
export async function emitPlayerJoined(roomId: string, player: Player, totalPlayers: number): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'player-joined', {
    player,
    totalPlayers,
  } satisfies PlayerJoinedEvent);
}

/**
 * Emit player-left event
 */
export async function emitPlayerLeft(roomId: string, playerId: string, playerName: string, totalPlayers: number): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'player-left', {
    playerId,
    playerName,
    totalPlayers,
  } satisfies PlayerLeftEvent);
}

/**
 * Emit game-started event
 */
export async function emitGameStarted(roomId: string, startTime: number, duration: number, board: string[][]): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'game-started', {
    startTime,
    duration,
    board,
  } satisfies GameStartedEvent);
}

/**
 * Emit game-ended event
 */
export async function emitGameEnded(roomId: string, endTime: number): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'game-ended', {
    endTime,
  } satisfies GameEndedEvent);
}

/**
 * Emit word-found event (real-time word submission notification)
 */
export async function emitWordFound(roomId: string, playerId: string, playerName: string, word: string, score: number, isUnique: boolean): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'word-found', {
    playerId,
    playerName,
    word,
    score,
    isUnique,
  } satisfies WordFoundEvent);
}

/**
 * Emit reveal-word event (results phase - sequential word reveal)
 */
export async function emitRevealWord(
  roomId: string,
  word: string,
  player: { id: string; name: string; avatar: string },
  score: number,
  isUnique: boolean
): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'reveal-word', {
    word,
    player,
    score,
    isUnique,
  } satisfies RevealWordEvent);
}

/**
 * Emit results-complete event (end of reveal phase)
 */
export async function emitResultsComplete(roomId: string, finalRankings: Array<{ id: string; name: string; avatar: string; score: number }>): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'results-complete', {
    finalRankings,
  } satisfies ResultsCompleteEvent);
}

/**
 * Emit rematch-requested event
 */
export async function emitRematchRequested(roomId: string, requestedBy: { id: string; name: string }): Promise<void> {
  await triggerEvent(`game-${roomId}`, 'rematch-requested', {
    requestedBy,
  } satisfies RematchRequestedEvent);
}
