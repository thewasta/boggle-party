import { describe, it, expect } from 'vitest';
import { calculateUniqueWords, prepareRevealSequence } from '../word-unique-calculator';

describe('calculateUniqueWords', () => {
  it('marks words found by only one player as unique', () => {
    const foundWords = [
      { playerId: 'p1', playerName: 'Alice', word: 'HOLA', score: 4 },
      { playerId: 'p1', playerName: 'Alice', word: 'CASA', score: 4 },
      { playerId: 'p2', playerName: 'Bob', word: 'HOLA', score: 4 },
      { playerId: 'p2', playerName: 'Bob', word: 'PERRO', score: 5 },
    ];

    const result = calculateUniqueWords(foundWords);

    expect(result).toEqual([
      { playerId: 'p1', playerName: 'Alice', word: 'HOLA', score: 4, isUnique: false },
      { playerId: 'p1', playerName: 'Alice', word: 'CASA', score: 4, isUnique: true },
      { playerId: 'p2', playerName: 'Bob', word: 'HOLA', score: 4, isUnique: false },
      { playerId: 'p2', playerName: 'Bob', word: 'PERRO', score: 5, isUnique: true },
    ]);
  });

  it('handles empty input', () => {
    expect(calculateUniqueWords([])).toEqual([]);
  });

  it('handles single player', () => {
    const foundWords = [
      { playerId: 'p1', playerName: 'Alice', word: 'HOLA', score: 4 },
      { playerId: 'p1', playerName: 'Alice', word: 'CASA', score: 4 },
    ];

    const result = calculateUniqueWords(foundWords);

    expect(result.every(w => w.isUnique)).toBe(true);
  });
});

describe('prepareRevealSequence', () => {
  it('sorts words by score (high to low) for dramatic reveal', () => {
    const words = [
      { playerId: 'p1', playerName: 'Alice', word: 'A', score: 1, isUnique: true },
      { playerId: 'p2', playerName: 'Bob', word: 'BBBBB', score: 5, isUnique: false },
      { playerId: 'p1', playerName: 'Alice', word: 'CCC', score: 3, isUnique: false },
    ];

    const sequence = prepareRevealSequence(words);

    expect(sequence[0].word).toBe('BBBBB'); // Highest score first
    expect(sequence[1].word).toBe('CCC');
    expect(sequence[2].word).toBe('A');
  });
});
