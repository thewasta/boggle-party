import { describe, it, expect, beforeAll } from 'vitest';
import { getDictionary } from '../dictionary';
import { calculateScore, areAdjacent, isValidPath, validateWord } from '../word-validator';

describe('Word Validator - Scoring', () => {
  beforeAll(async () => {
    await getDictionary();
  });

  it('should score 3-letter words as 1 point', () => {
    expect(calculateScore('SOL')).toBe(1);
    expect(calculateScore('MAR')).toBe(1);
  });

  it('should score 4-letter words as 1 point', () => {
    expect(calculateScore('CASA')).toBe(1);
    expect(calculateScore('GATO')).toBe(1);
  });

  it('should score 5-letter words as 2 points', () => {
    expect(calculateScore('CINCO')).toBe(2);
    expect(calculateScore('LETRA')).toBe(2);
  });

  it('should score 6-letter words as 3 points', () => {
    expect(calculateScore('LECHES')).toBe(3);
    expect(calculateScore('PLANTA')).toBe(3);
  });

  it('should score 7+ letter words as 5 points', () => {
    expect(calculateScore('ELEFANTE')).toBe(5);
    expect(calculateScore('HERMOSO')).toBe(5);
    expect(calculateScore('MARAVILLOSO')).toBe(5);
  });

  it('should reject words shorter than 3 letters', () => {
    expect(calculateScore('HO')).toBe(0);
    expect(calculateScore('A')).toBe(0);
  });

  it('should handle empty string', () => {
    expect(calculateScore('')).toBe(0);
  });
});

describe('Word Validator - Adjacency', () => {
  it('should check horizontal adjacency', () => {
    expect(areAdjacent({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(true);
    expect(areAdjacent({ row: 0, col: 1 }, { row: 0, col: 0 })).toBe(true);
    expect(areAdjacent({ row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false);
  });

  it('should check vertical adjacency', () => {
    expect(areAdjacent({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(true);
    expect(areAdjacent({ row: 1, col: 0 }, { row: 0, col: 0 })).toBe(true);
    expect(areAdjacent({ row: 0, col: 0 }, { row: 2, col: 0 })).toBe(false);
  });

  it('should check diagonal adjacency', () => {
    expect(areAdjacent({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(true);
    expect(areAdjacent({ row: 1, col: 1 }, { row: 0, col: 0 })).toBe(true);
    expect(areAdjacent({ row: 0, col: 0 }, { row: 1, col: -1 })).toBe(true);
    expect(areAdjacent({ row: 0, col: 0 }, { row: 2, col: 2 })).toBe(false);
  });

  it('should validate a correct path', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ];
    expect(isValidPath(path, 4)).toBe(true);
  });

  it('should reject path with non-adjacent cells', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 2 }, // Not adjacent!
    ];
    expect(isValidPath(path, 4)).toBe(false);
  });

  it('should reject path with repeated cells', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 0 }, // Repeated!
    ];
    expect(isValidPath(path, 4)).toBe(false);
  });

  it('should reject empty path', () => {
    expect(isValidPath([], 4)).toBe(false);
  });

  it('should reject single-cell path', () => {
    expect(isValidPath([{ row: 0, col: 0 }], 4)).toBe(false);
  });
});

describe('Word Validator - Complete Validation', () => {
  beforeAll(async () => {
    await getDictionary();
  });

  it('should validate a correct word submission', async () => {
    const result = await validateWord({
      word: 'HOLA',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
      ],
      foundWords: [{ word: 'CASA' }],
      gridSize: 4,
    });

    expect(result.valid).toBe(true);
    expect(result.score).toBe(1);
    expect(result.reason).toBe('');
  });

  it('should reject word not in dictionary', async () => {
    const result = await validateWord({
      word: 'XXXX',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ],
      foundWords: [],
      gridSize: 4,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Word not found in dictionary');
  });

  it('should reject duplicate submission', async () => {
    const result = await validateWord({
      word: 'HOLA',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
      ],
      foundWords: [{ word: 'HOLA' }],
      gridSize: 4,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Word already submitted');
  });

  it('should reject invalid path (non-adjacent)', async () => {
    const result = await validateWord({
      word: 'HOLA',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 2 }, // Not adjacent from previous!
      ],
      foundWords: [],
      gridSize: 4,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Invalid path');
  });

  it('should reject path with repeated cells', async () => {
    const result = await validateWord({
      word: 'HOLA',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 0, col: 0 }, // Repeated!
      ],
      foundWords: [],
      gridSize: 4,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Invalid path');
  });

  it('should reject word shorter than 3 letters', async () => {
    const result = await validateWord({
      word: 'HO',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
      foundWords: [],
      gridSize: 4,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Word too short');
  });

  it('should reject path length mismatch', async () => {
    const result = await validateWord({
      word: 'HOLA', // 4 letters
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        // Only 3 cells!
      ],
      foundWords: [],
      gridSize: 4,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Path length does not match word length');
  });

  it('should be case-insensitive', async () => {
    const result1 = await validateWord({
      word: 'HOLA',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ],
      foundWords: [],
      gridSize: 4,
    });

    const result2 = await validateWord({
      word: 'hola',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ],
      foundWords: [],
      gridSize: 4,
    });

    const result3 = await validateWord({
      word: 'HoLa',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ],
      foundWords: [],
      gridSize: 4,
    });

    // All should have same validation result (word not found check aside)
    expect(result1.score).toBe(result2.score);
    expect(result2.score).toBe(result3.score);
  });
});
