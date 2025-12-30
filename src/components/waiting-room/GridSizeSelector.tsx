"use client";

import type { GridSize } from "@/server/db/schema";

interface GridSizeSelectorProps {
  value: GridSize;
  onChange: (size: GridSize) => void;
  disabled?: boolean;
}

const GRID_OPTIONS: Array<{
  value: GridSize;
  label: string;
  description: string;
}> = [
  { value: 4, label: "4 × 4", description: "90 segundos" },
  { value: 5, label: "5 × 5", description: "2 minutos" },
  { value: 6, label: "6 × 6", description: "3 minutos" },
];

export function GridSizeSelector({
  value,
  onChange,
  disabled,
}: GridSizeSelectorProps) {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-indigo-900 mb-4">
        Tamaño del tablero
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {GRID_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`
              p-4 rounded-xl border-2 transition-all
              ${
                value === option.value
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-lg"
                  : "border-indigo-200 bg-white text-indigo-900 hover:border-indigo-400 hover:bg-indigo-50"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="text-lg font-bold">{option.label}</div>
            <div className="text-sm opacity-80">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
