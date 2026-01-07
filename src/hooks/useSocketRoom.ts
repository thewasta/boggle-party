/**
 * React hook for subscribing to Socket.io rooms
 * Handles room join/leave, event binding, and automatic cleanup
 */

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocketClient, getRoomChannelName, SOCKET_EVENTS } from '@/lib/socket';

/**
 * Event handlers for Socket.io events
 */
export interface SocketEventHandlers {
  onPlayerJoined?: (data: { player: { id: string; name: string; avatar: string; isHost: boolean; score: number; foundWords: Array<{ word: string; score: number; timestamp: number }> }; totalPlayers: number }) => void;
  onPlayerLeft?: (data: { playerId: string; playerName: string; totalPlayers: number }) => void;
  onGameStarted?: (data: { startTime: number; duration: number; board: string[][] }) => void;
  onGameEnded?: (data: { endTime: number }) => void;
  onRoomClosed?: (data: { reason: string; message: string }) => void;
  onWordFound?: (data: { playerId: string; playerName: string; word: string; score: number; isUnique: boolean }) => void;
  onRevealWord?: (data: { word: string; player: { id: string; name: string; avatar: string }; score: number; isUnique: boolean }) => void;
  onResultsComplete?: (data: { finalRankings: Array<{ id: string; name: string; avatar: string; score: number }> }) => void;
  onRematchRequested?: (data: { requestedBy: { id: string; name: string } }) => void;
}

/**
 * Options for the hook
 */
export interface UseSocketRoomOptions {
  enabled?: boolean;
}

/**
 * Subscribe to a Socket.io room and bind event handlers
 *
 * @param roomCode - Room code (6-character string like 'JX4XU3')
 * @param handlers - Event callback functions
 * @param options - Configuration options
 */
export function useSocketRoom(
  roomCode: string | null,
  handlers: SocketEventHandlers,
  options: UseSocketRoomOptions = {}
): void {
  const { enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref updated without re-subscribing
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled || !roomCode) {
      return;
    }

    let socket: Socket | null = null;

    try {
      // Get or create Socket.io client
      socket = getSocketClient();
      socketRef.current = socket;

      const roomName = getRoomChannelName(roomCode);

      // Join the room
      socket!.emit('join-room', roomCode);
      console.log(`[Socket] Joined room: ${roomName}`);

      // Bind event handlers
      const cleanup: Array<() => void> = [];

      if (handlers.onPlayerJoined) {
        const handler = (data: unknown) => {
          handlersRef.current.onPlayerJoined?.(data as Parameters<NonNullable<typeof handlers.onPlayerJoined>>[0]);
        };
        socket!.on(SOCKET_EVENTS.PLAYER_JOINED, handler);
        cleanup.push(() => socket!.off(SOCKET_EVENTS.PLAYER_JOINED, handler));
      }

      if (handlers.onPlayerLeft) {
        const handler = (data: unknown) => {
          handlersRef.current.onPlayerLeft?.(data as Parameters<NonNullable<typeof handlers.onPlayerLeft>>[0]);
        };
        socket!.on(SOCKET_EVENTS.PLAYER_LEFT, handler);
        cleanup.push(() => socket!.off(SOCKET_EVENTS.PLAYER_LEFT, handler));
      }

      if (handlers.onGameStarted) {
        const handler = (data: unknown) => {
          handlersRef.current.onGameStarted?.(data as Parameters<NonNullable<typeof handlers.onGameStarted>>[0]);
        };
        socket!.on(SOCKET_EVENTS.GAME_STARTED, handler);
        cleanup.push(() => socket!.off(SOCKET_EVENTS.GAME_STARTED, handler));
      }

      if (handlers.onGameEnded) {
        const handler = (data: unknown) => {
          handlersRef.current.onGameEnded?.(data as Parameters<NonNullable<typeof handlers.onGameEnded>>[0]);
        };
        socket!.on(SOCKET_EVENTS.GAME_ENDED, handler);
        cleanup.push(() => socket!.off(SOCKET_EVENTS.GAME_ENDED, handler));
      }

      if (handlers.onRoomClosed) {
        const handler = (data: unknown) => {
          handlersRef.current.onRoomClosed?.(data as Parameters<NonNullable<typeof handlers.onRoomClosed>>[0]);
        };
        socket!.on(SOCKET_EVENTS.ROOM_CLOSED, handler);
        cleanup.push(() => socket!.off(SOCKET_EVENTS.ROOM_CLOSED, handler));
      }

      if (handlers.onWordFound) {
        const handler = (data: unknown) => {
          handlersRef.current.onWordFound?.(data as Parameters<NonNullable<typeof handlers.onWordFound>>[0]);
        };
        socket!.on(SOCKET_EVENTS.WORD_FOUND, handler);
        cleanup.push(() => socket!.off(SOCKET_EVENTS.WORD_FOUND, handler));
      }

      if (handlers.onRevealWord) {
        const handler = (data: unknown) => {
          handlersRef.current.onRevealWord?.(data as Parameters<NonNullable<typeof handlers.onRevealWord>>[0]);
        };
        socket!.on(SOCKET_EVENTS.REVEAL_WORD, handler);
        cleanup.push(() => socket!.off(SOCKET_EVENTS.REVEAL_WORD, handler));
      }

      if (handlers.onResultsComplete) {
        const handler = (data: unknown) => {
          handlersRef.current.onResultsComplete?.(data as Parameters<NonNullable<typeof handlers.onResultsComplete>>[0]);
        };
        socket!.on(SOCKET_EVENTS.RESULTS_COMPLETE, handler);
        cleanup.push(() => socket!.off(SOCKET_EVENTS.RESULTS_COMPLETE, handler));
      }

      if (handlers.onRematchRequested) {
        const handler = (data: unknown) => {
          handlersRef.current.onRematchRequested?.(data as Parameters<NonNullable<typeof handlers.onRematchRequested>>[0]);
        };
        socket!.on(SOCKET_EVENTS.REMATCH_REQUESTED, handler);
        cleanup.push(() => socket!.off(SOCKET_EVENTS.REMATCH_REQUESTED, handler));
      }
    } catch (error) {
      console.error('[Socket] Failed to connect:', error);
    }

    // Cleanup function
    return () => {
      if (socket && roomCode) {
        // Leave the room
        socket.emit('leave-room', roomCode);
        console.log(`[Socket] Left room: ${roomCode}`);

        // Unbind all events (cleanup handles this, but as fallback)
        socket.offAny();
      }
    };
  }, [roomCode, enabled]);
}
