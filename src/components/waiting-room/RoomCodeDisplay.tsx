"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { copyToClipboard } from "@/lib/utils";
import { CopyFeedback } from "@/components/ui/CopyFeedback";

interface RoomCodeDisplayProps {
  roomCode: string;
}

export function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(roomCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3" data-testid="room-code-display">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-medium text-indigo-700"
      >
        Comparte este código con tus amigos
      </motion.p>
      <div className="flex items-center gap-3">
        <motion.code
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-5xl font-mono font-black tracking-widest text-indigo-700 px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border-2 border-indigo-300"
        >
          {roomCode}
        </motion.code>
        <motion.button
          type="button"
          onClick={handleCopy}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          aria-label="Copiar código"
        >
          <CopyFeedback isCopied={copied} />
        </motion.button>
      </div>
      <AnimatePresence mode="wait">
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full"
          >
            ¡Copiado!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
