import { describe, expect, it } from 'vitest';
import { applyCubicBezierLink } from './linkedCubicBezier';

describe('linked cubic Bezier constraints', () => {
  const previous: [number, number, number, number] = [0.25, 0.3, 0.75, 0.7];

  it('keeps both handles independent in none mode and normalizes the candidate', () => {
    expect(applyCubicBezierLink(previous, [-1, 0.4, 0.8, 2], 'none')).toEqual([0, 0.4, 0.8, 1]);
  });

  it('mirrors the first handle around the center in symmetric mode', () => {
    expect(applyCubicBezierLink(previous, [0.1, 0.6, 0.75, 0.7], 'symmetric')).toEqual([
      0.1, 0.6, 0.9, 0.4,
    ]);
  });

  it('mirrors the second handle around the center in symmetric mode', () => {
    const linked = applyCubicBezierLink(previous, [0.25, 0.3, 0.9, 0.2], 'symmetric');
    [0.1, 0.8, 0.9, 0.2].forEach((value, index) => expect(linked[index]).toBeCloseTo(value, 12));
  });

  it('uses the first handle when both handle deltas are tied', () => {
    expect(applyCubicBezierLink(previous, [0.35, 0.3, 0.85, 0.7], 'symmetric')).toEqual([
      0.35, 0.3, 0.65, 0.7,
    ]);
  });

  it('moves both handles to the changed first handle in coincide mode', () => {
    expect(applyCubicBezierLink(previous, [0.1, 0.55, 0.75, 0.7], 'coincide')).toEqual([
      0.1, 0.55, 0.1, 0.55,
    ]);
  });

  it('moves both handles to the changed second handle in coincide mode', () => {
    expect(applyCubicBezierLink(previous, [0.25, 0.3, 0.95, 0.15], 'coincide')).toEqual([
      0.95, 0.15, 0.95, 0.15,
    ]);
  });
});
