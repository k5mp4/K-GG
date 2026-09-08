import { describe, expect, it } from 'vitest';
import { shouldResetRenderViewReadiness } from './renderView';

describe('render view readiness', () => {
  it('keeps a ready sandbox surface when a preset restores the same mode', () => {
    expect(shouldResetRenderViewReadiness('cone', 'cone')).toBe(false);
    expect(shouldResetRenderViewReadiness('cloth', 'cloth')).toBe(false);
  });

  it('resets readiness when a preset switches preview surfaces', () => {
    expect(shouldResetRenderViewReadiness('canvas', 'cone')).toBe(true);
    expect(shouldResetRenderViewReadiness('cone', 'cloth')).toBe(true);
  });
});
