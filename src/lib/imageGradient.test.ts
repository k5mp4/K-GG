import { describe, expect, it } from 'vitest';
import { coverImageUv, imageGradientChannelValue } from './imageGradient';

describe('imageGradientChannelValue', () => {
  it('maps luminance and individual RGB channels deterministically', () => {
    expect(imageGradientChannelValue([0.2, 0.5, 0.8], 'luminance')).toBeCloseTo(0.4451);
    expect(imageGradientChannelValue([0.2, 0.5, 0.8], 'red')).toBe(0.2);
    expect(imageGradientChannelValue([0.2, 0.5, 0.8], 'green')).toBe(0.5);
    expect(imageGradientChannelValue([0.2, 0.5, 0.8], 'blue')).toBe(0.8);
  });
});

describe('coverImageUv', () => {
  it('center-crops a wide image for a square output', () => {
    expect(coverImageUv([0, 0.5], 2000, 1000, 1000, 1000)).toEqual([0.25, 0.5]);
    expect(coverImageUv([1, 0.5], 2000, 1000, 1000, 1000)).toEqual([0.75, 0.5]);
  });

  it('center-crops a tall image for a wide output', () => {
    expect(coverImageUv([0.5, 0], 1000, 2000, 1000, 1000)).toEqual([0.5, 0.25]);
  });
});
