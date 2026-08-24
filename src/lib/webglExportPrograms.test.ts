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

  it('requests the full Generator for an analytic prefix and keeps Glass on the texture path', () => {
    const state = stateWithGlass(true);
    state.effectPipeline.effectStack = [
      { kind: 'noise', enabled: true },
      { kind: 'diffuse', enabled: true },
      { kind: 'glass', enabled: true },
      ...state.effectPipeline.effectStack.filter(layer => !['noise', 'diffuse', 'glass'].includes(layer.kind)),
    ];
    state.gradient = { gradientType: 'linear' } as LatestState['gradient'];
    state.noiseDistortion = { type: 'simplex', noiseLoopMode: 'legacy' } as LatestState['noiseDistortion'];
    state.diffuse = { enabled: true, mode: 'block' } as LatestState['diffuse'];

    expect(getRequiredExportProgramKeys(state)).toEqual(['generator', 'stackCore', 'glassV2']);
  });

  it('does not request the analytic Generator when Seamless is configured', () => {
    const state = stateWithGlass(false);
    state.gradient = { gradientType: 'linear' } as LatestState['gradient'];
    state.noiseDistortion = { type: 'simplex', noiseLoopMode: 'legacy' } as LatestState['noiseDistortion'];
    state.diffuse = { enabled: true, mode: 'block' } as LatestState['diffuse'];
    state.effectPipeline.effectStack = updateEffectStackLayer(state.effectPipeline.effectStack, 'noise', { enabled: true });
    state.seamless = { enabled: true, blendWidth: 0.25 };

    expect(getRequiredExportProgramKeys(state)).toEqual(['stackCore', 'noiseStack', 'seamless']);
  });

  it('requests all Flow Gradient passes when the fixed stage is enabled', () => {
    const state = stateWithGlass(false);
    state.effectPipeline.flowGradientEnabled = true;

    expect(getRequiredExportProgramKeys(state)).toEqual(['stackCore', 'flowSplat', 'flowTrail', 'flowComposite']);
  });

  it('exposes the standalone Seamless shader uniforms', () => {
    const source = getProgramSource('seamless');

    expect(source.fragment).toContain('u_sourceTex');
    expect(source.fragment).toContain('u_blendWidth');
    expect(source.fragment).toContain('u_axis');
  });

  it('exposes the Flow Gradient shader stages', () => {
    const splat = getProgramSource('flowSplat');
    const trail = getProgramSource('flowTrail');
    const composite = getProgramSource('flowComposite');

    expect(splat.vertex).toContain('gl_InstanceID');
    expect(splat.fragment).toContain('u_density');
    expect(splat.fragment).toContain('u_particleOpacity');
    expect(splat.vertex).toContain('u_particleSize');
    expect(trail.fragment).toContain('u_previousTrailTex');
    expect(composite.fragment).toContain('u_gradientRamp');
    expect(composite.fragment).toContain('u_flowOpacity');
    expect(composite.fragment).toContain('u_fullResolution');
    expect(composite.fragment).toContain('u_tileOffset');
    expect(composite.fragment).toContain('texture2D(u_trailTex');
    expect(composite.fragment).not.toMatch(/\btexture\s*\(/);
  });

  it('reconstructs Flow as a smooth density field instead of additive particle sprites', () => {
    const splat = getProgramSource('flowSplat');
    const trail = getProgramSource('flowTrail');
    const composite = getProgramSource('flowComposite');

    expect(splat.vertex).toContain('hashUint');
    expect(splat.vertex).toContain('sphericalEmitterDirection');
    expect(splat.vertex).toContain('float z = seedA * 2.0 - 1.0;');
    expect(splat.vertex).toContain('SPHERE_TRAVEL_SCALE');
    expect(splat.vertex).toContain('STREAMLINE_PARTICLES');
    expect(splat.vertex).toContain('uint streamline = particle / STREAMLINE_PARTICLES;');
    expect(splat.vertex).toContain('float pathSample =');
    expect(splat.vertex).toContain('RADIAL_EMITTER_BIAS');
    expect(splat.vertex).toContain('CURL_SAMPLE_OFFSET');
    expect(splat.vertex).toContain('FIELD_SPREAD');
    expect(splat.vertex).toContain('SCREEN_FIELD_SCALE');
    expect(splat.vertex).toContain('CAMERA_Z');
    expect(splat.vertex).toContain('FIBONACCI_SPHERE_COUNT');
    expect(splat.vertex).toContain('sphereIndex');
    expect(splat.vertex).toContain('curlField3D');
    expect(splat.vertex).toContain('dot(curl, emitterDirection)');
    expect(splat.vertex).toContain('integrateEmitterParticle');
    expect(splat.vertex).toContain('v_alpha = depthFade');
    expect(splat.vertex).toContain('projectFlowPoint');
    expect(splat.vertex).toContain('DEPTH_NEAR');
    expect(splat.vertex).toContain('DEPTH_FAR');
    expect(splat.fragment).toContain('PARTICLE_DENSITY_WEIGHT');
    expect(splat.fragment).toContain('RIBBON_EDGE_SHARPNESS');
    expect(splat.fragment).toContain('RIBBON_EDGE_SHARPNESS = 3.5');
    expect(splat.fragment).toContain('CAPSULE_LONGITUDINAL_FEATHER');
    expect(splat.fragment).toContain('abs(v_corner.x)');
    expect(trail.fragment).toContain('sampleSmoothDensity');
    expect(trail.fragment).toContain('sampleSmoothTrail');
    expect(trail.fragment).toContain('vec2 texel = 1.5 / u_resolution');
    expect(trail.fragment).toContain('mix(density, previous, retention)');
    expect(composite.fragment).toContain('1.0 - exp(-trail * DENSITY_RESPONSE)');
    expect(composite.fragment).toContain('PARTICLE_TINT');
    expect(composite.fragment).toContain('vec3(1.0) - exp(-PARTICLE_TINT * trail * PARTICLE_SCREEN_RESPONSE)');
    expect(composite.fragment).toContain('screenParticle');
    expect(composite.fragment).toContain('mix(0.28, 1.0, density)');
    expect(composite.fragment).toContain('float particleColorMix = 0.10 + 0.55 * smoothstep(0.18, 0.72, density);');
    expect(composite.fragment).not.toContain('0.72 + 0.28 * smoothstep');
    expect(composite.fragment).toContain('densityMask');
    expect(composite.fragment).toContain('smoothstep(0.004, 0.025, density)');
    expect(composite.fragment).toContain('u_flowOpacity');
    expect(composite.fragment).toContain('(gl_FragCoord.xy + u_tileOffset) / u_fullResolution');
    expect(composite.fragment).toContain('flowColor.a * densityMask');
    expect(composite.fragment).not.toContain('source.a * densityMask');
    expect(composite.fragment).not.toContain('source.rgb +');
  });
});
