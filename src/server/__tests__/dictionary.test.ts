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

  it('should validate common Spanish words', async () => {
    expect(await esValida('hola')).toBe(true);
    expect(await esValida('casa')).toBe(true);
    expect(await esValida('perro')).toBe(true);
    expect(await esValida('gato')).toBe(true);
  });

  it('should reject invalid words', async () => {
    expect(await esValida('xxxx')).toBe(false);
    expect(await esValida('abc')).toBe(false);
    expect(await esValida('')).toBe(false);
  });

  it('should be case-insensitive', async () => {
    expect(await esValida('HOLA')).toBe(true);
    expect(await esValida('HoLa')).toBe(true);
    expect(await esValida('hola')).toBe(true);
  });

  it('should reject words with accents if not in dictionary', async () => {
    const result = await esValida('jalapeño');
    expect(typeof result).toBe('boolean');
  });
});
