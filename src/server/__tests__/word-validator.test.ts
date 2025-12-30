import { describe, it, expect, beforeAll } from 'vitest';
import { getDictionary } from '../dictionary';
import { calculateScore, areAdjacent, isValidPath } from '../word-validator';

describe('Word Validator - Scoring', () => {
  beforeAll(async () => {
    await getDictionary();
  });

  it('should score 3-letter words as 1 point', () => {
    expect(calculateScore('HOLA')).toBe(1); // 4 letters, but let's test
    expect(calculateScore('SOL')).toBe(1);
    expect(calculateScore('MAR')).toBe(1);
  });

  it('should score 4-letter words as 1 point', () => {
    expect(calculateScore('CASA')).toBe(1);
    expect(calculateScore('GATO')).toBe(1);
  });

  it('should score 5-letter words as 2 points', () => {
    expect(calculateScore('GATO')).toBe(1); // 4 letters
    expect(calculateScore('CINCO')).toBe(2);
    expect(calculateScore('LETRA')).toBe(2);
  });

  it('should score 6-letter words as 3 points', () => {
    expect(calculateScore('SEIS')).toBe(1); // 4 letters
    expect(calculateScore('MESA')).toBe(1); // 4 letters
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
