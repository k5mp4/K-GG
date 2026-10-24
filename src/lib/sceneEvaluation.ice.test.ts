import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { LatestState } from '../types/latestState';
import { DEFAULT_ICE } from '../types/ice';
import { createDefaultEffectPipeline, updateEffectStackLayer } from './effectPipeline';
import { evaluateSceneAtTime, hasActiveAnimation } from './sceneEvaluation';
import { getRequiredSceneProgramKeys, getSceneNoiseProgramVariants } from './sceneRenderPlan';
import { GENERATOR_MATERIAL_FIELD_VARIANT } from './webglShaderSources';

function iceState(patch: Partial<LatestState> = {}): LatestState {
  const pipeline = createDefaultEffectPipeline();
  return {
    ...STORE_DEFAULTS,
    keyframeTracks: {},
    width: 320,
    height: 180,
    animDirection: 0,
    ice: { ...DEFAULT_ICE, enabled: true, lightCycles: 2, lightPhase: 0.25 },
    effectPipeline: { ...pipeline, effectStack: updateEffectStackLayer(pipeline.effectStack, 'ice', { enabled: true }) },
    animation: { ...STORE_DEFAULTS.animation, enabled: true, affectRamp: false, rampOffsetSpeed: 0, previewLoop: false },
    ...patch,
  } as LatestState;
}

describe('Ice time evaluation and program demand', () => {
  it('closes the light loop exactly and never interpolates light cycles', () => {
    const state = iceState();
    expect(evaluateSceneAtTime(state, 0).iceLightPhase).toBe(evaluateSceneAtTime(state, 1).iceLightPhase);
    expect(evaluateSceneAtTime(state, 0).iceLightPhase).toBeCloseTo(0.25);
    expect(evaluateSceneAtTime(state, 0.125).iceLightPhase).toBeCloseTo(0.5);
    const key = (id: string, time: number, value: number) => ({ id, time, value, interpolation: 'linear' as const });
    state.keyframeTracks = {
      'ice.lightCycles': { propertyId: 'ice.lightCycles', label: 'Light Cycles', mode: 'keys', enabled: true, keyframes: [key('a', 0, 0), key('b', 1, 8)] },
      'ice.refraction': { propertyId: 'ice.refraction', label: 'Refraction', mode: 'keys', enabled: true, keyframes: [key('c', 0, 0), key('d', 1, 1)] },
    };
    const scene = evaluateSceneAtTime(state, 0.5);
    expect(scene.ice.lightCycles).toBe(2);
    expect(scene.ice.refraction).toBeCloseTo(0.5);
  });

  it('closes the surface-noise loop and keeps its cycles discrete', () => {
    const state = iceState({ ice: { ...DEFAULT_ICE, enabled: true, surfaceCycles: 3 } });
    expect(evaluateSceneAtTime(state, 0).iceSurfacePhase).toBe(evaluateSceneAtTime(state, 1).iceSurfacePhase);
    expect(evaluateSceneAtTime(state, 0.25).iceSurfacePhase).toBeCloseTo(0.75);
    const key = (id: string, time: number, value: number) => ({ id, time, value, interpolation: 'linear' as const });
    state.keyframeTracks = {
      'ice.surfaceCycles': { propertyId: 'ice.surfaceCycles', label: 'Surface Cycles', mode: 'keys', enabled: true, keyframes: [key('a', 0, 0), key('b', 1, 8)] },
      'ice.evolution': { propertyId: 'ice.evolution', label: 'Evolution', mode: 'keys', enabled: true, keyframes: [key('c', 0, 0), key('d', 1, 1)] },
    };
    const scene = evaluateSceneAtTime(state, 0.5);
    expect(scene.ice.surfaceCycles).toBe(3);
    expect(scene.ice.evolution).toBeCloseTo(0.5);
  });

  it('holds the light still while animation is off', () => {
    const state = iceState({ animation: { ...STORE_DEFAULTS.animation, enabled: false } });
    expect(evaluateSceneAtTime(state, 0.6).iceLightPhase).toBeCloseTo(0.25);
  });

  it('animates only while the Ice layer actually draws', () => {
    expect(hasActiveAnimation(iceState())).toBe(true);
    const still = { ...DEFAULT_ICE, enabled: true, lightCycles: 0, evolution: 0, flow: 0, growth: 0 };
    expect(hasActiveAnimation(iceState({ ice: still }))).toBe(false);
    // The default surface noise evolves even with the light held still.
    expect(hasActiveAnimation(iceState({ ice: { ...DEFAULT_ICE, enabled: true } }))).toBe(true);
    expect(hasActiveAnimation(iceState({ ice: { ...still, growth: 0.5, surfaceCycles: 0 } }))).toBe(false);
    expect(hasActiveAnimation(iceState({ ice: { ...still, flow: 0.5 } }))).toBe(true);
    expect(hasActiveAnimation(iceState({ ice: { ...DEFAULT_ICE, enabled: true, mix: 0 } }))).toBe(false);
    const morphing = iceState({ ice: still });
    morphing.materialField = { ...STORE_DEFAULTS.materialField, morph: 0.5, cycles: 1 };
    expect(hasActiveAnimation(morphing)).toBe(true);
  });

  it('requires the Ice program unless the pass is an identity or protected', () => {
    expect(getRequiredSceneProgramKeys(iceState())).toContain('ice');
    expect(getRequiredSceneProgramKeys(iceState({ ice: { ...DEFAULT_ICE, enabled: true, mix: 0 } }))).not.toContain('ice');
    expect(getRequiredSceneProgramKeys(iceState({
      imageGradient: { ...STORE_DEFAULTS.imageGradient, enabled: true },
      imageGradientSource: {} as HTMLCanvasElement,
    }))).not.toContain('ice');
    // The Ice pass evaluates the field itself; it does not need the field Generator variant.
    expect(getSceneNoiseProgramVariants(iceState()).generator).not.toBe(GENERATOR_MATERIAL_FIELD_VARIANT);
  });
});
