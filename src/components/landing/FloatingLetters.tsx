"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const LETTERS = 'B O G G L E P A R T Y'.split(' ');

export function FloatingLetters() {
  const [letters, setLetters] = useState<Array<{ id: number; letter: string; x: number; y: number }>>([]);

  useEffect(() => {
    const positioned = LETTERS.map((letter, i) => ({
      id: i,
      letter,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
    }));
    setLetters(positioned);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {letters.map(({ id, letter, x, y }) => (
        <motion.div
          key={id}
          className="absolute text-4xl font-bold text-orange-200 opacity-30"
          style={{ left: `${x}%`, top: `${y}%` }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 2,
          }}
        >
          {letter}
        </motion.div>
      ))}
    </div>
  );
}
