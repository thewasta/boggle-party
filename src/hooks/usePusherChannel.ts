/**
 * React hook for subscribing to Pusher presence channels
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
  onWordFound?: (data: { playerId: string; playerName: string; word: string; score: number; isUnique: boolean }) => void;
  onRevealWord?: (data: { word: string; player: { id: string; name: string; avatar: string }; score: number; isUnique: boolean }) => void;
  onResultsComplete?: (data: { finalRankings: Array<{ id: string; name: string; avatar: string; score: number }> }) => void;
}

/**
 * Options for the hook
 */
export interface UsePusherChannelOptions {
  enabled?: boolean;
}

/**
 * Subscribe to a Pusher presence channel and bind event handlers
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

      // Subscribe to presence channel
      const channelName = getRoomChannelName(roomId);
      channel = pusher.subscribe(channelName);
      channelRef.current = channel;

      // Bind event handlers
      if (handlers.onPlayerJoined) {
        channel.bind(PUSHER_EVENTS.PLAYER_JOINED, (data: unknown) => {
          console.log('[Pusher] Received player-joined event:', data);
          handlersRef.current.onPlayerJoined?.(data as Parameters<NonNullable<typeof handlers.onPlayerJoined>>[0]);
        });
        console.log('[Pusher] Bound handler for player-joined');
      }

      if (handlers.onPlayerLeft) {
        channel.bind(PUSHER_EVENTS.PLAYER_LEFT, (data: unknown) => {
          console.log('[Pusher] Received player-left event:', data);
          handlersRef.current.onPlayerLeft?.(data as Parameters<NonNullable<typeof handlers.onPlayerLeft>>[0]);
        });
        console.log('[Pusher] Bound handler for player-left');
      }

      if (handlers.onGameStarted) {
        channel.bind(PUSHER_EVENTS.GAME_STARTED, (data: unknown) => {
          console.log('[Pusher] Received game-started event:', data);
          handlersRef.current.onGameStarted?.(data as Parameters<NonNullable<typeof handlers.onGameStarted>>[0]);
        });
        console.log('[Pusher] Bound handler for game-started');
      }

      if (handlers.onGameEnded) {
        channel.bind(PUSHER_EVENTS.GAME_ENDED, (data: unknown) => {
          console.log('[Pusher] Received game-ended event:', data);
          handlersRef.current.onGameEnded?.(data as Parameters<NonNullable<typeof handlers.onGameEnded>>[0]);
        });
        console.log('[Pusher] Bound handler for game-ended');
      }

      if (handlers.onWordFound) {
        channel.bind(PUSHER_EVENTS.WORD_FOUND, (data: unknown) => {
          console.log('[Pusher] Received word-found event:', data);
          handlersRef.current.onWordFound?.(data as Parameters<NonNullable<typeof handlers.onWordFound>>[0]);
        });
        console.log('[Pusher] Bound handler for word-found');
      }

      if (handlers.onRevealWord) {
        channel.bind(PUSHER_EVENTS.REVEAL_WORD, (data: unknown) => {
          console.log('[Pusher] Received reveal-word event:', data);
          handlersRef.current.onRevealWord?.(data as Parameters<NonNullable<typeof handlers.onRevealWord>>[0]);
        });
        console.log('[Pusher] Bound handler for reveal-word');
      }

      if (handlers.onResultsComplete) {
        channel.bind(PUSHER_EVENTS.RESULTS_COMPLETE, (data: unknown) => {
          console.log('[Pusher] Received results-complete event:', data);
          handlersRef.current.onResultsComplete?.(data as Parameters<NonNullable<typeof handlers.onResultsComplete>>[0]);
        });
        console.log('[Pusher] Bound handler for results-complete');
      }

      // Log successful subscription
      console.log(`[Pusher] Subscribed to channel: ${channelName}`);
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
        console.log(`[Pusher] Unsubscribed from channel: ${channel.name}`);
      }
    };
  }, [roomId, enabled]);
}
