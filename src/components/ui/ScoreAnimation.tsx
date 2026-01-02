"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ScoreAnimationProps {
  score: number;
  isUnique: boolean;
}

export function ScoreAnimation({ score, isUnique }: ScoreAnimationProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, y: 20 }}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-lg font-bold shadow-sm ${
          isUnique
            ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-yellow-900"
            : "bg-gradient-to-r from-emerald-400 to-green-500 text-white"
        }`}
      >
        {isUnique && (
          <motion.span
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm"
          >
            ↗
          </motion.span>
        )}
        +{score}
      </motion.div>
    </AnimatePresence>
  );
}
