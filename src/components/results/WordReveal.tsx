"use client";

import { motion } from "framer-motion";
import type { RevealWord } from "@/app/results/[roomId]/page";
import { ScoreAnimation } from "@/components/ui/ScoreAnimation";

interface WordRevealProps {
  word: RevealWord;
  delay: number;
  isLatest?: boolean;
}

export function WordReveal({ word, delay, isLatest }: WordRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: word.isUnique || isLatest ? 1 : 0.95 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: "easeOut" }}
      className={`relative rounded-2xl shadow-lg border-2 p-4 overflow-hidden ${
        word.isUnique
          ? "bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-yellow-400 shadow-yellow-200/50"
          : "bg-white border-gray-200"
      } ${isLatest ? "scale-100 opacity-100" : ""}`}
    >
      {word.isUnique && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay / 1000 + 0.3 }}
          className="absolute inset-0 bg-gradient-to-r from-yellow-300/10 via-amber-200/20 to-yellow-300/10 animate-pulse"
        />
      )}

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: delay / 1000 + 0.2,
              type: "spring",
              stiffness: 200,
            }}
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md ${
              word.isUnique
                ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                : "bg-gradient-to-br from-gray-200 to-gray-300"
            }`}
          >
            {word.player.avatar}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay / 1000 + 0.3 }}
            className="hidden sm:block min-w-0"
          >
            <p className="text-xs font-semibold text-gray-600 truncate">
              {word.player.name}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay / 1000 + 0.4 }}
          className="flex-1 text-center px-2"
        >
          <p
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              word.isUnique ? "text-yellow-800" : "text-gray-800"
            }`}
          >
            {word.word}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay / 1000 + 0.5 }}
          className="flex items-center gap-2 shrink-0"
        >
          <ScoreAnimation score={word.score} isUnique={word.isUnique} />

          {word.isUnique && (
            <motion.span
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: delay / 1000 + 0.7, type: "spring" }}
              className="text-lg font-black text-yellow-700"
            >
              ×2
            </motion.span>
          )}
        </motion.div>
      </div>

      {word.isUnique && isLatest && (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay / 1000 + 0.8 }}
            className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-sparkle"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay / 1000 + 1 }}
            className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-sparkle"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay / 1000 + 1.2 }}
            className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-orange-400 rounded-full animate-sparkle"
          />
        </>
      )}
    </motion.div>
  );
}
