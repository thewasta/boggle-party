"use client";

import { motion } from "framer-motion";
import type { PlayerScore } from "@/app/results/[roomId]/page";
import { PlayAgainButton } from "./PlayAgainButton";

interface FinalRankingProps {
  playerScores: PlayerScore[];
  roomCode: string | null;
  playerId: string;
  isHost: boolean;
}

export function FinalRanking({ playerScores, roomCode, playerId, isHost }: FinalRankingProps) {
  const winner = playerScores[0];
  const topThree = playerScores.slice(0, 3);

  return (
    <div className="space-y-6">
      {winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl mb-3"
          >
            🏆
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black text-gray-900 mb-1"
          >
            ¡{winner.name} gana!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500"
          >
            {winner.score} puntos
          </motion.p>
        </motion.div>
      )}

      <div className="flex items-end justify-center gap-3 sm:gap-6 py-4">
        {topThree.map((player, index) => {
          const medals = ["🥇", "🥈", "🥉"];
          const medalColors = [
            "from-yellow-400 to-amber-500",
            "from-gray-300 to-gray-400",
            "from-orange-400 to-amber-600",
          ];
          const podiumHeights = [
            "h-28 sm:h-36",
            "h-20 sm:h-28",
            "h-16 sm:h-24",
          ];
          const avatarSizes = [
            "w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl",
            "w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl",
            "w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl",
          ];

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2, type: "spring" }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                  ease: "easeInOut",
                }}
                className="text-4xl sm:text-5xl mb-2"
              >
                {medals[index]}
              </motion.div>

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.2 + 0.4, type: "spring" }}
                className={`rounded-xl flex items-center justify-center shadow-lg border-3 bg-gradient-to-br ${medalColors[index]} ${avatarSizes[index]} ${
                  index === 0
                    ? "border-yellow-300"
                    : index === 1
                      ? "border-gray-200"
                      : "border-orange-300"
                }`}
              >
                {player.avatar}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.6 }}
                className="mt-2 text-center"
              >
                <p
                  className={`text-xs sm:text-sm font-bold ${
                    index === 0
                      ? "text-amber-700"
                      : index === 1
                        ? "text-gray-700"
                        : "text-orange-700"
                  }`}
                >
                  {player.name}
                </p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 + 0.8 }}
                  className={`text-lg sm:text-xl font-black ${
                    index === 0
                      ? "text-amber-600"
                      : index === 1
                        ? "text-gray-600"
                        : "text-orange-600"
                  }`}
                >
                  {player.score}
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: index * 0.2 + 1, ease: "easeOut" }}
                style={{ transformOrigin: "bottom" }}
                className={`w-14 sm:w-20 mt-2 rounded-t-lg bg-gradient-to-b ${medalColors[index]} ${podiumHeights[index]} opacity-80`}
              />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        {roomCode && (
          <PlayAgainButton
            roomCode={roomCode}
            playerId={playerId}
            isHost={isHost}
          />
        )}
      </motion.div>
    </div>
  );
}
