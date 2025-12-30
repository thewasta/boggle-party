/**
 * Hook for synchronizing game state with Pusher real-time events
 * Handles countdown, timer sync, and game-end transitions
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePusherChannel } from './usePusherChannel';
import type { GameState, TimerState } from '@/types/game';

interface UseGameSyncOptions {
  roomId: string;
  playerId: string;
  onGameEnd?: () => void;
}

interface UseGameSyncReturn {
  gameState: GameState | null;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  timerState: TimerState;
  isSynced: boolean;
}

export function useGameSync({
  roomId,
  playerId,
  onGameEnd,
}: UseGameSyncOptions): UseGameSyncReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({
    remaining: 0,
    isPaused: true,
    isExpired: false,
  });
  const [isSynced, setIsSynced] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const serverTimeOffsetRef = useRef<number>(0);

  // Synchronize timer with server time
  useEffect(() => {
    if (!gameState?.startTime) return;

    // Calculate offset between client and server time
    const serverStartTime = gameState.startTime;
    const clientNow = Date.now();
    serverTimeOffsetRef.current = serverStartTime - clientNow;

    setIsSynced(true);
    // Start the timer
    setTimerState({
      remaining: gameState.duration,
      isPaused: false,
      isExpired: false,
    });
  }, [gameState?.startTime, gameState?.duration]);

  // Update timer every 100ms for smooth countdown
  useEffect(() => {
    if (!gameState?.startTime || timerState.isPaused || timerState.isExpired) {
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const clientNow = Date.now();
      const serverNow = clientNow + serverTimeOffsetRef.current;
      const elapsed = (serverNow - gameState.startTime) / 1000;
      const remaining = Math.max(0, gameState.duration - elapsed);

      setTimerState({
        remaining: Math.ceil(remaining),
        isPaused: false,
        isExpired: remaining <= 0,
      });

      if (remaining <= 0) {
        onGameEnd?.();
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState, timerState.isPaused, timerState.isExpired, onGameEnd]);

  // Handle game-ended event
  const handleGameEnded = useCallback(() => {
    setTimerState((prev) => ({ ...prev, remaining: 0, isExpired: true }));
    onGameEnd?.();
  }, [onGameEnd]);

  // Subscribe to Pusher events (read-only, no word submission)
  usePusherChannel(roomId, {
    onGameEnded: handleGameEnded,
  });

  return {
    gameState,
    setGameState,
    timerState,
    isSynced,
  };
}
