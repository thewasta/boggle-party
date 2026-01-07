/**
 * Socket.io client utilities for frontend
 * Handles Socket.io instance creation and room management
 */

import { io, type Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

/**
 * Get Socket.io client instance for frontend
 * Returns singleton instance to avoid duplicate connections
 */
export function getSocketClient(): Socket {
  if (socketInstance) {
    return socketInstance;
  }

  const url = process.env.NEXT_PUBLIC_WS_URL;
  if (!url) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_WS_URL');
  }

  socketInstance = io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socketInstance;
}

/**
 * Generate room name for a game room
 * @param roomCode - Room code (6-character string like 'JX4XU3')
 * @returns Room name in format 'game-{roomCode}'
 */
export function getRoomChannelName(roomCode: string): string {
  return `game-${roomCode}`;
}

/**
 * Event names for Socket.io rooms
 */
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

/**
 * Type for Socket.io event names
 */
export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
