import { describe, expect, it } from 'vitest';
import {
  getEffectStackSettlingOffset,
  getEffectStackTargetIndex,
} from './effectStackDrag';

describe('effectStackDrag', () => {
  it('clamps the pointer target to the visible stack', () => {
    expect(getEffectStackTargetIndex(2, -1000, 38, 9)).toBe(0);
    expect(getEffectStackTargetIndex(2, 1000, 38, 9)).toBe(8);
  });

  it('uses row centers to keep a row in its current slot until halfway', () => {
    expect(getEffectStackTargetIndex(3, 18, 38, 9)).toBe(3);
    expect(getEffectStackTargetIndex(3, 20, 38, 9)).toBe(4);
    expect(getEffectStackTargetIndex(3, -20, 38, 9)).toBe(2);
  });

  it('settles at the exact visual offset before committing the new order', () => {
    expect(getEffectStackSettlingOffset(1, 4, 38)).toBe(114);
    expect(getEffectStackSettlingOffset(5, 2, 38)).toBe(-114);
  });
});
