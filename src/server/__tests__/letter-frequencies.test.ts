import { describe, it, expect } from 'vitest';
import { getRandomLetter, getLetterDistributionStats } from '../letter-frequencies';

describe('Letter Frequencies', () => {
  it('should have Spanish alphabet letters', () => {
    const stats = getLetterDistributionStats();
    expect(stats.uniqueLetters).toBe(27);
    expect(stats.mostFrequent).toBe('E');
  });

  it('should generate valid letters', () => {
    const letter = getRandomLetter();
    expect(letter).toMatch(/^[A-ZÑ]$/);
    expect(letter.length).toBe(1);
  });

  it('should favor frequent letters over many selections', () => {
    const samples = 10000;
    const letterCounts: Record<string, number> = {};

    for (let i = 0; i < samples; i++) {
      const letter = getRandomLetter();
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }

    // E should be one of the most common letters
    const eCount = letterCounts['E'] || 0;
    const wCount = letterCounts['W'] || 0;

    expect(eCount).toBeGreaterThan(wCount * 5);
  });
});
