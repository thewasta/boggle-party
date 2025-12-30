/**
 * GameBoard - Interactive Boggle board with drag-to-select
 * Handles touch/mouse events for word selection
 * Renders visual path between selected cells
 */

"use client";

import { useRef, useCallback, useState, useMemo } from 'react';
import type { Cell, SelectedCell, WordSelection } from '@/types/game';
import { getAdjacentCells, calculateCellPosition, getCellFromCoordinates } from '@/lib/board-utils';

interface GameBoardProps {
  board: string[][];
  selection: WordSelection;
  onSelectionStart: (cell: SelectedCell) => void;
  onSelectionMove: (cell: SelectedCell) => void;
  onSelectionEnd: () => void;
  isLocked: boolean;
}

const CELL_SIZE = 70;
const CELL_GAP = 8;

export function GameBoard({
  board,
  selection,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd,
  isLocked,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastCellRef = useRef<Cell | null>(null);

  const gridSize = board.length;

  // Create lookup for selected cells
  const selectedCellsSet = useMemo(() => {
    return new Set(selection.cells.map((c) => `${c.row},${c.col}`));
  }, [selection.cells]);

  /**
   * Check if a cell can be added to selection (adjacent to last cell)
   */
  const canAddCell = useCallback((cell: Cell): boolean => {
    if (selectedCellsSet.has(`${cell.row},${cell.col}`)) {
      return false; // Already selected
    }

    if (selection.cells.length === 0) {
      return true; // First cell
    }

    const lastCell = selection.cells[selection.cells.length - 1];
    const adjacent = getAdjacentCells(lastCell, gridSize);

    return adjacent.some((a) => a.row === cell.row && a.col === cell.col);
  }, [selectedCellsSet, selection.cells, gridSize]);

  /**
   * Get selected cell with visual position
   */
  const getSelectedCell = useCallback((cell: Cell): SelectedCell => {
    const pos = calculateCellPosition(cell.row, cell.col, CELL_SIZE, CELL_GAP);
    return { ...cell, x: pos.x, y: pos.y };
  }, []);

  /**
   * Handle pointer down (start selection)
   */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isLocked) return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cell = getCellFromCoordinates(x, y, CELL_SIZE, CELL_GAP, gridSize);
    if (!cell) return;

    setIsDragging(true);
    lastCellRef.current = cell;

    const selectedCell = getSelectedCell(cell);
    onSelectionStart(selectedCell);

    // Prevent scrolling on touch
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isLocked, gridSize, getSelectedCell, onSelectionStart]);

  /**
   * Handle pointer move (extend selection)
   */
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isLocked) return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cell = getCellFromCoordinates(x, y, CELL_SIZE, CELL_GAP, gridSize);
    if (!cell) return;

    // Skip if same as last cell
    if (lastCellRef.current?.row === cell.row && lastCellRef.current?.col === cell.col) {
      return;
    }

    if (canAddCell(cell)) {
      lastCellRef.current = cell;
      const selectedCell = getSelectedCell(cell);
      onSelectionMove(selectedCell);
    }
  }, [isDragging, isLocked, gridSize, canAddCell, getSelectedCell, onSelectionMove]);

  /**
   * Handle pointer up (end selection, submit word)
   */
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    setIsDragging(false);
    lastCellRef.current = null;

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    onSelectionEnd();
  }, [isDragging, onSelectionEnd]);

  /**
   * Generate SVG path for visual line connecting cells
   */
  const selectionPath = useMemo(() => {
    if (selection.cells.length < 2) return '';

    const path = selection.cells.map((cell, i) => {
      if (i === 0) {
        return `M ${cell.x} ${cell.y}`;
      }
      return `L ${cell.x} ${cell.y}`;
    }).join(' ');

    return path;
  }, [selection.cells]);

  // Calculate board dimensions for SVG
  const boardWidth = gridSize * (CELL_SIZE + CELL_GAP) - CELL_GAP;
  const boardHeight = gridSize * (CELL_SIZE + CELL_GAP) - CELL_GAP;

  return (
    <div className="relative inline-block">
      {/* SVG overlay for selection path */}
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
        {selectionPath && (
          <path
            d={selectionPath}
            stroke="#4F46E5"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-md"
            filter="url(#glow)"
          />
        )}
      </svg>

      {/* Board grid */}
      <div
        ref={boardRef}
        className="grid bg-white border-4 border-indigo-300 rounded-2xl shadow-2xl p-2 select-none touch-none"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${CELL_SIZE}px)`,
          gap: `${CELL_GAP}px`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {board.map((row, rowIndex) =>
          row.map((letter, colIndex) => {
            const cell = { row: rowIndex, col: colIndex };
            const isSelected = selectedCellsSet.has(`${rowIndex},${colIndex}`);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  flex items-center justify-center
                  text-3xl font-black rounded-xl
                  transition-all duration-150 ease-out
                  relative overflow-hidden
                  ${isSelected
                    ? 'bg-indigo-600 text-white shadow-lg scale-105 z-10'
                    : 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200'
                  }
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${!isLocked && !isSelected ? 'hover:scale-102 hover:shadow-md' : ''}
                `}
                style={{ transformOrigin: 'center' }}
              >
                {/* Subtle shine effect for unselected cells */}
                {!isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-xl pointer-events-none" />
                )}
                {letter}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
