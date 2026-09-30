import { describe, expect, it } from 'vitest';
import {
  getBuiltinShape,
  getShapesMaskLayout,
  parseSvgViewBox,
  resolveShapesMask,
  SHAPES_MASK_MAX_DIMENSION,
  SHAPES_MASK_PADDING,
  type ShapesMask,
} from './shapesLibrary';

function svgElement(attributes: Record<string, string>): Element {
  return { getAttribute: (name: string) => attributes[name] ?? null } as unknown as Element;
}

describe('getShapesMaskLayout', () => {
  it('pads every edge by 30% of the longer content side and fits the longest side', () => {
    const layout = getShapesMaskLayout({ width: 300, height: 100 });
    expect(layout.padding).toBe(300 * SHAPES_MASK_PADDING);
    expect(Math.max(layout.canvasWidth, layout.canvasHeight)).toBe(SHAPES_MASK_MAX_DIMENSION);
    expect(layout.contentScale[0]).toBeCloseTo(300 / 480, 10);
    expect(layout.contentScale[1]).toBeCloseTo(100 / 280, 10);
    expect(layout.aspect).toBe(3);
  });

  it('depends only on the content box, not its units', () => {
    const small = getShapesMaskLayout({ width: 24, height: 24 });
    const large = getShapesMaskLayout({ width: 2400, height: 2400 });
    expect(small.contentScale).toEqual(large.contentScale);
    expect([small.canvasWidth, small.canvasHeight]).toEqual([large.canvasWidth, large.canvasHeight]);
  });
});

describe('parseSvgViewBox', () => {
  it('prefers the viewBox and falls back to width and height', () => {
    expect(parseSvgViewBox(svgElement({ viewBox: '-2 4 24,12', width: '10' }))).toEqual({ x: -2, y: 4, width: 24, height: 12 });
    expect(parseSvgViewBox(svgElement({ width: '64px', height: '32' }))).toEqual({ x: 0, y: 0, width: 64, height: 32 });
  });

  it('rejects sizes it cannot measure', () => {
    expect(parseSvgViewBox(svgElement({ viewBox: '0 0 0 10' }))).toBeNull();
    expect(parseSvgViewBox(svgElement({ width: '50%', height: '10em' }))).toBeNull();
    expect(parseSvgViewBox(svgElement({}))).toBeNull();
  });
});

describe('built-in shapes', () => {
  it('defines Circle, Star and Text Outline as path data', () => {
    for (const source of ['circle', 'star', 'text'] as const) {
      const shape = getBuiltinShape(source);
      expect(shape.viewBox.width).toBeGreaterThan(0);
      expect(shape.paths.length).toBeGreaterThan(0);
      for (const path of shape.paths) expect(path).toMatch(/^M[-\d.]/);
    }
    // "KGG": the K is three pieces and each G three more.
    expect(getBuiltinShape('text').paths).toHaveLength(9);
  });

  it('uses a loaded custom mask and otherwise resolves without a DOM', () => {
    const custom = { key: 'custom:1' } as ShapesMask;
    expect(resolveShapesMask('custom', custom)).toBe(custom);
    // Rasterizing needs a document; tests run without one.
    expect(resolveShapesMask('circle', null)).toBeNull();
    expect(resolveShapesMask('custom', null)).toBeNull();
  });
});
