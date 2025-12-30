/**
 * Timer - displays synchronized countdown with urgency indicators
 * Builds visual tension as time runs low
 */

"use client";

import type { TimerState } from '@/types/game';

interface TimerProps {
  timerState: TimerState;
}

export function Timer({ timerState }: TimerProps) {
  const { remaining, isPaused } = timerState;

  // Format time as MM:SS with leading zeros
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Determine visual state based on remaining time
  const getTimeState = () => {
    if (remaining <= 10) return 'critical';
    if (remaining <= 30) return 'warning';
    return 'normal';
  };

  const timeState = getTimeState();

  // Calculate urgency ring percentage
  const ringOffset = remaining > 0 ? (1 - remaining / 120) * 283 : 283;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Timer display with urgency styling */}
      <div className="relative">
        {/* Urgency glow effect */}
        {timeState === 'critical' && (
          <div className="absolute inset-0 -m-4 bg-red-500/20 rounded-full blur-xl animate-pulse" />
        )}

        {/* Timer container */}
        <div className="relative">
          {/* Background ring (SVG) */}
          <svg className="absolute inset-0 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 w-40 h-40 -rotate-90 opacity-20">
            <circle
              cx="80"
              cy="80"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-zinc-300"
            />
            <circle
              cx="80"
              cy="80"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              className={`transition-all duration-300 ${
                timeState === 'critical'
                  ? 'text-red-500'
                  : timeState === 'warning'
                  ? 'text-orange-500'
                  : 'text-indigo-600'
              }`}
            />
          </svg>

          {/* Time display */}
          <div className={`relative font-black tracking-tighter tabular-nums ${
            timeState === 'critical'
              ? 'text-7xl text-red-600 animate-pulse drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]'
              : timeState === 'warning'
              ? 'text-7xl text-orange-600 drop-shadow-lg'
              : 'text-7xl text-indigo-900 drop-shadow-md'
          }`}>
            {formatted}
          </div>
        </div>
      </div>

      {/* Status indicator */}
      {isPaused && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-100 rounded-full">
          <div className="w-2 h-2 rounded-full bg-zinc-400" />
          <span className="text-sm font-bold text-zinc-600 tracking-wide">PAUSADO</span>
        </div>
      )}

      {/* Urgency label for critical time */}
      {timeState === 'critical' && !isPaused && remaining > 0 && (
        <div className="text-xs font-black text-red-600 tracking-widest animate-pulse">
          ¡ÚLTIMOS SEGUNDOS!
        </div>
      )}
    </div>
  );
}
