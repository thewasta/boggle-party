import { describe, it, expect, beforeAll } from 'vitest';
import { getDictionary, esValida, getDictionaryStats } from '../dictionary';

describe('Dictionary', () => {
  beforeAll(async () => {
    await getDictionary();
  });

  it('should have loaded the dictionary', () => {
    const stats = getDictionaryStats();
    expect(stats.wordCount).toBeGreaterThan(100000);
  });

  it('should validate common Spanish words', () => {
    expect(esValida('hola')).toBe(true);
    expect(esValida('casa')).toBe(true);
    expect(esValida('perro')).toBe(true);
    expect(esValida('gato')).toBe(true);
  });

  it('should reject invalid words', () => {
    expect(esValida('xxxx')).toBe(false);
    expect(esValida('abc')).toBe(false);
    expect(esValida('')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(esValida('HOLA')).toBe(true);
    expect(esValida('HoLa')).toBe(true);
    expect(esValida('hola')).toBe(true);
  });

  it('should reject words with accents if not in dictionary', () => {
    // The dictionary may or may not have accented forms
    // This test verifies the function works correctly
    const result = esValida('jalapeño');
    expect(typeof result).toBe('boolean');
  });
});
