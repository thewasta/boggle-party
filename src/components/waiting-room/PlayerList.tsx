"use client";

import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from "@/server/types";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

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
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg font-semibold text-indigo-900"
        >
          Jugadores
        </motion.h2>
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-sm font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full"
        >
          {players.length}/{maxPlayers}
        </motion.span>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
                ease: 'easeOut'
              }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200"
            >
              <PlayerAvatar avatar={player.avatar} name={player.name} />
              <span className="font-semibold text-indigo-900 flex-1">
                {player.name}
              </span>
              {player.id === hostId && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-full"
                >
                  Anfitrión
                </motion.span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {players.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-zinc-600 py-8"
          >
            Esperando jugadores...
          </motion.p>
        )}
      </div>
    </div>
  );
}
