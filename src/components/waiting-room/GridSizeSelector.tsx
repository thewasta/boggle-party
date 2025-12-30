'use client';

import type { GridSize } from '@/server/db/schema';

interface GridSizeSelectorProps {
  value: GridSize;
  onChange: (size: GridSize) => void;
  disabled?: boolean;
}

const GRID_OPTIONS: Array<{ value: GridSize; label: string; description: string }> = [
  { value: 4, label: '4 × 4', description: '2 minutos' },
  { value: 5, label: '5 × 5', description: '3 minutos' },
  { value: 6, label: '6 × 6', description: '6 minutos' },
];

export function GridSizeSelector({ value, onChange, disabled }: GridSizeSelectorProps) {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Tamaño del tablero
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {GRID_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${value === option.value
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {option.label}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {option.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
