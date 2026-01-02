"use client";

import { motion, AnimatePresence } from 'framer-motion';

interface CopyFeedbackProps {
  isCopied: boolean;
}

export function CopyFeedback({ isCopied }: CopyFeedbackProps) {
  return (
    <AnimatePresence mode="wait">
      {isCopied ? (
        <motion.div
          key="copied"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-green-600"
          role="img"
          aria-label="Copiado"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      ) : (
        <motion.div
          key="copy"
          initial={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="text-gray-600 hover:text-gray-800"
          role="img"
          aria-label="Copiar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
