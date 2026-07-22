import { describe, expect, it } from 'vitest';
import { clampSliderValue, isSliderValueOutOfRange } from './sliderValue';

describe('slider value bounds', () => {
  it('clamps values at the adapter boundary', () => {
    expect(clampSliderValue(-1, 0, 10)).toBe(0);
    expect(clampSliderValue(11, 0, 10)).toBe(10);
    expect(clampSliderValue(Number.NaN, 0, 10)).toBe(0);
  });

  it('detects a gesture that temporarily crosses a bound', () => {
    expect(isSliderValueOutOfRange(11, 0, 10)).toBe(true);
    expect(isSliderValueOutOfRange(10, 0, 10)).toBe(false);
  });
});
