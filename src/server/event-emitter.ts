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
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
export async function emitPlayerJoined(roomCode: string, player: Player, totalPlayers: number): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'player-joined', {
    player,
    totalPlayers,
  } satisfies PlayerJoinedEvent);
}

/**
 * Emit player-left event
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
export async function emitPlayerLeft(roomCode: string, playerId: string, playerName: string, totalPlayers: number): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'player-left', {
    playerId,
    playerName,
    totalPlayers,
  } satisfies PlayerLeftEvent);
}

/**
 * Emit game-started event
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
export async function emitGameStarted(roomCode: string, startTime: number, duration: number, board: string[][]): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'game-started', {
    startTime,
    duration,
    board,
  } satisfies GameStartedEvent);
}

/**
 * Emit game-ended event
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
export async function emitGameEnded(roomCode: string, endTime: number): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'game-ended', {
    endTime,
  } satisfies GameEndedEvent);
}

/**
 * Emit word-found event (real-time word submission notification)
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
export async function emitWordFound(roomCode: string, playerId: string, playerName: string, word: string, score: number, isUnique: boolean): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'word-found', {
    playerId,
    playerName,
    word,
    score,
    isUnique,
  } satisfies WordFoundEvent);
}

/**
 * Emit reveal-word event (results phase - sequential word reveal)
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
export async function emitRevealWord(
  roomCode: string,
  word: string,
  player: { id: string; name: string; avatar: string },
  score: number,
  isUnique: boolean
): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'reveal-word', {
    word,
    player,
    score,
    isUnique,
  } satisfies RevealWordEvent);
}

/**
 * Emit results-complete event (end of reveal phase)
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
export async function emitResultsComplete(roomCode: string, finalRankings: Array<{ id: string; name: string; avatar: string; score: number }>): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'results-complete', {
    finalRankings,
  } satisfies ResultsCompleteEvent);
}

/**
 * Emit rematch-requested event
 * @param roomId - Room code (6-character string like 'JX4XU3')
 */
export async function emitRematchRequested(roomCode: string, requestedBy: { id: string; name: string }): Promise<void> {
  await triggerEvent(`game-${roomCode}`, 'rematch-requested', {
    requestedBy,
  } satisfies RematchRequestedEvent);
}
