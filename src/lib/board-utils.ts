/**
 * Board geometry and adjacency utilities for the game board
 */

import type { Cell } from '@/server/types';

const GRID_DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1],
];

/**
 * Get all valid adjacent cells for a given position
 */
export function getAdjacentCells(cell: Cell, gridSize: number): Cell[] {
  const adjacent: Cell[] = [];

  for (const [dr, dc] of GRID_DIRECTIONS) {
    const newRow = cell.row + dr;
    const newCol = cell.col + dc;

    if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
      adjacent.push({ row: newRow, col: newCol });
    }
  }

  return adjacent;
}

/**
 * Check if two cells are adjacent (including diagonals)
 */
export function areCellsAdjacent(cell1: Cell, cell2: Cell): boolean {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);

  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Calculate the visual center position of a cell
 * Used for drawing lines between selected cells
 */
export function calculateCellPosition(
  row: number,
  col: number,
  cellSize: number,
  gap: number
): { x: number; y: number } {
  const x = col * (cellSize + gap) + cellSize / 2;
  const y = row * (cellSize + gap) + cellSize / 2;

  return { x, y };
}

/**
 * Get cell from row/col coordinates (touch/mouse event handling)
 */
export function getCellFromCoordinates(
  x: number,
  y: number,
  cellSize: number,
  gap: number,
  gridSize: number
): Cell | null {
  const totalSize = cellSize + gap;
  const col = Math.floor(x / totalSize);
  const row = Math.floor(y / totalSize);

  if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
    return { row, col };
  }

  return null;
}
