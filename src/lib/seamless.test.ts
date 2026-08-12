import { describe, expect, it } from 'vitest';
import { applySeamlessToCanvas, applySeamlessToRgba } from './seamless';
import { DEFAULT_SEAMLESS, normalizeSeamlessConfig } from '../types/seamless';

function fixture(width: number, height: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      data[index] = x * 31 + y * 7;
      data[index + 1] = 220 - x * 19 - y * 5;
      data[index + 2] = (x * 13 + y * 29) % 255;
      data[index + 3] = 255;
    }
  }
  return data;
}

function pixel(data: Uint8ClampedArray, width: number, x: number, y: number): number[] {
  const index = (y * width + x) * 4;
  return [...data.slice(index, index + 4)];
}

describe('seamless image processing', () => {
  it('normalizes missing and out-of-range settings', () => {
    expect(normalizeSeamlessConfig(undefined)).toEqual(DEFAULT_SEAMLESS);
    expect(normalizeSeamlessConfig({ enabled: true, blendWidth: 0.75 })).toEqual({
      enabled: true,
      blendWidth: 0.5,
    });
    expect(normalizeSeamlessConfig({ enabled: 'yes', blendWidth: Number.NaN })).toEqual(DEFAULT_SEAMLESS);
  });

  it('leaves pixels unchanged while disabled', () => {
    const source = fixture(5, 4);
    expect(applySeamlessToRgba(source, 5, 4, DEFAULT_SEAMLESS)).toEqual(source);
  });

  it('makes opposing outermost horizontal and vertical edges match', () => {
    const width = 7;
    const height = 5;
    const result = applySeamlessToRgba(fixture(width, height), width, height, {
      enabled: true,
      blendWidth: 0.25,
    });

    for (let y = 0; y < height; y += 1) {
      expect(pixel(result, width, 0, y)).toEqual(pixel(result, width, width - 1, y));
    }
    for (let x = 0; x < width; x += 1) {
      expect(pixel(result, width, x, 0)).toEqual(pixel(result, width, x, height - 1));
    }
  });

  it('keeps alpha opaque and blends corners after both axes', () => {
    const result = applySeamlessToRgba(fixture(4, 4), 4, 4, {
      enabled: true,
      blendWidth: 0.5,
    });
    expect(pixel(result, 4, 0, 0)).toEqual(pixel(result, 4, 3, 0));
    expect(pixel(result, 4, 0, 0)).toEqual(pixel(result, 4, 0, 3));
    expect(result.filter((_, index) => index % 4 === 3).every(alpha => alpha === 255)).toBe(true);
  });

  it('applies the same edge result through the in-place canvas path', () => {
    const width = 7;
    const height = 5;
    const data = fixture(width, height);
    let writes = 0;
    const canvas = {
      width,
      height,
      getContext: () => ({
        getImageData: () => ({ data }),
        putImageData: () => {
          writes += 1;
        },
      }),
    } as unknown as HTMLCanvasElement;

    applySeamlessToCanvas(canvas, { enabled: true, blendWidth: 0.25 });

    expect(writes).toBe(1);
    for (let y = 0; y < height; y += 1) {
      expect(pixel(data, width, 0, y)).toEqual(pixel(data, width, width - 1, y));
    }
    for (let x = 0; x < width; x += 1) {
      expect(pixel(data, width, x, 0)).toEqual(pixel(data, width, x, height - 1));
    }
  });
});
