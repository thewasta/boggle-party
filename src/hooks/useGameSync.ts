/**
 * Hook for synchronizing game state with Pusher real-time events
 * Handles countdown, timer sync, and game-end transitions
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePusherChannel } from './usePusherChannel';
import type { GameState, TimerState } from '@/types/game';

interface UseGameSyncOptions {
  roomCode: string;
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
  roomCode,
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
  const hasTriggeredGameEndRef = useRef(false);
  const lastStartTimeRef = useRef<number | null>(null);
  const lastInitialRemainingRef = useRef<number | null>(null);

  // Synchronize timer with server time
  useEffect(() => {
    if (!gameState?.startTime) return;

    // Check if this is a new game (startTime changed)
    const isNewGame = lastStartTimeRef.current !== gameState.startTime;
    if (isNewGame) {
      lastStartTimeRef.current = gameState.startTime;
      hasTriggeredGameEndRef.current = false;
      lastInitialRemainingRef.current = null;
    }

    // If server provided initialRemaining (page reload scenario), use it directly
    if (gameState.initialRemaining !== undefined && lastInitialRemainingRef.current !== gameState.initialRemaining) {
      lastInitialRemainingRef.current = gameState.initialRemaining;
      setIsSynced(true);
      const isExpired = gameState.initialRemaining <= 0;
      setTimerState({
        remaining: Math.max(0, gameState.initialRemaining),
        isPaused: false,
        isExpired,
      });

      // If game already expired, trigger end callback (only once per game)
      if (isExpired && !hasTriggeredGameEndRef.current) {
        hasTriggeredGameEndRef.current = true;
        onGameEnd?.();
      }
      return;
    }

    // Calculate offset between client and server time (only for normal game start)
    const serverStartTime = gameState.startTime;
    const clientNow = Date.now();
    serverTimeOffsetRef.current = serverStartTime - clientNow;

    // Calculate initial remaining time based on elapsed time
    const serverNow = clientNow + serverTimeOffsetRef.current;
    const elapsed = (serverNow - gameState.startTime) / 1000;
    const initialRemaining = Math.max(0, gameState.duration - elapsed);

    setIsSynced(true);
    // Start the timer with actual remaining time, not full duration
    const isExpired = initialRemaining <= 0;
    setTimerState({
      remaining: Math.ceil(initialRemaining),
      isPaused: false,
      isExpired,
    });

    // If game already expired, trigger end callback (only once per game)
    if (isExpired && !hasTriggeredGameEndRef.current) {
      hasTriggeredGameEndRef.current = true;
      onGameEnd?.();
    }
  }, [gameState?.startTime, gameState?.duration, gameState?.initialRemaining]);

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
  usePusherChannel(roomCode, {
    onGameEnded: handleGameEnded,
  });

  return {
    gameState,
    setGameState,
    timerState,
    isSynced,
  };
}
