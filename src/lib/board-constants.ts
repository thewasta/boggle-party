/**
 * Board sizing constants and helper functions.
 * Single source of truth for cell dimensions used by GameBoard and WordPath.
 */

/** Maximum cell size in pixels (desktop default) */
export const MAX_CELL_SIZE = 70;

/** Minimum cell size in pixels (WCAG AA touch target: 44×44px) */
export const MIN_CELL_SIZE = 44;

/** Maximum gap between cells in pixels (desktop default) */
export const MAX_GAP = 8;

/** Minimum gap between cells in pixels */
export const MIN_GAP = 4;

/**
 * Compute total board width or height from grid size and cell dimensions.
 *
 * Formula: gridSize * (cellSize + gap) - gap
 *
 * Examples:
 *   4×4 at max: 4 * (70 + 8) - 8 = 304
 *   6×6 at max: 6 * (70 + 8) - 8 = 460
 *   6×6 at min: 6 * (44 + 4) - 4 = 284
 */
export function computeBoardDimension(
  gridSize: number,
  cellSize: number,
  gap: number,
): number {
  return gridSize * (cellSize + gap) - gap;
}
