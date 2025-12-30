export interface Cell {
  row: number;
  col: number;
}

/**
 * Calculate score based on word length
 * - 3-4 letters: 1 point
 * - 5 letters: 2 points
 * - 6 letters: 3 points
 * - 7+ letters: 5 points
 */
export function calculateScore(word: string): number {
  const length = word.length;

  if (length < 3) {
    return 0;
  }

  if (length <= 4) {
    return 1;
  }

  if (length === 5) {
    return 2;
  }

  if (length === 6) {
    return 3;
  }

  return 5; // 7+ letters
}

/**
 * Check if two cells are adjacent (including diagonals)
 */
export function areAdjacent(cell1: Cell, cell2: Cell): boolean {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);

  // Adjacent means max 1 step in any direction
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Validate that a path is contiguous and has no repeated cells
 */
export function isValidPath(path: Cell[], gridSize: number): boolean {
  if (!path || path.length < 2) {
    return false;
  }

  // Check bounds
  for (const cell of path) {
    if (cell.row < 0 || cell.row >= gridSize || cell.col < 0 || cell.col >= gridSize) {
      return false;
    }
  }

  // Check no repeated cells
  const seen = new Set<string>();
  for (const cell of path) {
    const key = `${cell.row},${cell.col}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
  }

  // Check adjacency between consecutive cells
  for (let i = 0; i < path.length - 1; i++) {
    if (!areAdjacent(path[i], path[i + 1])) {
      return false;
    }
  }

  return true;
}
