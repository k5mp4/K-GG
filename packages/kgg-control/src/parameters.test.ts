import { describe, expect, it } from 'vitest';
import {
  getParameterDefinition,
  listParameterDefinitions,
  validateParameterValue,
} from './parameters.js';

describe('K-GG control parameter registry', () => {
  it('exposes stable paths with metadata', () => {
    const definition = getParameterDefinition('gradient.angle');
    expect(definition).toMatchObject({
      path: 'gradient.angle',
      type: 'number',
      writable: true,
      min: 0,
      max: 360,
      wrapAngle: true,
    });
  });

  it('filters paths by prefix', () => {
    const parameters = listParameterDefinitions('noise');
    expect(parameters.length).toBeGreaterThan(5);
    expect(parameters.every(parameter => parameter.path.startsWith('noise.'))).toBe(true);
  });

  it('normalizes angles but rejects invalid types', () => {
    const definition = getParameterDefinition('gradient.angle');
    expect(definition).not.toBeNull();
    if (!definition) return;
    expect(validateParameterValue(definition, 725)).toEqual({ ok: true, value: 5 });
    expect(validateParameterValue(definition, '725')).toMatchObject({ ok: false });
    const scatter = getParameterDefinition('diffuse.scatter');
    expect(scatter).not.toBeNull();
    if (scatter) expect(validateParameterValue(scatter, 301)).toMatchObject({ ok: false });
  });

  it('exposes Flow compositing controls with shared limits', () => {
    expect(getParameterDefinition('flow.flowOpacity')).toMatchObject({
      path: 'flow.flowOpacity',
      min: 0,
      max: 1,
      step: 0.01,
    });
    expect(getParameterDefinition('flow.particleOpacity')).toMatchObject({
      path: 'flow.particleOpacity',
      min: 0,
      max: 1,
      step: 0.01,
    });
    expect(getParameterDefinition('flow.particleSize')).toMatchObject({
      path: 'flow.particleSize',
      min: 0.25,
      max: 2,
      step: 0.01,
    });
    const particleSize = getParameterDefinition('flow.particleSize');
    expect(particleSize).not.toBeNull();
    if (particleSize) {
      expect(validateParameterValue(particleSize, 3)).toMatchObject({ ok: false });
      expect(validateParameterValue(particleSize, 1.25)).toEqual({ ok: true, value: 1.25 });
    }
  });
});
