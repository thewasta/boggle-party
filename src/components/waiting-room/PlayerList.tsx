"use client";

import type { Player } from "@/server/types";

interface PlayerListProps {
  players: Player[];
  hostId: string;
  maxPlayers?: number;
}

export function PlayerList({
  players,
  hostId,
  maxPlayers = 8,
}: PlayerListProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-indigo-900">
          Jugadores
        </h2>
        <span className="text-sm font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
          {players.length}/{maxPlayers}
        </span>
      </div>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200"
          >
            <span className="text-3xl">{player.avatar}</span>
            <span className="font-semibold text-indigo-900 flex-1">
              {player.name}
            </span>
            {player.id === hostId && (
              <span className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-full">
                Anfitrión
              </span>
            )}
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-center text-zinc-600 py-8">
            Esperando jugadores...
          </p>
        )}
      </div>
    </div>
  );
}
