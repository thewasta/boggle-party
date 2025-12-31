import { describe, it, expect } from 'vitest';
import { getAdjacentCells, areCellsAdjacent, calculateCellPosition, getCellFromCoordinates } from './board-utils';

describe('board-utils', () => {
  describe('getAdjacentCells', () => {
    it('returns all 8 adjacent cells for interior position', () => {
      const result = getAdjacentCells({ row: 1, col: 1 }, 4);
      expect(result).toHaveLength(8);
      expect(result).toContainEqual({ row: 0, col: 0 });
      expect(result).toContainEqual({ row: 0, col: 1 });
      expect(result).toContainEqual({ row: 0, col: 2 });
      expect(result).toContainEqual({ row: 1, col: 0 });
      expect(result).toContainEqual({ row: 1, col: 2 });
      expect(result).toContainEqual({ row: 2, col: 0 });
      expect(result).toContainEqual({ row: 2, col: 1 });
      expect(result).toContainEqual({ row: 2, col: 2 });
    });

    it('handles corner positions correctly', () => {
      const result = getAdjacentCells({ row: 0, col: 0 }, 4);
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ row: 0, col: 1 });
      expect(result).toContainEqual({ row: 1, col: 0 });
      expect(result).toContainEqual({ row: 1, col: 1 });
    });

    it('handles edge positions correctly', () => {
      const result = getAdjacentCells({ row: 0, col: 1 }, 4);
      expect(result).toHaveLength(5);
    });
  });

  describe('areCellsAdjacent', () => {
    it('returns true for horizontally adjacent cells', () => {
      expect(areCellsAdjacent({ row: 1, col: 1 }, { row: 1, col: 2 })).toBe(true);
    });

    it('returns true for vertically adjacent cells', () => {
      expect(areCellsAdjacent({ row: 1, col: 1 }, { row: 2, col: 1 })).toBe(true);
    });

    it('returns true for diagonally adjacent cells', () => {
      expect(areCellsAdjacent({ row: 1, col: 1 }, { row: 2, col: 2 })).toBe(true);
    });

    it('returns false for non-adjacent cells', () => {
      expect(areCellsAdjacent({ row: 0, col: 0 }, { row: 2, col: 2 })).toBe(false);
    });

    it('returns false for same cell', () => {
      expect(areCellsAdjacent({ row: 1, col: 1 }, { row: 1, col: 1 })).toBe(false);
    });
  });

  describe('calculateCellPosition', () => {
    it('calculates center position for cell', () => {
      const result = calculateCellPosition(1, 1, 80, 10);
      expect(result.x).toBeCloseTo(130);  // col * (size + gap) + size / 2 = 1 * 90 + 40
      expect(result.y).toBeCloseTo(130);
    });

    it('handles different cell sizes', () => {
      const result = calculateCellPosition(0, 0, 60, 8);
      expect(result.x).toBeCloseTo(30);
      expect(result.y).toBeCloseTo(30);
    });
  });

  describe('getCellFromCoordinates', () => {
    it('returns cell for valid coordinates within cell area', () => {
      // CELL_SIZE=70, GAP=8, totalSize=78
      const result = getCellFromCoordinates(35, 35, 70, 8, 4);
      expect(result).toEqual({ row: 0, col: 0 });
    });

    it('returns cell for coordinates near gap using generous hit radius', () => {
      // CELL_SIZE=70, GAP=8, totalSize=78
      // Position 75 is in the gap but hit radius (49) reaches cell (0,1) center at 113
      const result = getCellFromCoordinates(75, 35, 70, 8, 4);
      // Should return (0,1) as it's the closest cell within hit radius
      expect(result).toEqual({ row: 0, col: 1 });
    });

    it('returns null for coordinates outside grid', () => {
      const result = getCellFromCoordinates(500, 500, 70, 8, 4);
      expect(result).toBeNull();
    });
  });
});
