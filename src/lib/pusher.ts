/**
 * Pusher client utilities for frontend
 * Handles Pusher instance creation and channel naming
 */

import Pusher from 'pusher-js';

/**
 * Get Pusher client instance for frontend
 * Creates singleton instance on first call
 */
export function getPusherClient(): Pusher {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    throw new Error('Missing required Pusher environment variables: NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER');
  }

  return new Pusher(key, {
    cluster,
    forceTLS: true,
  });
}

/**
 * Generate channel name for a room
 * @param roomId - Internal room UUID
 * @returns Channel name in format 'presence-game-{roomId}'
 */
export function getRoomChannelName(roomId: string): string {
  return `presence-game-${roomId}`;
}

/**
 * Event names for Pusher channels
 */
export const PUSHER_EVENTS = {
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  GAME_STARTED: 'game-started',
  GAME_ENDED: 'game-ended',
  WORD_FOUND: 'word-found',
  REVEAL_WORD: 'reveal-word',
  RESULTS_COMPLETE: 'results-complete',
} as const;

/**
 * Type for Pusher event names
 */
export type PusherEventName = typeof PUSHER_EVENTS[keyof typeof PUSHER_EVENTS];
