'use client';

import type { Player } from '@/server/types';

interface PlayerListProps {
  players: Player[];
  hostId: string;
  maxPlayers?: number;
}

export function PlayerList({ players, hostId, maxPlayers = 8 }: PlayerListProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Jugadores
        </h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {players.length}/{maxPlayers}
        </span>
      </div>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800"
          >
            <span className="text-3xl">{player.avatar}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100 flex-1">
              {player.name}
            </span>
            {player.id === hostId && (
              <span className="px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-full">
                Anfitrión
              </span>
            )}
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
            Esperando jugadores...
          </p>
        )}
      </div>
    </div>
  );
}
