import { getRandomLetter } from './letter-frequencies';
import type { GridSize } from './db/schema';

export interface BoardStats {
  totalCells: number;
  uniqueLetters: number;
  letterCounts: Record<string, number>;
  mostFrequent: string;
}

/**
 * Generate a random Boggle board with Spanish letter frequencies
 */
export function generateBoard(gridSize: GridSize): string[][] {
  const board: string[][] = [];

  for (let row = 0; row < gridSize; row++) {
    const boardRow: string[] = [];
    for (let col = 0; col < gridSize; col++) {
      boardRow.push(getRandomLetter());
    }
    board.push(boardRow);
  }

  return board;
}

/**
 * Get statistics about a board
 */
export function getBoardStats(board: string[][]): BoardStats {
  const letterCounts: Record<string, number> = {};
  let totalCells = 0;

  for (const row of board) {
    for (const letter of row) {
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
      totalCells++;
    }
  }

  const uniqueLetters = Object.keys(letterCounts).length;
  const mostFrequent = Object.entries(letterCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  return {
    totalCells,
    uniqueLetters,
    letterCounts,
    mostFrequent,
  };
}

/**
 * Validate board structure
 */
export function isValidBoard(board: string[][]): boolean {
  if (!board || board.length === 0) {
    return false;
  }

  const size = board.length;

  for (const row of board) {
    if (!row || row.length !== size) {
      return false;
    }

    for (const cell of row) {
      if (!cell || !/^[A-ZÑ]$/.test(cell)) {
        return false;
      }
    }
  }

  return true;
}
