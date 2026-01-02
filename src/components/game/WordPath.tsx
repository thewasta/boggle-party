"use client";

import { motion } from 'framer-motion';
import type { SelectedCell } from '@/types/game';

interface WordPathProps {
  cells: SelectedCell[];
  gridSize: number;
}

const CELL_SIZE = 70;
const CELL_GAP = 8;

export function WordPath({ cells, gridSize }: WordPathProps) {
  if (cells.length < 2) return null;

  const boardWidth = gridSize * (CELL_SIZE + CELL_GAP) - CELL_GAP;
  const boardHeight = gridSize * (CELL_SIZE + CELL_GAP) - CELL_GAP;

  // Calculate cell center positions
  const getPosition = (index: number) => {
    const cell = cells[index];
    // x, y are already calculated in SelectedCell
    // We need to offset by half cell size to center on cell
    return {
      x: cell.x + CELL_SIZE / 2,
      y: cell.y + CELL_SIZE / 2
    };
  };

  const lines = [];
  for (let i = 0; i < cells.length - 1; i++) {
    const start = getPosition(i);
    const end = getPosition(i + 1);

    lines.push(
      <motion.line
        key={i}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="#4F46E5"
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: i * 0.05 }}
        className="drop-shadow-md"
      />
    );
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: boardWidth, height: boardHeight }}
      viewBox={`0 0 ${boardWidth} ${boardHeight}`}
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#glow)">{lines}</g>
    </svg>
  );
}
