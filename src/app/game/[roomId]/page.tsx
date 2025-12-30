/**
 * Active Game Page
 * Main game interface with board, timer, HUD, and word list
 * Handles word submission and real-time synchronization
 */

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Countdown } from "@/components/game/Countdown";
import { CurrentWordDisplay } from "@/components/game/CurrentWordDisplay";
import { GameBoard } from "@/components/game/GameBoard";
import { Timer } from "@/components/game/Timer";
import { useGameSync } from "@/hooks/useGameSync";
import type {
  FoundWord,
  SelectedCell,
  WordSelection,
  WordValidationStatus,
} from "@/types/game";

interface GamePageProps {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ playerId?: string }>;
}

export default function GamePage({ params, searchParams }: GamePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{
    roomId: string;
    playerId: string;
    roomCode: string;
    hostId: string;
  } | null>(null);

  // Game state
  const [showCountdown, setShowCountdown] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [selection, setSelection] = useState<WordSelection>({
    cells: [],
    currentWord: "",
    isValid: null,
  });
  const [validationStatus, setValidationStatus] =
    useState<WordValidationStatus>("idle");
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);

  // Resolve params
  useEffect(() => {
    const init = async () => {
      const { roomId } = await params;
      const { playerId } = await searchParams;

      if (!playerId) {
        router.push("/");
        return;
      }

      // Fetch room data first to get roomCode
      try {
        const response = await fetch(`/api/rooms/${roomId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Room not found");
        }

        const data = await response.json();
        setResolvedParams({
          roomId,
          playerId,
          roomCode: data.room.code,
          hostId: data.room.host.id,
        });
        if (data.room.status !== "playing") {
          setError("El juego no ha empezado");
          setTimeout(
            () => router.push(`/room/${data.room.code}?playerId=${playerId}`),
            2000,
          );
          return;
        }

        setLoading(false);
      } catch (err) {
        setError("Error al cargar el juego");
        setLoading(false);
      }
    };

    init();
  }, [params, searchParams, router]);

  if (!resolvedParams || loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-zinc-600">Cargando juego...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-zinc-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <GameClient
      roomId={resolvedParams.roomId}
      roomCode={resolvedParams.roomCode}
      playerId={resolvedParams.playerId}
      hostId={resolvedParams.hostId}
      showCountdown={showCountdown}
      onCountdownComplete={() => {
        setShowCountdown(false);
        setIsLocked(false);
      }}
      isLocked={isLocked}
      selection={selection}
      setSelection={setSelection}
      validationStatus={validationStatus}
      setValidationStatus={setValidationStatus}
      foundWords={foundWords}
      setFoundWords={setFoundWords}
      setIsLocked={setIsLocked}
    />
  );
}

function GameClient(props: {
  roomId: string;
  roomCode: string;
  playerId: string;
  hostId: string;
  showCountdown: boolean;
  onCountdownComplete: () => void;
  isLocked: boolean;
  selection: WordSelection;
  setSelection: (s: WordSelection) => void;
  validationStatus: WordValidationStatus;
  setValidationStatus: (s: WordValidationStatus) => void;
  foundWords: FoundWord[];
  setFoundWords: (w: FoundWord[]) => void;
  setIsLocked: (locked: boolean) => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { gameState, setGameState, timerState } = useGameSync({
    roomId: props.roomId,
    playerId: props.playerId,
    onGameEnd: async () => {
      props.setIsLocked(true);
      // Only host should call the end game endpoint to avoid duplicate events
      if (props.playerId === props.hostId) {
        try {
          await fetch(`/api/rooms/${props.roomCode}/end`, { method: "POST" });
        } catch (error) {
          console.error("Failed to end game:", error);
        }
      }
      // Navigate to results page after delay using roomCode
      setTimeout(
        () =>
          router.push(`/results/${props.roomCode}?playerId=${props.playerId}`),
        2000,
      );
    },
  });

  // Fetch game state on mount
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await fetch(`/api/rooms/${props.roomId}`);
        const data = await response.json();

        setGameState({
          roomId: data.room.id,
          roomCode: data.room.code,
          board: data.room.board,
          startTime: data.room.startTime,
          duration: data.room.duration,
          gridSize: data.room.gridSize,
          playerId: props.playerId,
        });
      } catch (err) {
        console.error("Failed to fetch game state:", err);
      }
    };

    fetchGameState();
  }, [props.roomId, props.playerId, setGameState]);

  /**
   * Handle word submission
   */
  const submitWord = useCallback(async () => {
    if (props.selection.cells.length < 3 || isSubmitting) return;

    const word = props.selection.currentWord;
    const path = props.selection.cells.map(({ row, col }) => ({ row, col }));

    setIsSubmitting(true);
    props.setValidationStatus("validating");

    try {
      const response = await fetch(`/api/games/${props.roomId}/words`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: props.playerId,
          word,
          path,
        }),
      });

      const data = await response.json();

      if (data.success) {
        props.setValidationStatus("valid");
        props.setFoundWords([
          { word: data.word, score: data.score, timestamp: Date.now() },
          ...props.foundWords,
        ]);

        // Clear selection after brief delay
        setTimeout(() => {
          props.setSelection({ cells: [], currentWord: "", isValid: null });
          props.setValidationStatus("idle");
        }, 500);
      } else {
        props.setValidationStatus("invalid");
        setTimeout(() => {
          props.setSelection({ cells: [], currentWord: "", isValid: null });
          props.setValidationStatus("idle");
        }, 1000);
      }
    } catch (err) {
      props.setValidationStatus("invalid");
      setTimeout(() => {
        props.setSelection({ cells: [], currentWord: "", isValid: null });
        props.setValidationStatus("idle");
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    props.selection,
    props.foundWords,
    props.roomId,
    props.playerId,
    isSubmitting,
    props,
  ]);

  /**
   * Handle selection start
   */
  const handleSelectionStart = useCallback(
    (cell: SelectedCell) => {
      if (props.isLocked) return;

      // Get letter from board
      const letter = gameState?.board[cell.row][cell.col] || "";

      props.setSelection({
        cells: [cell],
        currentWord: letter,
        isValid: null,
      });
      props.setValidationStatus("idle");
    },
    [
      props.isLocked,
      gameState?.board,
      props.setSelection,
      props.setValidationStatus,
    ],
  );

  /**
   * Handle selection move (drag)
   */
  const handleSelectionMove = useCallback(
    (cell: SelectedCell) => {
      if (props.isLocked) return;

      const letter = gameState?.board[cell.row][cell.col] || "";
      const newWord = props.selection.currentWord + letter;

      props.setSelection({
        cells: [...props.selection.cells, cell],
        currentWord: newWord,
        isValid: null,
      });
    },
    [props.isLocked, gameState?.board, props.selection, props.setSelection],
  );

  /**
   * Handle selection end (submit word)
   */
  const handleSelectionEnd = useCallback(() => {
    if (props.isLocked || props.selection.cells.length < 3) {
      // Clear selection if too short
      props.setSelection({ cells: [], currentWord: "", isValid: null });
      return;
    }

    submitWord();
  }, [props.isLocked, props.selection, props.setSelection, submitWord]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <span className="text-zinc-600">Cargando juego...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden touch-none">
      {/* Countdown Overlay */}
      {props.showCountdown && (
        <Countdown onComplete={props.onCountdownComplete} />
      )}

      {/* Main Game Layout */}
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top HUD: Timer + Current Word */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Timer timerState={timerState} />
            <CurrentWordDisplay
              currentWord={props.selection.currentWord}
              validationStatus={props.validationStatus}
              wordCount={props.foundWords.length}
            />
          </div>

          {/* Game Board */}
          <div className="flex justify-center">
            <GameBoard
              board={gameState.board}
              selection={props.selection}
              onSelectionStart={handleSelectionStart}
              onSelectionMove={handleSelectionMove}
              onSelectionEnd={handleSelectionEnd}
              isLocked={props.isLocked}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
