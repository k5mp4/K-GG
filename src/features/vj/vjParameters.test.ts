import { describe, expect, it } from 'vitest';
import { useGradientStore } from '../../store/gradientStore';
import { PARAMETER_LIMITS } from '../../lib/parameterLimits';
import {
  createVjRandomValues, getVjParameters, makeVjCenteredRules,
} from './vjParameters';

describe('VJ parameter randomization', () => {
  it('uses valid numeric steps and preserves locks in either mode', () => {
    const state = useGradientStore.getState();
    const params = getVjParameters('stretch', state);
    for (const mode of ['full', 'bounded'] as const) {
      const values = createVjRandomValues(params, state, { 'stretch.seed': { locked: true } }, mode, () => 0.456);
      expect(values).not.toHaveProperty('stretch.seed');
      expect(Number.isInteger(values['stretch.bandHeight'])).toBe(true);
      expect(values['stretch.bandHeight']).toBeGreaterThanOrEqual(PARAMETER_LIMITS['stretch.bandHeight'].min);
      expect(values['stretch.bandHeight']).toBeLessThanOrEqual(PARAMETER_LIMITS['stretch.bandHeight'].max);
      expect(values).not.toHaveProperty('stretch.enabled');
    }
  });

  it('intersects bounds, rejects empty and nonfinite ranges, and never escapes a narrow range', () => {
    const state = useGradientStore.getState();
    const params = getVjParameters('stretch', state);
    const values = createVjRandomValues(params, state, {
      'stretch.variation': { min: 0.153, max: 0.171 },
      'stretch.seed': { min: 200, max: 300 },
      'stretch.bandHeight': { min: Number.NaN, max: 10 },
    }, 'bounded', () => 1);
    expect(values['stretch.variation']).toBe(0.17);
    expect(values).not.toHaveProperty('stretch.seed');
    expect(values).not.toHaveProperty('stretch.bandHeight');
  });

  it('resolves new mode parameters after randomizing the effect type', () => {
    const state = useGradientStore.getState();
    const params = getVjParameters('noise', state);
    const values = createVjRandomValues(params, state, {
      'noiseDistortion.type': { values: ['caustics'] },
      'noiseDistortion.scale': { min: 99, max: 100 },
    }, 'bounded', () => 0.5);
    expect(values['noiseDistortion.type']).toBe('caustics');
    expect(values).toHaveProperty('noiseDistortion.causticsDepth');
    expect(values).not.toHaveProperty('noiseDistortion.perlinRoughness');
    expect(values).not.toHaveProperty('noiseDistortion.scale');
    expect(getVjParameters('noise', { ...state, noiseDistortion: { ...state.noiseDistortion, type: 'caustics' } })
      .find(param => param.field === 'scale')?.max).toBe(3);
  });

  it('limits enums and colors to allowed values and keeps external sources out of random selection', () => {
    const state = useGradientStore.getState();
    const values = createVjRandomValues(getVjParameters('distortChroma', state), state, {
      'distortChroma.wrap': { values: ['mirror', 'invalid'] },
      'distortChroma.color1': { colors: ['#123456', 'bad'] },
      'distortChroma.lensSource': { values: ['image'] },
    }, 'bounded', () => 0.99);
    expect(values['distortChroma.wrap']).toBe('mirror');
    expect(values['distortChroma.color1']).toBe('#123456');
    expect(values).not.toHaveProperty('distortChroma.lensSource');
  });

  it('exposes only active mode fields and freezes centered rules at creation', () => {
    const state = useGradientStore.getState();
    const params = getVjParameters('slit', { ...state, slitScan: { ...state.slitScan, mode: 'wave' } });
    expect(params.some(param => param.field === 'waveHeight')).toBe(true);
    expect(params.some(param => param.field === 'polygonSides')).toBe(false);
    expect(params.some(param => param.field === 'edgeSize')).toBe(false);
    const stretchParams = getVjParameters('stretch', state);
    const rules = makeVjCenteredRules(stretchParams, state);
    const previous = { ...rules['stretch.variation'] };
    createVjRandomValues(stretchParams, state, rules, 'bounded', () => 0.9);
    expect(rules['stretch.variation']).toEqual(previous);
    expect(previous.min).toBeGreaterThanOrEqual(0);
    expect(previous.max).toBeLessThanOrEqual(1);
  });

  it('skips modes whose limits would force a locked or skipped value to change', () => {
    const initial = useGradientStore.getState();
    const state = { ...initial, noiseDistortion: { ...initial.noiseDistortion, type: 'simplex' as const, scale: 4.5 } };
    for (const rule of [{ locked: true }, { min: 999, max: 1000 }]) {
      const values = createVjRandomValues(getVjParameters('noise', state), state, {
        'noiseDistortion.type': { values: ['caustics'] }, 'noiseDistortion.scale': rule,
      }, 'bounded', () => 0.5);
      expect(values).not.toHaveProperty('noiseDistortion.type');
      expect(values).not.toHaveProperty('noiseDistortion.scale');
    }
  });

  it('uses centered bounds and the current color for controls activated inside bounded randomization', () => {
    const initial = useGradientStore.getState();
    const state = { ...initial, stretch: { ...initial.stretch, glowEnabled: false } };
    const parameters = getVjParameters('stretch', state);
    const rules = makeVjCenteredRules(parameters, state);
    rules['stretch.glowEnabled'] = { values: [true] };
    const originalRules = structuredClone(rules);
    const values = createVjRandomValues(parameters, state, rules, 'bounded', () => 0.99);
    const activated = { ...state, stretch: { ...state.stretch, glowEnabled: true } };
    const centered = makeVjCenteredRules(getVjParameters('stretch', activated), activated);
    expect(values['stretch.glowEnabled']).toBe(true);
    expect(values['stretch.glowIntensity']).toBeGreaterThanOrEqual(centered['stretch.glowIntensity'].min!);
    expect(values['stretch.glowIntensity']).toBeLessThanOrEqual(centered['stretch.glowIntensity'].max!);
    expect(values['stretch.glowTint']).toBe(state.stretch.glowTint);
    expect(rules).toEqual(originalRules);
  });
});
