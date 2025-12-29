/**
 * Session management utilities
 * Maps player IDs to session IDs for Pusher presence channels
 */

import type { Player } from './types';

/**
 * Map player ID to Pusher presence socket ID
 */
export interface PlayerSession {
  playerId: string;
  socketId: string;
  roomCode: string;
}

// In-memory session storage (Map: playerId -> PlayerSession)
const sessions = new Map<string, PlayerSession>();

/**
 * Register a player session
 */
export function registerSession(playerId: string, socketId: string, roomCode: string): void {
  sessions.set(playerId, { playerId, socketId, roomCode });
}

/**
 * Unregister a player session
 */
export function unregisterSession(playerId: string): void {
  sessions.delete(playerId);
}

/**
 * Get session by player ID
 */
export function getSession(playerId: string): PlayerSession | undefined {
  return sessions.get(playerId);
}

/**
 * Get all sessions in a room
 */
export function getSessionsByRoom(roomCode: string): PlayerSession[] {
  return Array.from(sessions.values()).filter(s => s.roomCode === roomCode);
}

/**
 * Clean up sessions for a room
 */
export function clearRoomSessions(roomCode: string): void {
  const toDelete = Array.from(sessions.entries())
    .filter(([_, session]) => session.roomCode === roomCode)
    .map(([playerId]) => playerId);

  toDelete.forEach(playerId => sessions.delete(playerId));
}
