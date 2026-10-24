import { describe, expect, it } from 'vitest';
import { getMaterialFieldInputInactiveReason, isMaterialFieldAnimated, isMaterialFieldInputActive, resolveMaterialPhase } from './materialField';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { evaluateSceneAtTime, hasActiveAnimation } from './sceneEvaluation';
import type { LatestState } from '../types/latestState';
import { normalizeMeshGradientConfig } from '../types/gradient';
import { normalizeMaterialFieldConfig } from '../types/materialField';

function sceneState(): LatestState {
  return { ...STORE_DEFAULTS, keyframeTracks: {}, width: 64, height: 64, animDirection: 0 } as LatestState;
}

describe('material field time and demand', () => {
  it('closes integer cycles exactly and does not depend on evaluation order', () => {
    expect(resolveMaterialPhase(0, 3, 0.2)).toBe(resolveMaterialPhase(1, 3, 0.2));
    const times = [0.7, 0.1, 1, 0];
    const phases = times.map(t => resolveMaterialPhase(t, 2, 0));
    expect([...times].reverse().map(t => resolveMaterialPhase(t, 2, 0))).toEqual(phases.reverse());
    expect(resolveMaterialPhase(0.5, 0, 0.25)).toBe(0.25);
  });

  it('keeps the phase finite and wrapped for malformed inputs', () => {
    expect(resolveMaterialPhase(Number.NaN, 2, 0.5)).toBe(0.5);
    expect(resolveMaterialPhase(0.25, Number.POSITIVE_INFINITY, 0)).toBe(0);
    expect(resolveMaterialPhase(0.25, 1, -0.5)).toBeCloseTo(0.75);
    expect(resolveMaterialPhase(0.5, 2.6, 0)).toBeCloseTo(0.5);
  });

  it('keeps source selection but disables protected and direct-color inputs', () => {
    const gradient = { ...STORE_DEFAULTS.gradient, fieldInput: { source: 'thickness' as const, influence: 1 } };
    const mesh = normalizeMeshGradientConfig(undefined);
    expect(isMaterialFieldInputActive(gradient, false)).toBe(true);
    expect(isMaterialFieldInputActive(gradient, true)).toBe(false);
    expect(getMaterialFieldInputInactiveReason(gradient, true)).toBe('image-gradient');
    const direct = { ...gradient, gradientType: 'mesh' as const, mesh: { ...mesh, colorMode: 'direct' as const } };
    expect(isMaterialFieldInputActive(direct, false)).toBe(false);
    expect(getMaterialFieldInputInactiveReason(direct, false)).toBe('mesh-direct');
    expect(isMaterialFieldInputActive({ ...direct, mesh: { ...mesh, colorMode: 'ramp' as const } }, false)).toBe(true);
    expect(isMaterialFieldInputActive({ ...gradient, fieldInput: { source: 'cracks', influence: 0 } }, false)).toBe(false);
  });

  it('evaluates shared parameters and uses the remapped phase only when animation is enabled', () => {
    const state = sceneState();
    state.animation = { ...state.animation, enabled: true, speed: 2.5 };
    const scene = evaluateSceneAtTime(state, 0.3);
    expect(scene.materialTime).toBe(scene.autoTime);
    expect(scene.materialField).toEqual(STORE_DEFAULTS.materialField);
    state.animation.enabled = false;
    expect(evaluateSceneAtTime(state, 0.3).materialTime).toBe(0);
  });

  it('applies continuous keys but never interpolates seed or cycles', () => {
    const state = sceneState();
    state.animation = { ...state.animation, previewLoop: false };
    state.materialField = normalizeMaterialFieldConfig({ seed: 5, cycles: 2, cracks: 0.2 });
    const key = (id: string, time: number, value: number) => ({ id, time, value, interpolation: 'linear' as const });
    state.keyframeTracks = {
      'materialField.cracks': { propertyId: 'materialField.cracks', label: 'Cracks', mode: 'keys', enabled: true, keyframes: [key('a', 0, 0), key('b', 1, 1)] },
      'materialField.seed': { propertyId: 'materialField.seed', label: 'Seed', mode: 'keys', enabled: true, keyframes: [key('c', 0, 0), key('d', 1, 900)] },
    } as LatestState['keyframeTracks'];
    const scene = evaluateSceneAtTime(state, 0.5);
    expect(scene.materialField.cracks).toBeCloseTo(0.5);
    expect(scene.materialField.seed).toBe(5);
    expect(scene.materialField.cycles).toBe(2);
  });

  it('counts periodic morph as animation only while the ramp reads the field', () => {
    const state = sceneState();
    state.animation = { ...state.animation, enabled: true, affectRamp: false, rampOffsetSpeed: 0 };
    state.materialField = normalizeMaterialFieldConfig({ morph: 0.5, cycles: 1 });
    expect(isMaterialFieldAnimated(state.materialField)).toBe(true);
    const before = hasActiveAnimation(state);
    state.gradient = { ...state.gradient, fieldInput: { source: 'cracks', influence: 1 } };
    expect(hasActiveAnimation(state)).toBe(true);
    state.materialField = { ...state.materialField, cycles: 0 };
    expect(hasActiveAnimation(state)).toBe(before);
  });
});
