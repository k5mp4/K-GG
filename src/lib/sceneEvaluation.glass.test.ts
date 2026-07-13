import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { LatestState } from '../types/latestState';
import { createAnimationTrack } from './animationRegistry';
import { evaluateSceneAtTime, hasActiveAnimation } from './sceneEvaluation';
import { createDefaultPostprocessStack } from './postprocessStack';

function createGlassState(glassMotion: number): LatestState {
  return {
    gradient: { ...STORE_DEFAULTS.gradient },
    noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
    diffuse: { ...STORE_DEFAULTS.diffuse, enabled: false },
    imageGradient: { ...STORE_DEFAULTS.imageGradient },
    slitScan: { ...STORE_DEFAULTS.slitScan },
    stretch: { ...STORE_DEFAULTS.stretch },
    normalMap: { ...STORE_DEFAULTS.normalMap },
    radon: { ...STORE_DEFAULTS.radon },
    iridescence: { ...STORE_DEFAULTS.iridescence },
    manualDistort: { ...STORE_DEFAULTS.manualDistort },
    postprocess: {
      ...STORE_DEFAULTS.postprocess,
      enabled: true,
      effectMode: 'glass',
      effectStack: createDefaultPostprocessStack('glass'),
      glassMotion,
    },
    effectPipeline: {
      ...STORE_DEFAULTS.effectPipeline,
      effectStack: STORE_DEFAULTS.effectPipeline.effectStack.map(layer => ({ ...layer })),
    },
    matcap: { ...STORE_DEFAULTS.matcap },
    animation: { ...STORE_DEFAULTS.animation, enabled: true },
    keyframeTracks: {},
    width: 1920,
    height: 1080,
    animDirection: 0,
  };
}

describe('Glass scene animation', () => {
  it('animates only when the Glass motion amount is non-zero', () => {
    expect(hasActiveAnimation(createGlassState(0.35))).toBe(true);
    expect(hasActiveAnimation(createGlassState(0))).toBe(false);

    const stateWithRetainedAutoTrack = createGlassState(0);
    stateWithRetainedAutoTrack.keyframeTracks['postprocess.__time'] = createAnimationTrack(
      'postprocess.__time',
      'Effect Motion',
      'auto',
    );
    expect(hasActiveAnimation(stateWithRetainedAutoTrack)).toBe(false);
  });

  it('maps the loop endpoints to the same shader phase', () => {
    const state = createGlassState(0.35);
    const start = evaluateSceneAtTime(state, 0);
    const end = evaluateSceneAtTime(state, 1);
    const startPhase = start.renderTime / start.noiseLoopPeriod;
    const endPhase = end.renderTime / end.noiseLoopPeriod;

    expect(startPhase).toBeCloseTo(0);
    expect(endPhase % 1).toBeCloseTo(0);
  });
});
