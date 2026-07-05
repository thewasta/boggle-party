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

  // Formateo seguro
  const safeRemaining = Math.max(0, remaining || 0);
  const minutes = Math.floor(safeRemaining / 60);
  const seconds = safeRemaining % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const getTimeState = () => {
    if (safeRemaining <= 10) return 'critical';
    if (safeRemaining <= 30) return 'warning';
    return 'normal';
  };

  const timeState = getTimeState();
  
  // 283 es el perímetro para un radio de 45 (2 * PI * 45)
  // Usamos un valor fijo para evitar saltos en iOS
  const totalDash = 283;
  const ringOffset = safeRemaining > 0 ? (1 - safeRemaining / 120) * totalDash : totalDash;

  return (
    <div className="flex flex-col items-center gap-3" data-testid="timer">
      {/* Contenedor principal con tamaño EXPLÍCITO para iOS */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        
        {/* Glow de urgencia */}
        {timeState === 'critical' && (
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
        )}

        {/* SVG mejorado para WebKit */}
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100" 
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Círculo de fondo (Riel) */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-zinc-200 opacity-20"
          />
          {/* Círculo de progreso */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={totalDash}
            strokeDashoffset={ringOffset}
            strokeLinecap="round"
            className={`transition-all duration-500 ease-linear ${
              timeState === 'critical'
                ? 'text-red-500'
                : timeState === 'warning'
                ? 'text-orange-500'
                : 'text-indigo-600'
            }`}
          />
        </svg>

        {/* El Texto: Usamos z-index para asegurar que flote sobre el SVG */}
        <div className={`relative z-10 font-black tracking-tighter tabular-nums leading-none ${
          timeState === 'critical'
            ? 'text-6xl text-red-600 animate-pulse'
            : timeState === 'warning'
            ? 'text-6xl text-orange-600'
            : 'text-6xl text-indigo-900'
        }`}>
          {formatted}
        </div>
      </div>

      {/* Etiquetas inferiores */}
      <div className="h-6"> {/* Contenedor de altura fija para evitar saltos */}
        {isPaused ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full">
            <span className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase">Pausado</span>
          </div>
        ) : (
          timeState === 'critical' && safeRemaining > 0 && (
            <div className="text-[10px] font-black text-red-600 tracking-widest animate-pulse uppercase">
              ¡Últimos segundos!
            </div>
          )
        )}
      </div>
    </div>
  );
}