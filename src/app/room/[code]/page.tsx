"use client";

import { redirect, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { GridSizeSelector } from "@/components/waiting-room/GridSizeSelector";
import { PlayerList } from "@/components/waiting-room/PlayerList";
import { RoomCodeDisplay } from "@/components/waiting-room/RoomCodeDisplay";
import { StartGameButton } from "@/components/waiting-room/StartGameButton";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import type { GridSize } from "@/server/db/schema";
import type { Player } from "@/server/types";

interface WaitingRoomPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ playerId?: string }>;
}

export default function WaitingRoomPage({
  params,
  searchParams,
}: WaitingRoomPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{
    code: string;
    playerId: string;
  } | null>(null);
  const [roomData, setRoomData] = useState<{
    roomId: string;
    initialPlayers: Player[];
    initialHost: Player;
    initialGridSize: GridSize;
    initialStatus: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { code } = await params;
        const { playerId } = await searchParams;

        if (!playerId) {
          router.push("/");
          return;
        }

        if (!mounted) return;

        setResolvedParams({ code, playerId });

        const response = await fetch(`/api/rooms/${code}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          if (mounted) {
            router.push("/");
          }
          return;
        }

        const data = await response.json();

        if (mounted) {
          setRoomData({
            roomId: data.room.id,
            initialPlayers: data.room.players,
            initialHost: data.room.host,
            initialGridSize: data.room.gridSize,
            initialStatus: data.room.status,
          });
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError("Error al cargar la sala");
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [params, searchParams, router]);

  if (loading) {
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
            <span className="text-zinc-600">Cargando sala...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !roomData || !resolvedParams) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-zinc-600">{error || "Error al cargar la sala"}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <WaitingRoomClient
      roomCode={resolvedParams.code}
      roomId={roomData.roomId}
      initialPlayers={roomData.initialPlayers}
      initialHost={roomData.initialHost}
      initialGridSize={roomData.initialGridSize}
      initialStatus={roomData.initialStatus}
      currentPlayerId={resolvedParams.playerId}
    />
  );
}

function WaitingRoomClient(props: {
  roomCode: string;
  roomId: string;
  initialPlayers: Player[];
  initialHost: Player;
  initialGridSize: GridSize;
  initialStatus: string;
  currentPlayerId: string;
}) {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>(props.initialPlayers);
  const [gridSize, setGridSize] = useState<GridSize>(props.initialGridSize);
  const [status, setStatus] = useState(props.initialStatus);
  const [isStarting, setIsStarting] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isHost = props.currentPlayerId === props.initialHost.id;

  useEffect(() => {
    if (status === "playing") {
      setError("El juego ya empezó");
      const timer = setTimeout(() => {
        router.push(
          `/game/${props.roomCode}?playerId=${props.currentPlayerId}`,
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, props.roomCode, props.currentPlayerId, router]);

  usePusherChannel(props.roomId, {
    onPlayerJoined: (data) => {
      setPlayers((prev) => {
        const exists = prev.some((p) => p.id === data.player.id);
        if (exists) return prev;
        return [...prev, data.player as Player];
      });
    },
    onPlayerLeft: (data) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    },
    onGameStarted: () => {
      setStatus("playing");
    },
    onRoomClosed: (data) => {
      setError(data.message);
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);
      return () => clearTimeout(timer);
    },
  });

  const handleStartGame = async () => {
    if (players.length < 2) return;

    setIsStarting(async () => {
      try {
        const response = await fetch(`/api/rooms/${props.roomCode}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gridSize: gridSize.toString() }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error("Failed to start game:", data.error);
        }
      } catch (error) {
        console.error("Error starting game:", error);
      }
    });
  };

  const handleLeave = async () => {
    try {
      await fetch(`/api/rooms/${props.roomCode}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: props.currentPlayerId }),
      });
    } catch (error) {
      console.error("Error leaving room:", error);
    } finally {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Decorative background letters */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-8 left-8 text-6xl font-bold text-indigo-900 rotate-12 animate-pulse">
          B
        </div>
        <div
          className="absolute top-32 right-16 text-5xl font-bold text-purple-900 -rotate-6 animate-pulse"
          style={{ animationDelay: "0.5s" }}
        >
          O
        </div>
        <div
          className="absolute bottom-40 left-1/4 text-7xl font-bold text-indigo-800 rotate-3 animate-pulse"
          style={{ animationDelay: "1s" }}
        >
          G
        </div>
      </div>

      <div className="relative z-10 min-h-screen py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border-2 border-red-400 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 p-8 space-y-8">
            {/* Header with Room Code */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-indigo-600 rounded-full">
                <span className="text-2xl">🎮</span>
                <h1 className="text-xl font-bold text-white">
                  Sala de Espera
                </h1>
              </div>
              <RoomCodeDisplay roomCode={props.roomCode} />
            </div>

            {/* Player List with animated count */}
            <div className="relative">
              <PlayerList
                players={players}
                hostId={props.initialHost.id}
                maxPlayers={8}
              />
            </div>

            {/* Host Controls */}
            {isHost && status === "waiting" && (
              <div className="space-y-6 pt-6 border-t-2 border-dashed border-indigo-300">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">
                  <span className="text-xl">👑</span>
                  <span>Controles del anfitrión</span>
                </div>
                <GridSizeSelector
                  value={gridSize}
                  onChange={setGridSize}
                  disabled={status !== "waiting"}
                />
                <StartGameButton
                  playerCount={players.length}
                  onStartGame={handleStartGame}
                  disabled={status !== "waiting"}
                  isLoading={isStarting}
                />
              </div>
            )}

            {/* Non-host waiting message */}
            {!isHost && status === "waiting" && (
              <div className="text-center py-6 border-t-2 border-dashed border-purple-200">
                <div className="inline-flex items-center gap-2 text-indigo-700 font-medium">
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Cargando"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Esperando al anfitrión...</span>
                </div>
              </div>
            )}
          </div>

          {/* Leave button */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleLeave}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
