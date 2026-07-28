import { describe, expect, it } from 'vitest';
import { generateHarmonyPalette } from './colorHarmony';

describe('generateHarmonyPalette', () => {
  it('keeps the base color and generates one complementary color', () => {
    expect(generateHarmonyPalette('#ff0000', 'complementary')).toEqual(['#FF0000', '#00FFFF']);
  });

  it('generates two additional colors for a triad', () => {
    const palette = generateHarmonyPalette('#ff0000', 'triad');
    expect(palette).toHaveLength(3);
    expect(palette[0]).toBe('#FF0000');
    expect(new Set(palette).size).toBe(3);
  });

  it('supports shorthand input and all requested harmony families', () => {
    const types = ['analogous', 'complementary', 'split-complementary', 'triad', 'square', 'compound', 'shades', 'monochromatic'] as const;
    for (const type of types) {
      const palette = generateHarmonyPalette('#0af', type);
      expect(palette.length).toBeGreaterThanOrEqual(2);
      expect(palette.every((color) => /^#[0-9A-F]{6}$/.test(color))).toBe(true);
    }
  });

  it('falls back safely for invalid colors', () => {
    expect(generateHarmonyPalette('not-a-color', 'complementary')[0]).toBe('#808080');
  });
});
