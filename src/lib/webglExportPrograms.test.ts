import { describe, expect, it } from 'vitest';
import type { LatestState } from '../types/latestState';
import { createDefaultEffectPipeline, updateEffectStackLayer } from './effectPipeline';
import { getRequiredExportProgramKeys } from './webgl';

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
});
