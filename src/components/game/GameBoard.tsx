/**
 * GameBoard - Interactive Boggle board with drag-to-select
 * Handles touch/mouse events for word selection
 * Renders visual path between selected cells
 */

"use client";

import { useRef, useCallback, useState, useMemo, memo, useEffect } from "react";
import type { Cell } from "@/server/types";
import type { SelectedCell, WordSelection } from "@/types/game";
import {
  getAdjacentCells,
  calculateCellPosition,
  getCellFromCoordinates,
} from "@/lib/board-utils";
import {
  MAX_CELL_SIZE,
  MIN_CELL_SIZE,
  MAX_GAP,
  computeBoardDimension,
} from "@/lib/board-constants";

interface GameBoardProps {
  board: string[][];
  selection: WordSelection;
  onSelectionStart: (cell: SelectedCell) => void;
  onSelectionMove: (cell: SelectedCell) => void;
  onSelectionEnd: () => void;
  isLocked: boolean;
}

const GameBoardMemo = function GameBoard({
  board,
  selection,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd,
  isLocked,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
  const lastCellRef = useRef<Cell | null>(null);

  const gridSize = board.length;

  // Dynamic cell dimensions — initialized to max, synced from DOM after render
  const [cellSize, setCellSize] = useState(MAX_CELL_SIZE);
  const [gap, setGap] = useState(MAX_GAP);

  // Sync cell dimensions from rendered DOM after mount and on resize
  useEffect(() => {
    const measure = () => {
      const firstCell = boardRef.current?.querySelector(
        '[data-testid^="board-cell-"]',
      );
      if (!firstCell) return;
      const rect = firstCell.getBoundingClientRect();
      const measuredSize = Math.round(rect.width);
      if (measuredSize > 0) {
        setCellSize(measuredSize);
      }
      const gridEl = boardRef.current?.querySelector(".grid");
      if (!gridEl) return;
      const computedGap =
        Number.parseFloat(getComputedStyle(gridEl).gap) || MAX_GAP;
      setGap(Math.round(computedGap));
    };

    // Measure after initial layout
    const raf = requestAnimationFrame(measure);

    let timeoutId: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(measure, 100);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      clearTimeout(timeoutId);
    };
  }, [gridSize]);

  // Create lookup for selected cells
  const selectedCellsSet = useMemo(() => {
    return new Set(selection.cells.map((c) => `${c.row},${c.col}`));
  }, [selection.cells]);

  /**
   * Check if a cell can be added to selection (adjacent to last cell)
   */
  const canAddCell = useCallback(
    (cell: Cell): boolean => {
      // Can't add already selected cells
      if (selectedCellsSet.has(`${cell.row},${cell.col}`)) {
        return false;
      }

      if (selection.cells.length === 0) {
        return true; // First cell
      }

      const lastCell = selection.cells[selection.cells.length - 1];
      const adjacent = getAdjacentCells(lastCell, gridSize);

      return adjacent.some((a) => a.row === cell.row && a.col === cell.col);
    },
    [selectedCellsSet, selection.cells, gridSize],
  );

  /**
   * Get selected cell with visual position
   */
  const getSelectedCell = useCallback(
    (cell: Cell): SelectedCell => {
      const pos = calculateCellPosition(cell.row, cell.col, cellSize, gap);
      return { ...cell, x: pos.x, y: pos.y };
    },
    [cellSize, gap],
  );

  /**
   * Handle pointer down (start selection)
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isLocked) return;

      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cell = getCellFromCoordinates(x, y, cellSize, gap, gridSize);
      if (!cell) return;

      setIsDragging(true);
      lastCellRef.current = cell;

      const selectedCell = getSelectedCell(cell);
      onSelectionStart(selectedCell);

      // Prevent scrolling on touch
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [isLocked, gridSize, cellSize, gap, getSelectedCell, onSelectionStart],
  );

  /**
   * Handle pointer move (extend selection or backtrack)
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || isLocked) return;

      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cell = getCellFromCoordinates(x, y, cellSize, gap, gridSize);

      // Update hovered cell for visual feedback (even if null)
      setHoveredCell(cell);

      if (!cell) return;
      if (
        lastCellRef.current?.row !== cell.row ||
        lastCellRef.current?.col !== cell.col
      ) {
        lastCellRef.current = cell;
        const selectedCell = getSelectedCell(cell);
        onSelectionMove(selectedCell);
      }
    },
    [
      isDragging,
      isLocked,
      gridSize,
      cellSize,
      gap,
      getSelectedCell,
      onSelectionMove,
    ],
  );

  /**
   * Handle pointer up (end selection, submit word)
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      setIsDragging(false);
      setHoveredCell(null);
      lastCellRef.current = null;

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      onSelectionEnd();
    },
    [isDragging, onSelectionEnd],
  );

  /**
   * Generate SVG path for visual line connecting cells
   */
  const selectionPath = useMemo(() => {
    if (selection.cells.length < 2) return "";

    const path = selection.cells
      .map((cell, i) => {
        if (i === 0) {
          return `M ${cell.x} ${cell.y}`;
        }
        return `L ${cell.x} ${cell.y}`;
      })
      .join(" ");

    return path;
  }, [selection.cells]);

  // Calculate board dimensions for SVG (uses measured cellSize/gap after sync)
  const boardWidth = computeBoardDimension(gridSize, cellSize, gap);
  const boardHeight = computeBoardDimension(gridSize, cellSize, gap);

  return (
    <div className="relative inline-block" data-testid="game-board">
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
        className="grid bg-white border-4 border-indigo-300 rounded-2xl shadow-2xl p-2 select-none touch-none overscroll-none"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, minmax(${MIN_CELL_SIZE}px, ${MAX_CELL_SIZE}px))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(${MIN_CELL_SIZE}px, ${MAX_CELL_SIZE}px))`,
          gap: `${MAX_GAP}px`,
          width: "fit-content",
          maxWidth: "100%",
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
            const isHovered =
              isDragging &&
              hoveredCell?.row === rowIndex &&
              hoveredCell?.col === colIndex;
            const isValidNext = isDragging && !isSelected && canAddCell(cell);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                data-testid={`board-cell-${rowIndex}-${colIndex}`}
                className={`
                  flex items-center justify-center
                  font-black rounded-xl
                  transition-all duration-150 ease-out
                  relative overflow-hidden
                  ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-lg scale-105 z-10"
                      : isHovered && isValidNext
                        ? "bg-indigo-400 text-white shadow-lg scale-105"
                        : isHovered
                          ? "bg-indigo-200 text-indigo-900 scale-102"
                          : "bg-indigo-100 text-indigo-900"
                  }
                  ${!isSelected && !isLocked ? "hover:bg-indigo-200" : ""}
                  ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  ${!isLocked && !isSelected && !isHovered ? "hover:scale-102 hover:shadow-md" : ""}
                `}
                style={{
                  fontSize: `clamp(${MIN_CELL_SIZE * 0.45}px, ${cellSize * 0.43}px, ${MAX_CELL_SIZE * 0.45}px)`,
                  transformOrigin: "center",
                }}
              >
                {/* Subtle shine effect for unselected cells */}
                {!isSelected && !isHovered && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-xl pointer-events-none" />
                )}
                {/* Highlight ring for valid next cell during drag */}
                {isHovered && isValidNext && !isSelected && (
                  <div className="absolute inset-0 -m-1 border-2 border-indigo-500 rounded-xl pointer-events-none animate-pulse" />
                )}
                {letter}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};

export const GameBoard = memo(GameBoardMemo);
