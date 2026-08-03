import { describe, expect, it } from 'vitest';
import { createDefaultEffectPipeline, getV2RenderPlan, updateEffectStackLayer } from './effectPipeline';
import { getProgramSource } from './webglShaderSources';
import { shouldRenderNormalMap } from './normalMap';

describe('Normal Map rendering parity', () => {
  it('uses the same Diffuse exclusion rule in Legacy and V2', () => {
    const pipeline = createDefaultEffectPipeline();
    const diffuseOff = {
      ...pipeline,
      effectStack: updateEffectStackLayer(pipeline.effectStack, 'diffuse', { enabled: false }),
    };

    expect(shouldRenderNormalMap(true, true)).toBe(false);
    expect(shouldRenderNormalMap(true, false)).toBe(true);
    expect(getV2RenderPlan(pipeline, {
      normalMapEnabled: true,
      normalMapBlur: 0,
      prismGlowRadius: 0,
    }).normalRequested).toBe(false);
    expect(getV2RenderPlan(diffuseOff, {
      normalMapEnabled: true,
      normalMapBlur: 0,
      prismGlowRadius: 0,
    }).normalRequested).toBe(true);
  });

  it('keeps the shared luminance, orientation, and RGBA encoding contract', () => {
    const source = getProgramSource('normalMap').fragment;

    expect(source).toContain('dot(texture2D(u_gradientTex');
    expect(source).toContain('vec3(0.299, 0.587, 0.114)');
    expect(source).toContain('float dx = (tR - tL) / (2.0 * stp.x)');
    expect(source).toContain('float dy = (tU - tD) / (2.0 * stp.y)');
    expect(source).toContain('vec3 normal = normalize(vec3(-rdx, -rdy, 1.0));');
    expect(source).toContain('normal * 0.5 + 0.5');
  });
});
