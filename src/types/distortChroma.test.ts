import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DISTORT_CHROMA,
  getDistortChromaSpectrumWeights,
  normalizeDistortChromaConfig,
  resolveDistortChromaColors,
} from './distortChroma';

describe('Distort Chroma config', () => {
  it('starts disabled with the documented defaults', () => {
    expect(DEFAULT_DISTORT_CHROMA).toMatchObject({
      enabled: false,
      lensSource: 'source',
      wrap: 'clamp',
      color1: '#FF0000',
      color2: '#00FF00',
      color3: '#0000FF',
      whiteBalance: true,
    });
    expect(DEFAULT_DISTORT_CHROMA.steps).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_DISTORT_CHROMA.steps).toBeLessThanOrEqual(32);
  });

  it('falls back to defaults for missing or malformed input', () => {
    expect(normalizeDistortChromaConfig(undefined)).toEqual(DEFAULT_DISTORT_CHROMA);
    expect(normalizeDistortChromaConfig(null)).toEqual(DEFAULT_DISTORT_CHROMA);
    expect(normalizeDistortChromaConfig({ amountX: 'wide', color1: 'red', wrap: 'tile', lensSource: 3 }))
      .toEqual(DEFAULT_DISTORT_CHROMA);
  });

  it('clamps numbers into their limits and rounds Steps', () => {
    const config = normalizeDistortChromaConfig({
      steps: 99, bump: -4, lensBlur: 1000, amountX: -9999, amountY: 9999, warpRed: 10, warpBlue: -10, rotate: 450,
    });
    expect(config.steps).toBe(32);
    expect(config.bump).toBe(0);
    expect(config.lensBlur).toBe(32);
    expect(config.amountX).toBe(-300);
    expect(config.amountY).toBe(300);
    expect(config.warpRed).toBe(3);
    expect(config.warpBlue).toBe(-3);
    expect(config.rotate).toBe(90);
    expect(normalizeDistortChromaConfig({ steps: 2 }).steps).toBe(3);
    expect(normalizeDistortChromaConfig({ steps: 7.6 }).steps).toBe(8);
  });

  it('upper-cases valid colours and accepts the three wrap modes', () => {
    const config = normalizeDistortChromaConfig({ color1: '#ff8800', wrap: 'mirror', whiteBalance: false, enabled: true });
    expect(config).toMatchObject({ color1: '#FF8800', wrap: 'mirror', whiteBalance: false, enabled: true });
    expect(normalizeDistortChromaConfig({ wrap: 'repeat' }).wrap).toBe('repeat');
  });
});

describe('Distort Chroma spectrum', () => {
  it.each([3, 4, 12, 32])('keeps every colour weight summing to 1 with %i steps', (steps) => {
    const totals = [0, 0, 0];
    for (let i = 0; i < steps; i += 1) {
      const weights = getDistortChromaSpectrumWeights(i / (steps - 1), steps);
      weights.forEach((weight, channel) => { totals[channel] += weight; });
    }
    for (const total of totals) expect(total).toBeCloseTo(1, 6);
  });

  it('runs from Color1 at the red end through Color2 to Color3 at the blue end', () => {
    const first = getDistortChromaSpectrumWeights(0, 9);
    const middle = getDistortChromaSpectrumWeights(0.5, 9);
    const last = getDistortChromaSpectrumWeights(1, 9);
    expect(first[1]).toBe(0);
    expect(first[2]).toBe(0);
    expect(middle[0]).toBe(0);
    expect(middle[2]).toBe(0);
    expect(last[0]).toBe(0);
    expect(last[1]).toBe(0);
  });

  it('leaves an undisplaced pixel unchanged for the default red, green and blue', () => {
    const colors = resolveDistortChromaColors(DEFAULT_DISTORT_CHROMA);
    const sum = [0, 1, 2].map(channel => colors[0][channel] + colors[1][channel] + colors[2][channel]);
    expect(sum).toEqual([1, 1, 1]);
  });

  it('normalises custom colours to white with White Balance and leaves them alone without it', () => {
    const custom = { color1: '#FF8000', color2: '#808000', color3: '#0080FF' };
    const balanced = resolveDistortChromaColors({ ...custom, whiteBalance: true });
    for (let channel = 0; channel < 3; channel += 1) {
      expect(balanced[0][channel] + balanced[1][channel] + balanced[2][channel]).toBeCloseTo(1, 6);
    }
    const raw = resolveDistortChromaColors({ ...custom, whiteBalance: false });
    expect(raw[0][0]).toBeCloseTo(1, 6);
    expect(raw[0][1]).toBeCloseTo(128 / 255, 6);
  });

  it('keeps a channel that no colour carries at zero instead of dividing by zero', () => {
    const colors = resolveDistortChromaColors({
      color1: '#FF0000', color2: '#FF0000', color3: '#FF0000', whiteBalance: true,
    });
    expect(colors[0][1]).toBe(0);
    expect(colors[0][0] + colors[1][0] + colors[2][0]).toBeCloseTo(1, 6);
  });
});
