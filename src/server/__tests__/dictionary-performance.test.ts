import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { getDictionary, esValida, clearDictionary, getDictionaryStats } from '../dictionary';

describe('Dictionary Performance Tests', () => {
  afterEach(() => {
    clearDictionary();
  });

  it('should load dictionary in reasonable time', async () => {
    const start = performance.now();
    await getDictionary();
    const loadTime = performance.now() - start;

    expect(loadTime).toBeLessThan(2000); // Should load in under 2 seconds

    console.log(`Dictionary loaded in ${loadTime.toFixed(2)}ms`);
  });

  it('should perform fast O(1) lookups', async () => {
    await getDictionary();
    const stats = getDictionaryStats();

    const iterations = 10000;
    const testWords = ['HOLA', 'CASA', 'PERRO', 'GATO', 'MESA'];

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const word = testWords[i % testWords.length];
      esValida(word);
    }

    const elapsed = performance.now() - start;
    const perLookup = elapsed / iterations;

    expect(perLookup).toBeLessThan(0.1); // Should be much faster than 0.1ms per lookup

    console.log(`${iterations} lookups in ${elapsed.toFixed(2)}ms (${perLookup.toFixed(4)}ms per lookup)`);
    console.log(`Dictionary size: ${stats.wordCount} words`);
  });

  it('should handle concurrent access safely', async () => {
    const promises = [];

    for (let i = 0; i < 10; i++) {
      promises.push(getDictionary());
    }

    const start = performance.now();
    await Promise.all(promises);
    const elapsed = performance.now() - start;

    // Concurrent calls should be fast (singleton pattern)
    expect(elapsed).toBeLessThan(2500);

    console.log(`Concurrent loads completed in ${elapsed.toFixed(2)}ms`);
  });
});
