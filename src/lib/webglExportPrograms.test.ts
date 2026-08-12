import { describe, expect, it } from 'vitest';
import type { LatestState } from '../types/latestState';
import { createDefaultEffectPipeline, updateEffectStackLayer } from './effectPipeline';
import { getRequiredExportProgramKeys } from './webgl';
import { getProgramSource } from './webglShaderSources';

function stateWithGlass(enabled: boolean): LatestState {
  const pipeline = createDefaultEffectPipeline();
  pipeline.effectStack = updateEffectStackLayer(pipeline.effectStack, 'glass', { enabled });
  return {
    effectPipeline: pipeline,
    imageGradient: { enabled: false },
    normalMap: { enabled: false, blur: 0 },
    postprocess: {
      glassMix: 1,
      glassRefraction: 32,
      glassChromaticAberration: 4,
      glassRoughness: 1.5,
      glassHighlight: 0.45,
      prismGlowRadius: 0,
    },
    stretch: { enabled: false },
    diffuse: { enabled: false },
  } as LatestState;
}

describe('export WebGL program plan', () => {
  it.each([
    ['Glass disabled', false, []],
    ['Glass enabled', true, ['stackCore', 'glassV2']],
  ])('requires the dedicated programs for %s', (_label, enabled, expected) => {
    expect(getRequiredExportProgramKeys(stateWithGlass(enabled))).toEqual(expected);
  });

  it('requests Stack Core for Stipple over a protected Image Gradient', () => {
    const state = stateWithGlass(false);
    state.imageGradient = { ...state.imageGradient, enabled: true };
    state.imageGradientSource = { width: 1, height: 1 } as unknown as HTMLCanvasElement;
    state.diffuse = { enabled: true, mode: 'legacy' } as LatestState['diffuse'];

    expect(getRequiredExportProgramKeys(state)).toEqual(['generator', 'stackCore']);
  });

  it('requests Stack Core and Seamless for the enabled Seamless stage', () => {
    const state = stateWithGlass(false);
    state.seamless = { enabled: true, blendWidth: 0.25 };

    expect(getRequiredExportProgramKeys(state)).toEqual(['stackCore', 'seamless']);
  });

  it('exposes the standalone Seamless shader uniforms', () => {
    const source = getProgramSource('seamless');

    expect(source.fragment).toContain('u_sourceTex');
    expect(source.fragment).toContain('u_blendWidth');
    expect(source.fragment).toContain('u_axis');
  });
});
