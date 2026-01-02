/**
 * React hook for subscribing to Pusher channels
 * Handles subscription, event binding, and automatic cleanup
 */

import { useEffect, useRef } from 'react';
import Pusher, { type Channel } from 'pusher-js';
import { getPusherClient, getRoomChannelName, PUSHER_EVENTS } from '@/lib/pusher';

/**
 * Event handlers for Pusher events
 */
export interface PusherEventHandlers {
  onPlayerJoined?: (data: { player: { id: string; name: string; avatar: string; isHost: boolean; score: number }; totalPlayers: number }) => void;
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
export interface UsePusherChannelOptions {
  enabled?: boolean;
}

/**
 * Subscribe to a Pusher channel and bind event handlers
 *
 * @param roomId - Internal room UUID
 * @param handlers - Event callback functions
 * @param options - Configuration options
 */
export function usePusherChannel(
  roomId: string | null,
  handlers: PusherEventHandlers,
  options: UsePusherChannelOptions = {}
): void {
  const { enabled = true } = options;
  const channelRef = useRef<Channel | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref updated without re-subscribing
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled || !roomId) {
      return;
    }

    let pusher: Pusher | null = null;
    let channel: Channel | null = null;

    try {
      // Initialize Pusher client
      pusher = getPusherClient();
      pusherRef.current = pusher;

      // Subscribe to channel
      const channelName = getRoomChannelName(roomId);
      channel = pusher.subscribe(channelName);
      channelRef.current = channel;

      // Bind event handlers
      if (handlers.onPlayerJoined) {
        channel.bind(PUSHER_EVENTS.PLAYER_JOINED, (data: unknown) => {
          handlersRef.current.onPlayerJoined?.(data as Parameters<NonNullable<typeof handlers.onPlayerJoined>>[0]);
        });
      }

      if (handlers.onPlayerLeft) {
        channel.bind(PUSHER_EVENTS.PLAYER_LEFT, (data: unknown) => {
          handlersRef.current.onPlayerLeft?.(data as Parameters<NonNullable<typeof handlers.onPlayerLeft>>[0]);
        });
      }

      if (handlers.onGameStarted) {
        channel.bind(PUSHER_EVENTS.GAME_STARTED, (data: unknown) => {
          handlersRef.current.onGameStarted?.(data as Parameters<NonNullable<typeof handlers.onGameStarted>>[0]);
        });
      }

      if (handlers.onGameEnded) {
        channel.bind(PUSHER_EVENTS.GAME_ENDED, (data: unknown) => {
          handlersRef.current.onGameEnded?.(data as Parameters<NonNullable<typeof handlers.onGameEnded>>[0]);
        });
      }

      if (handlers.onRoomClosed) {
        channel.bind(PUSHER_EVENTS.ROOM_CLOSED, (data: unknown) => {
          handlersRef.current.onRoomClosed?.(data as Parameters<NonNullable<typeof handlers.onRoomClosed>>[0]);
        });
      }

      if (handlers.onWordFound) {
        channel.bind(PUSHER_EVENTS.WORD_FOUND, (data: unknown) => {
          handlersRef.current.onWordFound?.(data as Parameters<NonNullable<typeof handlers.onWordFound>>[0]);
        });
      }

      if (handlers.onRevealWord) {
        channel.bind(PUSHER_EVENTS.REVEAL_WORD, (data: unknown) => {
          handlersRef.current.onRevealWord?.(data as Parameters<NonNullable<typeof handlers.onRevealWord>>[0]);
        });
      }

      if (handlers.onResultsComplete) {
        channel.bind(PUSHER_EVENTS.RESULTS_COMPLETE, (data: unknown) => {
          handlersRef.current.onResultsComplete?.(data as Parameters<NonNullable<typeof handlers.onResultsComplete>>[0]);
        });
      }

      if (handlers.onRematchRequested) {
        channel.bind(PUSHER_EVENTS.REMATCH_REQUESTED, (data: unknown) => {
          handlersRef.current.onRematchRequested?.(data as Parameters<NonNullable<typeof handlers.onRematchRequested>>[0]);
        });
      }
    } catch (error) {
      console.error('[Pusher] Failed to subscribe to channel:', error);
    }

    // Cleanup function
    return () => {
      if (channel) {
        // Unbind all events
        channel.unbind_all();
        // Unsubscribe from channel
        pusher?.unsubscribe(channel.name);
      }
    };
  }, [roomId, enabled]);
}
