/**
 * Countdown overlay - 3-2-1-¡YA! sequence before game starts
 * High-energy transitions with elastic animations
 */

"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownProps {
  onComplete: () => void;
}

export function Countdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState<3 | 2 | 1 | 'go'>(3);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof count === 'number') {
        if (count === 1) {
          setCount('go');
        } else {
          setCount((count - 1) as 3 | 2 | 1);
        }
      } else {
        setIsVisible(false);
        setTimeout(onComplete, 400);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {count === 'go' ? (
          <motion.div
            key="go"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 0.5,
                rotate: { repeat: 2, duration: 0.2 }
              }}
              className="text-[12rem] font-black text-green-400 drop-shadow-[0_0_60px_rgba(74,222,128,0.6)]"
            >
              ¡YA!
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-green-300 tracking-widest -mt-5"
            >
              ¡JUEGA!
            </motion.span>
          </motion.div>
        ) : (
          <motion.div
            key={count}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Outer ring effect */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 -m-8 rounded-full border-4 border-white/20"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.25, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute inset-0 -m-4 rounded-full border-2 border-white/30"
            />

            <motion.span
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 0.3
              }}
              className="text-[14rem] font-black text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative z-10"
            >
              {count}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
