import { redirect } from 'next/navigation';
import type { RouteParams } from '@/server/types';

interface WaitingRoomPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ playerId?: string }>;
}

export default async function WaitingRoomPage({
  params,
  searchParams,
}: WaitingRoomPageProps) {
  const { code } = await params;
  const { playerId } = await searchParams;

  if (!playerId) {
    redirect('/');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/rooms/${code}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    redirect('/');
  }

  const data = await response.json();

  return (
    <WaitingRoomClient
      roomCode={code}
      roomId={data.room.id}
      initialPlayers={data.room.players}
      initialHost={data.room.host}
      initialGridSize={data.room.gridSize}
      initialStatus={data.room.status}
      currentPlayerId={playerId}
    />
  );
}

'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { usePusherChannel } from '@/hooks/usePusherChannel';
import type { Player } from '@/server/types';
import type { GridSize } from '@/server/db/schema';
import { RoomCodeDisplay } from '@/components/waiting-room/RoomCodeDisplay';
import { PlayerList } from '@/components/waiting-room/PlayerList';
import { GridSizeSelector } from '@/components/waiting-room/GridSizeSelector';
import { StartGameButton } from '@/components/waiting-room/StartGameButton';

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
    if (status === 'playing') {
      setError('El juego ya empezó');
      const timer = setTimeout(() => {
        router.push(`/game/${props.roomCode}?playerId=${props.currentPlayerId}`);
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
      setStatus('playing');
    },
  });

  const handleStartGame = async () => {
    if (players.length < 2) return;

    setIsStarting(async () => {
      try {
        const response = await fetch(`/api/rooms/${props.roomCode}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gridSize }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('Failed to start game:', data.error);
        }
      } catch (error) {
        console.error('Error starting game:', error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] relative overflow-hidden">
      {/* Decorative background letters */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-8 left-8 text-6xl font-bold text-indigo-900 rotate-12 animate-pulse">B</div>
        <div className="absolute top-32 right-16 text-5xl font-bold text-purple-900 -rotate-6 animate-pulse" style={{ animationDelay: '0.5s' }}>O</div>
        <div className="absolute bottom-40 left-1/4 text-7xl font-bold text-indigo-800 rotate-3 animate-pulse" style={{ animationDelay: '1s' }}>G</div>
      </div>

      <div className="relative z-10 min-h-screen py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 p-8 space-y-8">
            {/* Header with Room Code */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
                <span className="text-2xl">🎮</span>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Sala de Espera
                </h1>
              </div>
              <RoomCodeDisplay roomCode={props.roomCode} />
            </div>

            {/* Player List with animated count */}
            <div className="relative">
              <div className="absolute -top-3 left-4 px-3 py-1 bg-indigo-600 text-white text-sm font-bold rounded-full">
                {players.length} {players.length === 1 ? 'jugador' : 'jugadores'}
              </div>
              <PlayerList
                players={players}
                hostId={props.initialHost.id}
                maxPlayers={8}
              />
            </div>

            {/* Host Controls */}
            {isHost && status === 'waiting' && (
              <div className="space-y-6 pt-6 border-t-2 border-dashed border-indigo-200">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span className="text-xl">👑</span>
                  <span>Controles del anfitrión</span>
                </div>
                <GridSizeSelector
                  value={gridSize}
                  onChange={setGridSize}
                  disabled={status !== 'waiting'}
                />
                <StartGameButton
                  playerCount={players.length}
                  onStartGame={handleStartGame}
                  disabled={status !== 'waiting'}
                  isLoading={isStarting}
                />
              </div>
            )}

            {/* Non-host waiting message */}
            {!isHost && status === 'waiting' && (
              <div className="text-center py-6 border-t-2 border-dashed border-purple-200">
                <div className="inline-flex items-center gap-2 text-zinc-600">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Esperando al anfitrión...</span>
                </div>
              </div>
            )}
          </div>

          {/* Leave button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-zinc-500 hover:text-zinc-700 text-sm font-medium transition-colors"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
