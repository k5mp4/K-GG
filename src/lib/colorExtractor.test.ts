import { describe, it, expect } from 'vitest';
import {
  ColorBox,
  splitBox,
  getLuminance,
  getHue,
  rgbToHex,
  extractColorsFromPixels,
  sortPalette,
  type RGB
} from './colorExtractor';

describe('colorExtractor utility functions', () => {
  it('rgbToHex conversion', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF');
    expect(rgbToHex({ r: 255, g: 0, b: 128 })).toBe('#FF0080');
  });

  it('getLuminance calculation', () => {
    const black = { r: 0, g: 0, b: 0 };
    const white = { r: 255, g: 255, b: 255 };
    expect(getLuminance(black)).toBe(0);
    expect(getLuminance(white)).toBeCloseTo(255);
  });

  it('getHue calculation', () => {
    const red = { r: 255, g: 0, b: 0 };
    const green = { r: 0, g: 255, b: 0 };
    const blue = { r: 0, g: 0, b: 255 };
    const gray = { r: 128, g: 128, b: 128 };

    expect(getHue(red)).toBe(0);
    expect(getHue(green)).toBe(120);
    expect(getHue(blue)).toBe(240);
    expect(getHue(gray)).toBe(0); // 無彩色は0
  });
});

describe('ColorBox class and splitBox', () => {
  it('should find bounds and longest axis correctly', () => {
    const pixels: RGB[] = [
      { r: 10, g: 20, b: 30 },
      { r: 100, g: 50, b: 40 },
    ];
    const box = new ColorBox(pixels);

    expect(box.rMin).toBe(10);
    expect(box.rMax).toBe(100); // Rの範囲は 90
    expect(box.gMin).toBe(20);
    expect(box.gMax).toBe(50);  // Gの範囲は 30
    expect(box.bMin).toBe(30);
    expect(box.bMax).toBe(40);  // Bの範囲は 10

    expect(box.getLongestAxis()).toBe('r');
    expect(box.getVolume()).toBe((100 - 10 + 1) * (50 - 20 + 1) * (40 - 30 + 1));
  });

  it('should split ColorBox by median along longest axis', () => {
    const pixels: RGB[] = [
      { r: 10, g: 0, b: 0 },
      { r: 90, g: 0, b: 0 },
      { r: 50, g: 0, b: 0 },
      { r: 20, g: 0, b: 0 },
    ];
    const box = new ColorBox(pixels);
    const [box1, box2] = splitBox(box);

    // ソートされると [10, 20, 50, 90] となり、中央値で分割される
    expect(box1.pixels.length).toBe(2);
    expect(box2.pixels.length).toBe(2);
    
    expect(box1.pixels.map(p => p.r)).toEqual([10, 20]);
    expect(box2.pixels.map(p => p.r)).toEqual([50, 90]);
  });
});

describe('extractColorsFromPixels', () => {
  it('should extract target number of colors using Median Cut', () => {
    // 赤いピクセル10個、緑のピクセル10個、青いピクセル10個を混在させる
    const red = { r: 255, g: 0, b: 0 };
    const green = { r: 0, g: 255, b: 0 };
    const blue = { r: 0, g: 0, b: 255 };

    const pixels: RGB[] = [
      ...Array(10).fill(null).map(() => ({ ...red })),
      ...Array(10).fill(null).map(() => ({ ...green })),
      ...Array(10).fill(null).map(() => ({ ...blue })),
    ];

    const result = extractColorsFromPixels(pixels, 3);
    expect(result.length).toBe(3);

    // 抽出された色がそれぞれ赤、緑、青に近いことを確認
    const getDistance = (c1: RGB, c2: RGB) => {
      return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
      );
    };

    const targetColors = [red, green, blue];
    for (const target of targetColors) {
      // 抽出色の中に target との距離が 130 以下のものが存在することを確認
      const hasCloseColor = result.some(item => getDistance(item.color, target) < 130);
      expect(hasCloseColor).toBe(true);
    }
    
    // 全ピクセル数の合計が30であることを確認
    const totalCount = result.reduce((sum, item) => sum + item.count, 0);
    expect(totalCount).toBe(30);

    // すべての代表色に1つ以上のピクセルが属していることを確認
    result.forEach(item => {
      expect(item.count).toBeGreaterThan(0);
    });
  });
});

describe('sortPalette', () => {
  const red = { r: 255, g: 0, b: 0 };     // Hue: 0, Luminance: 76.245
  const green = { r: 0, g: 255, b: 0 };   // Hue: 120, Luminance: 149.685
  const blue = { r: 0, g: 0, b: 255 };    // Hue: 240, Luminance: 29.07
  const darkRed = { r: 50, g: 0, b: 0 };  // Hue: 0, Luminance: 14.95

  const palette = [
    { color: green, count: 5 },
    { color: blue, count: 12 },
    { color: red, count: 8 },
    { color: darkRed, count: 3 }
  ];

  it('sorts by dominance', () => {
    const sorted = sortPalette(palette, 'dominance');
    expect(sorted.map(item => item.count)).toEqual([12, 8, 5, 3]);
    expect(rgbToHex(sorted[0].color)).toBe('#0000FF'); // blue
  });

  it('sorts by luminance', () => {
    const sorted = sortPalette(palette, 'luminance');
    // 暗い順: darkRed -> blue -> red -> green
    expect(sorted.map(item => rgbToHex(item.color))).toEqual([
      '#320000', // darkRed
      '#0000FF', // blue
      '#FF0000', // red
      '#00FF00'  // green
    ]);
  });

  it('sorts by hue', () => {
    const sorted = sortPalette(palette, 'hue');
    // 色相順: red/darkRed (0) -> green (120) -> blue (240)
    expect(getHue(sorted[0].color)).toBe(0);
    expect(getHue(sorted[1].color)).toBe(0);
    expect(getHue(sorted[2].color)).toBe(120);
    expect(getHue(sorted[3].color)).toBe(240);
  });
});
