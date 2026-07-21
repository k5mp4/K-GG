import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { samplePreviewGradientT } from './presetPreview';

describe('presetPreview', () => {
  it('samples the same linear gradient coordinate used by the fallback renderer', () => {
    const gradient = { ...STORE_DEFAULTS.gradient, gradientType: 'linear' as const, anchors: [[0, 0], [1, 0], [0, 0], [0, 0]] as [[number, number], [number, number], [number, number], [number, number]] };

    expect(samplePreviewGradientT(gradient, 0, 0, 100, 100)).toBe(0);
    expect(samplePreviewGradientT(gradient, 0.5, 0, 100, 100)).toBeCloseTo(0.5);
    expect(samplePreviewGradientT(gradient, 1, 0, 100, 100)).toBe(1);
  });

  it('supports radial preview coordinates without touching editor state', () => {
    const gradient = { ...STORE_DEFAULTS.gradient, gradientType: 'radial' as const, anchors: [[0.5, 0.5], [1, 0.5], [0, 0], [0, 0]] as [[number, number], [number, number], [number, number], [number, number]] };

    expect(samplePreviewGradientT(gradient, 0.5, 0.5, 100, 100)).toBe(0);
    expect(samplePreviewGradientT(gradient, 1, 0.5, 100, 100)).toBeCloseTo(1);
  });
});
