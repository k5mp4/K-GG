import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { LatestState } from '../types/latestState';
import type { WebGLContext } from './webgl';
import { renderFrame } from './renderFrame';
import { renderSceneAtTime } from './renderSceneAtTime';
import { applyTimeRemap } from './timeRemap';

vi.mock('./renderFrame', () => ({ renderFrame: vi.fn() }));
vi.mock('./effectStackTransition', () => ({
  getEffectStackTransition: () => null,
  finishEffectStackTransition: vi.fn(),
}));
vi.mock('./webgl', () => ({
  blendEffectStackTransitionFrames: vi.fn(),
  captureEffectStackTransitionFrame: vi.fn(),
}));

const ctx = { disposed: false, gl: { isContextLost: () => false } } as unknown as WebGLContext;

function createState(easingEnabled: boolean): LatestState {
  return {
    gradient: { ...STORE_DEFAULTS.gradient },
    noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
    diffuse: { ...STORE_DEFAULTS.diffuse },
    imageGradient: { ...STORE_DEFAULTS.imageGradient },
    slitScan: { ...STORE_DEFAULTS.slitScan },
    stretch: { ...STORE_DEFAULTS.stretch },
    normalMap: { ...STORE_DEFAULTS.normalMap },
    coneView: { ...STORE_DEFAULTS.coneView },
    manualDistort: { ...STORE_DEFAULTS.manualDistort },
    postprocess: { ...STORE_DEFAULTS.postprocess },
    effectPipeline: STORE_DEFAULTS.effectPipeline,
    animation: {
      ...STORE_DEFAULTS.animation,
      enabled: true,
      easing: { ...STORE_DEFAULTS.animation.easing, enabled: easingEnabled, p1: [0.9, 0], p2: [1, 0.1] },
    },
    keyframeTracks: {},
    width: 320,
    height: 180,
    animDirection: 0,
  };
}

describe('renderSceneAtTime loop timing', () => {
  beforeEach(() => vi.mocked(renderFrame).mockClear());

  it('drives 3D, Flow, Datamosh, and Texture with the remapped phase', () => {
    const state = createState(true);
    const remapped = applyTimeRemap(0.5, state.animation.duration, state.animation.easing);
    expect(remapped).not.toBeCloseTo(0.5, 2);

    renderSceneAtTime(ctx, state, 0.5, {});

    const request = vi.mocked(renderFrame).mock.calls[0][1];
    expect(request.flowNormalizedTime).toBeCloseTo(remapped, 10);
    expect(request.textureNormalizedTime).toBeCloseTo(remapped, 10);
  });

  it('keeps the raw phase when Loop Timing is off', () => {
    renderSceneAtTime(ctx, createState(false), 0.5, {});

    const request = vi.mocked(renderFrame).mock.calls[0][1];
    expect(request.flowNormalizedTime).toBe(0.5);
    expect(request.textureNormalizedTime).toBe(0.5);
  });
});
