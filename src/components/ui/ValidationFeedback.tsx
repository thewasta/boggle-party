"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';

interface ValidationFeedbackProps {
  isValid: boolean | null;
  word: string;
}

export function ValidationFeedback({ isValid, word }: ValidationFeedbackProps) {
  return (
    <AnimatePresence mode="wait">
      {isValid === true && (
        <motion.div
          key="valid"
          initial={{ scale: 0, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0, y: -50, opacity: 0 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Check className="w-5 h-5" />
          </motion.div>
          <span className="font-medium">¡{word} es válida!</span>
          <Sparkles className="w-4 h-4" />
        </motion.div>
      )}

      {isValid === false && (
        <motion.div
          key="invalid"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
        >
          <motion.div
            animate={{ x: [-5, 5, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <X className="w-5 h-5" />
          </motion.div>
          <span className="font-medium">"{word}" no es válida</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
