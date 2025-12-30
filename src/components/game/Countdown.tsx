/**
 * Countdown overlay - 3-2-1-¡YA! sequence before game starts
 * High-energy transitions with elastic animations
 */

"use client";

import { useEffect, useState } from 'react';

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
      <div className="relative">
        {/* Outer ring effect */}
        <div className="absolute inset-0 -m-8 rounded-full border-4 border-white/20 scale-150 animate-ping" />
        <div className="absolute inset-0 -m-4 rounded-full border-2 border-white/30 scale-125" />

        {/* Main number */}
        <div className="relative">
          {count === 'go' ? (
            <div className="flex flex-col items-center">
              <span className="text-[12rem] font-black text-green-400 drop-shadow-[0_0_60px_rgba(74,222,128,0.6)] animate-explode">
                ¡YA!
              </span>
              <span className="text-2xl font-bold text-green-300 tracking-widest -mt-5 animate-pulse">
                ¡JUEGA!
              </span>
            </div>
          ) : (
            <span className="text-[14rem] font-black text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-elastic-in">
              {count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
