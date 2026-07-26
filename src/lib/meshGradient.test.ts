import { describe, expect, it } from 'vitest';
import { normalizePostprocessConfig, STORE_DEFAULTS } from '../store/gradientStore';
import { DEFAULT_MESH_GRADIENT, normalizeMeshGradientConfig } from '../types/gradient';
import type { LatestState } from '../types/latestState';
import { makePreset, isPreset, type StoreSnapshot } from './presetModel';
import { samplePreviewMeshUV } from './presetPreview';
import { buildMeshGradientField, evaluateMeshPatch } from './meshGradientField';
import { evaluateSceneAtTime } from './sceneEvaluation';

function snapshot(): StoreSnapshot {
  return {
    gradient: {
      ...STORE_DEFAULTS.gradient,
      gradientType: 'mesh',
      mesh: normalizeMeshGradientConfig(DEFAULT_MESH_GRADIENT),
    },
    noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
    diffuse: { ...STORE_DEFAULTS.diffuse },
    imageGradient: { ...STORE_DEFAULTS.imageGradient },
    slitScan: { ...STORE_DEFAULTS.slitScan },
    stretch: { ...STORE_DEFAULTS.stretch },
    animation: { ...STORE_DEFAULTS.animation },
    normalMap: { ...STORE_DEFAULTS.normalMap },
    radon: { ...STORE_DEFAULTS.radon },
    iridescence: { ...STORE_DEFAULTS.iridescence },
    manualDistort: { ...STORE_DEFAULTS.manualDistort, displacement: [...STORE_DEFAULTS.manualDistort.displacement], smoothMask: [...STORE_DEFAULTS.manualDistort.smoothMask] },
    postprocess: { ...STORE_DEFAULTS.postprocess },
    effectPipeline: { ...STORE_DEFAULTS.effectPipeline, effectStack: STORE_DEFAULTS.effectPipeline.effectStack.map(layer => ({ ...layer })) },
    matcap: { ...STORE_DEFAULTS.matcap },
    keyframeTracks: {},
  };
}

describe('Mesh Gradation preset and preview', () => {
  it('round-trips mesh corners, handles, and color positions through JSON', () => {
    const source = snapshot();
    source.gradient.mesh!.corners[0] = [-0.2, 0.1];
    source.gradient.mesh!.handles.right[1] = [1.2, 0.9];
    source.gradient.mesh!.colorPositions = [0.05, 0.4, 0.7, 0.95];
    const reloaded: unknown = JSON.parse(JSON.stringify(makePreset('Mesh', source)));
    expect(isPreset(reloaded)).toBe(true);
    if (!isPreset(reloaded)) throw new Error('Expected preset');
    expect(reloaded.state.gradient.mesh).toEqual(source.gradient.mesh);
  });

  it('maps the default patch corners back to their patch coordinates', () => {
    const gradient = snapshot().gradient;
    expect(samplePreviewMeshUV(gradient, 0, 0)).toEqual([0, 0]);
    expect(samplePreviewMeshUV(gradient, 1, 0)).toEqual([1, 0]);
    expect(samplePreviewMeshUV(gradient, 0, 1)).toEqual([0, 1]);
    expect(samplePreviewMeshUV(gradient, 1, 1)).toEqual([1, 1]);
    expect(samplePreviewMeshUV(gradient, 0.5, 0.5)).toEqual([0.5, 0.5]);
  });

  it('evaluates mesh corner keyframes through the shared scene path', () => {
    const source = snapshot();
    const state: LatestState = {
      ...source,
      imageGradient: source.imageGradient ?? STORE_DEFAULTS.imageGradient,
      stretch: source.stretch ?? STORE_DEFAULTS.stretch,
      iridescence: source.iridescence ?? STORE_DEFAULTS.iridescence,
      manualDistort: source.manualDistort ?? STORE_DEFAULTS.manualDistort,
      postprocess: normalizePostprocessConfig(source.postprocess),
      effectPipeline: source.effectPipeline ?? STORE_DEFAULTS.effectPipeline,
      matcap: source.matcap ?? STORE_DEFAULTS.matcap,
      animation: { ...source.animation, enabled: true, previewLoop: false },
      keyframeTracks: {
        'mesh.corner.0.x': {
          propertyId: 'mesh.corner.0.x',
          label: 'Mesh BL.X',
          mode: 'keys',
          enabled: true,
          keyframes: [
            { id: 'mesh-start', time: 0, value: 0, interpolation: 'linear' },
            { id: 'mesh-end', time: 1, value: 0.4, interpolation: 'linear' },
          ],
        },
      },
      width: 100,
      height: 100,
      animDirection: 0,
    };

    const evaluated = evaluateSceneAtTime(state, 0.5);
    expect(evaluated.gradient.mesh?.corners[0][0]).toBeCloseTo(0.2);
  });

  it('uses forward tessellation and keeps the field covered for strongly curved handles', () => {
    const rampData = new Uint8Array([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 0, 255,
    ]);
    const mesh = normalizeMeshGradientConfig({
      ...DEFAULT_MESH_GRADIENT,
      handles: {
        bottom: [[-2, 2], [3, -1]],
        right: [[2, 3], [-1, 2]],
        top: [[3, 4], [-2, 3]],
        left: [[-1, -2], [2, -1]],
      },
    });
    const field = buildMeshGradientField(mesh, rampData, 4, { width: 48, height: 32, subdivisions: 16 });
    expect(field).toHaveLength(48 * 32 * 4);
    expect(Array.from(field).every(Number.isFinite)).toBe(true);
    expect(Array.from(field).every((value, index) => index % 4 !== 3 || value > 0)).toBe(true);
    expect(evaluateMeshPatch(mesh, 0, 0)).toEqual([0, 0]);
    expect(evaluateMeshPatch(mesh, 1, 1)).toEqual([1, 1]);
  });
});
