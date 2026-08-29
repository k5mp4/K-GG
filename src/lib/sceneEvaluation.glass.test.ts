import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { LatestState } from '../types/latestState';
import { createAnimationTrack } from './animationRegistry';
import { evaluateSceneAtTime, hasActiveAnimation } from './sceneEvaluation';
import { createDefaultPostprocessStack } from './postprocessStack';
import { updateEffectStackLayer } from './effectPipeline';
import { calcExportRenderTime } from './videoExportFrames';

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
      effectStack: updateEffectStackLayer(
        STORE_DEFAULTS.effectPipeline.effectStack.map(layer => ({ ...layer })),
        'glass',
        { enabled: true },
      ),
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

  it('uses the same speed-adjusted Slit clock for preview and export', () => {
    const state = createGlassState(0);
    state.slitScan = {
      ...STORE_DEFAULTS.slitScan,
      enabled: true,
      animMode: 'pingpong',
      offsetSpeed: 0.5,
    };
    state.animation = {
      ...state.animation,
      duration: 7,
      speed: 2,
      affectSlit: false,
    };

    expect(hasActiveAnimation(state)).toBe(true);
    const start = evaluateSceneAtTime(state, 0);
    const end = evaluateSceneAtTime(state, 1);
    expect(start.slitAnimationTime).toBe(0);
    expect(end.slitAnimationTime).toBe(14);
    const midpoint = evaluateSceneAtTime(state, 0.5);
    expect(midpoint.slitAnimationTime).toBe(7);
    expect(midpoint.slitAnimationTime).toBe(
      calcExportRenderTime(0.5, state.animation.speed, state.animation.duration, state.animation.easing),
    );
    expect(start.slitScan.animEnabled).toBe(true);
    expect(start.slitScan.offsetSpeed).toBe(0.5);
  });

  it('keeps Slit own animation running without a timeline loop switch', () => {
    const state = createGlassState(0);
    state.slitScan = { ...STORE_DEFAULTS.slitScan, enabled: true, offsetSpeed: 0.3 };
    state.animation = { ...state.animation, affectSlit: false };

    expect(hasActiveAnimation(state)).toBe(true);
    expect(evaluateSceneAtTime(state, 0.5).slitAnimationTime).toBeCloseTo(2.5);
    expect(evaluateSceneAtTime(state, 0.5).slitScan.animEnabled).toBe(true);
  });

  it('keeps Slit static when its own animation settings are disabled', () => {
    const state = createGlassState(0);
    state.slitScan = {
      ...STORE_DEFAULTS.slitScan,
      enabled: true,
      animMode: 'off',
      offsetSpeed: 0,
    };
    state.animation = { ...state.animation, affectSlit: false };

    expect(hasActiveAnimation(state)).toBe(false);
    expect(evaluateSceneAtTime(state, 0.5).slitScan.animEnabled).toBe(false);
  });

  it('ignores legacy Slit phase motion tracks while preserving manual phase', () => {
    const state = createGlassState(0);
    state.slitScan = {
      ...STORE_DEFAULTS.slitScan,
      enabled: true,
      offsetSpeed: 0,
      slitPhase: 17,
    };
    state.animation = { ...state.animation, affectSlit: false };
    state.keyframeTracks['slitScan.slitPhase'] = {
      propertyId: 'slitScan.slitPhase',
      label: 'Phase Motion',
      mode: 'keys',
      enabled: true,
      keyframes: [
        { id: 'start', time: 0, value: 17, interpolation: 'linear' },
        { id: 'end', time: 1, value: 99, interpolation: 'linear' },
      ],
    };

    expect(hasActiveAnimation(state)).toBe(false);
    expect(evaluateSceneAtTime(state, 0.5).slitScan.slitPhase).toBe(17);
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

  it('keeps Caustics static at Speed 0 while preserving its manual Evolution phase', () => {
    const state = createGlassState(0);
    state.noiseDistortion = {
      ...STORE_DEFAULTS.noiseDistortion,
      type: 'caustics',
      evolution: 1.75,
      speed: 0,
      enabled: true,
    };
    state.keyframeTracks['noiseDistortion.evolution'] = createAnimationTrack(
      'noiseDistortion.evolution',
      'Noise Evolution',
      'auto',
    );

    const start = evaluateSceneAtTime(state, 0);
    const later = evaluateSceneAtTime(state, 0.5);
    expect(start.noiseDistortion.evolution + start.renderTime).toBeCloseTo(1.75);
    expect(later.noiseDistortion.evolution + later.renderTime).toBeCloseTo(1.75);
  });
});
