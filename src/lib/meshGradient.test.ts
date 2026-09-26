import { describe, expect, it } from 'vitest';
import { normalizePostprocessConfig, STORE_DEFAULTS } from '../store/gradientStore';
import { DEFAULT_MESH_GRADIENT, normalizeMeshGradientConfig, type MeshGradientConfig } from '../types/gradient';
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
    manualDistort: { ...STORE_DEFAULTS.manualDistort, displacement: [...STORE_DEFAULTS.manualDistort.displacement], smoothMask: [...STORE_DEFAULTS.manualDistort.smoothMask] },
    postprocess: { ...STORE_DEFAULTS.postprocess },
    effectPipeline: { ...STORE_DEFAULTS.effectPipeline, effectStack: STORE_DEFAULTS.effectPipeline.effectStack.map(layer => ({ ...layer })) },
    keyframeTracks: {},
  };
}

describe('Mesh Gradation preset and preview', () => {
  it('round-trips grid points, edge handles, and direct point colors through JSON', () => {
    const source = snapshot();
    const mesh = source.gradient.mesh!;
    mesh.points[0] = [-0.2, 0.1];
    mesh.edgeHandles.vertical[0][1][1] = [1.2, 0.9];
    mesh.colorMode = 'direct';
    mesh.pointColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
    const normalized = normalizeMeshGradientConfig(mesh);
    source.gradient.mesh = normalized;
    const reloaded: unknown = JSON.parse(JSON.stringify(makePreset('Mesh', source)));
    expect(isPreset(reloaded)).toBe(true);
    if (!isPreset(reloaded)) throw new Error('Expected preset');
    expect(reloaded.state.gradient.mesh).toEqual(normalized);
    expect(reloaded.state.gradient.mesh?.colorMode).toBe('direct');
    expect(reloaded.state.gradient.mesh?.pointColors).toEqual(['#FF0000', '#00FF00', '#0000FF', '#FFFF00']);
  });

  it('keeps a legacy corners/handles preset readable as a 2x2 ramp-driven grid', () => {
    const source = snapshot();
    // Strip grid fields to emulate a preset written before CHANGE-045.
    const { points: _points, edgeHandles: _edgeHandles, pointColors: _pointColors, colorMode: _colorMode, ...legacyMesh } = source.gradient.mesh!;
    const mesh = legacyMesh as MeshGradientConfig;
    mesh.corners[0] = [-0.2, 0.1];
    mesh.handles.right[1] = [1.2, 0.9];
    source.gradient.mesh = mesh;
    const reloaded: unknown = JSON.parse(JSON.stringify(makePreset('Legacy Mesh', source)));
    expect(isPreset(reloaded)).toBe(true);
    if (!isPreset(reloaded)) throw new Error('Expected preset');
    const loaded = reloaded.state.gradient.mesh;
    expect(loaded?.rows).toBe(2);
    expect(loaded?.columns).toBe(2);
    expect(loaded?.points).toHaveLength(4);
    expect(loaded?.points[0]).toEqual([-0.2, 0.1]);
    expect(loaded?.corners[0]).toEqual([-0.2, 0.1]);
    expect(loaded?.handles.right[1]).toEqual([1.2, 0.9]);
    expect(loaded?.colorMode).toBe('ramp');
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
      coneView: source.coneView ?? STORE_DEFAULTS.coneView,
      imageGradient: source.imageGradient ?? STORE_DEFAULTS.imageGradient,
      stretch: source.stretch ?? STORE_DEFAULTS.stretch,
      manualDistort: source.manualDistort ?? STORE_DEFAULTS.manualDistort,
      postprocess: normalizePostprocessConfig(source.postprocess),
      effectPipeline: source.effectPipeline ?? STORE_DEFAULTS.effectPipeline,
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

  it('evaluates grid point position keyframes through the shared scene path', () => {
    const source = snapshot();
    const state: LatestState = {
      ...source,
      coneView: source.coneView ?? STORE_DEFAULTS.coneView,
      imageGradient: source.imageGradient ?? STORE_DEFAULTS.imageGradient,
      stretch: source.stretch ?? STORE_DEFAULTS.stretch,
      manualDistort: source.manualDistort ?? STORE_DEFAULTS.manualDistort,
      postprocess: normalizePostprocessConfig(source.postprocess),
      effectPipeline: source.effectPipeline ?? STORE_DEFAULTS.effectPipeline,
      animation: { ...source.animation, enabled: true, previewLoop: false },
      keyframeTracks: {
        'mesh.point.0.x': {
          propertyId: 'mesh.point.0.x',
          label: 'Mesh Point 1.X',
          mode: 'keys',
          enabled: true,
          keyframes: [
            { id: 'p-start', time: 0, value: 0, interpolation: 'linear' },
            { id: 'p-end', time: 1, value: 0.4, interpolation: 'linear' },
          ],
        },
      },
      width: 100,
      height: 100,
      animDirection: 0,
    };
    const evaluated = evaluateSceneAtTime(state, 0.5);
    expect(evaluated.gradient.mesh?.points[0][0]).toBeCloseTo(0.2);
    expect(evaluated.gradient.mesh?.points[0][1]).toBe(0);
  });

  it('evaluates direct-mode point color keyframes through the shared scene path', () => {
    const source = snapshot();
    const mesh = normalizeMeshGradientConfig({
      ...source.gradient.mesh!,
      colorMode: 'direct',
      pointColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
    });
    source.gradient.mesh = mesh;
    const state: LatestState = {
      ...source,
      coneView: source.coneView ?? STORE_DEFAULTS.coneView,
      imageGradient: source.imageGradient ?? STORE_DEFAULTS.imageGradient,
      stretch: source.stretch ?? STORE_DEFAULTS.stretch,
      manualDistort: source.manualDistort ?? STORE_DEFAULTS.manualDistort,
      postprocess: normalizePostprocessConfig(source.postprocess),
      effectPipeline: source.effectPipeline ?? STORE_DEFAULTS.effectPipeline,
      animation: { ...source.animation, enabled: true, previewLoop: false },
      keyframeTracks: {
        'mesh.point.1.r': {
          propertyId: 'mesh.point.1.r',
          label: 'Mesh Point 2.R',
          mode: 'keys',
          enabled: true,
          keyframes: [
            { id: 'c-start', time: 0, value: 1, interpolation: 'linear' },
            { id: 'c-end', time: 1, value: 0, interpolation: 'linear' },
          ],
        },
      },
      width: 100,
      height: 100,
      animDirection: 0,
    };
    const evaluated = evaluateSceneAtTime(state, 0.5);
    expect(evaluated.gradient.mesh?.colorMode).toBe('direct');
    // Point 1 (BR) was #00FF00; R channel halves from 1 → 0.5 → #80FF00.
    expect(evaluated.gradient.mesh?.pointColors?.[1]).toBe('#80FF00');
  });

  it('ignores point color keyframes in ramp mode', () => {
    const source = snapshot();
    const state: LatestState = {
      ...source,
      coneView: source.coneView ?? STORE_DEFAULTS.coneView,
      imageGradient: source.imageGradient ?? STORE_DEFAULTS.imageGradient,
      stretch: source.stretch ?? STORE_DEFAULTS.stretch,
      manualDistort: source.manualDistort ?? STORE_DEFAULTS.manualDistort,
      postprocess: normalizePostprocessConfig(source.postprocess),
      effectPipeline: source.effectPipeline ?? STORE_DEFAULTS.effectPipeline,
      animation: { ...source.animation, enabled: true, previewLoop: false },
      keyframeTracks: {
        'mesh.point.1.r': {
          propertyId: 'mesh.point.1.r',
          label: 'Mesh Point 2.R',
          mode: 'keys',
          enabled: true,
          keyframes: [
            { id: 'c-start', time: 0, value: 1, interpolation: 'linear' },
            { id: 'c-end', time: 1, value: 0, interpolation: 'linear' },
          ],
        },
      },
      width: 100,
      height: 100,
      animDirection: 0,
    };
    const evaluated = evaluateSceneAtTime(state, 0.5);
    expect(evaluated.gradient.mesh?.colorMode).toBe('ramp');
    expect('pointColors' in evaluated.gradient.mesh!).toBe(false);
  });

  it('evaluates Bezier control point keyframes through the shared scene path', () => {
    const source = snapshot();
    source.gradient.gradientType = 'bezier';
    source.gradient.anchors = [[0.5, 0], [0.5, 1], [0.5, 0.5], [0.5, 0.5]];
    source.gradient.bezierControls = [[0.4, 0.3], [0.6, 0.7]];
    const state: LatestState = {
      ...source,
      coneView: source.coneView ?? STORE_DEFAULTS.coneView,
      imageGradient: source.imageGradient ?? STORE_DEFAULTS.imageGradient,
      stretch: source.stretch ?? STORE_DEFAULTS.stretch,
      manualDistort: source.manualDistort ?? STORE_DEFAULTS.manualDistort,
      postprocess: normalizePostprocessConfig(source.postprocess),
      effectPipeline: source.effectPipeline ?? STORE_DEFAULTS.effectPipeline,
      animation: { ...source.animation, enabled: true, previewLoop: false },
      keyframeTracks: {
        'bezierControl.0.x': {
          propertyId: 'bezierControl.0.x',
          label: 'A Control.X',
          mode: 'keys',
          enabled: true,
          keyframes: [
            { id: 'bc-start', time: 0, value: 0.4, interpolation: 'linear' },
            { id: 'bc-end', time: 1, value: 0.8, interpolation: 'linear' },
          ],
        },
      },
      width: 100,
      height: 100,
      animDirection: 0,
    };
    const evaluated = evaluateSceneAtTime(state, 0.5);
    expect(evaluated.gradient.bezierControls?.[0][0]).toBeCloseTo(0.6);
    expect(evaluated.gradient.bezierControls?.[1]).toEqual([0.6, 0.7]);
  });

  it('uses forward tessellation and keeps the field covered for strongly curved handles', () => {
    const rampData = new Uint8Array([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 0, 255,
    ]);
    const curved: [number, number][][] = [
      [[-2, 2], [3, -1]],
      [[2, 3], [-1, 2]],
      [[3, 4], [-2, 3]],
      [[-1, -2], [2, -1]],
    ];
    const mesh = normalizeMeshGradientConfig({
      ...DEFAULT_MESH_GRADIENT,
      edgeHandles: {
        // horizontal has one entry per grid row (2 rows for the 2×2 grid).
        horizontal: [[curved[0] as [number, number][]], [curved[2] as [number, number][]]],
        // vertical has one entry per inner row (1 row with 2 columns).
        vertical: [[curved[1] as [number, number][], curved[3] as [number, number][]]],
      },
    });
    const field = buildMeshGradientField(mesh, rampData, 4, { width: 48, height: 32, subdivisions: 16 });
    expect(field).toHaveLength(48 * 32 * 4);
    expect(Array.from(field).every(Number.isFinite)).toBe(true);
    expect(Array.from(field).every((value, index) => index % 4 !== 3 || value > 0)).toBe(true);
    expect(evaluateMeshPatch(mesh, 0, 0)).toEqual([0, 0]);
    expect(evaluateMeshPatch(mesh, 1, 1)).toEqual([1, 1]);
  });

  it('samples intermediate ramp stops continuously across a ramp-driven mesh', () => {
    const rampData = new Uint8Array([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
    ]);
    const mesh = normalizeMeshGradientConfig(DEFAULT_MESH_GRADIENT);
    const field = buildMeshGradientField(mesh, rampData, 3, { width: 5, height: 5, subdivisions: 32 });
    const center = 2 * 5 * 4 + 2 * 4;
    expect(field[center + 1]).toBeGreaterThan(field[center] + 100);
    expect(field[center + 1]).toBeGreaterThan(field[center + 2] + 100);
  });
});
