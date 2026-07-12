import { describe, expect, it } from 'vitest';
import {
  canRenderV2Direct,
  createDefaultEffectPipeline,
  createDefaultEffectStack,
  getV2FramebufferAllocationMode,
  isEffectStackLayerEnabled,
  moveEffectStackLayer,
  normalizeEffectPipelineConfig,
  normalizeEffectStack,
  requiresHeavyV2Postprocess,
  updateEffectStackLayer,
} from './effectPipeline';

describe('effectPipeline', () => {
  describe('canRenderV2Direct', () => {
    it('only allows the V2 Diffuse-only pipeline without fixed or main-stack stages', () => {
      const diffuseOnly = createDefaultEffectPipeline();

      expect(canRenderV2Direct(diffuseOnly, false)).toBe(true);
      expect(canRenderV2Direct(diffuseOnly, true)).toBe(false);
      expect(canRenderV2Direct({ ...diffuseOnly, prismEnabled: true }, false)).toBe(false);
      expect(canRenderV2Direct({ ...diffuseOnly, particlesEnabled: true }, false)).toBe(false);
      expect(canRenderV2Direct({
        ...diffuseOnly,
        effectStack: updateEffectStackLayer(diffuseOnly.effectStack, 'noise', { enabled: true }),
      }, false)).toBe(false);
      expect(canRenderV2Direct({ ...diffuseOnly, version: 'legacy-v1' }, false)).toBe(false);
    });
  });

  describe('getV2FramebufferAllocationMode', () => {
    it('allocates only the framebuffer set required by each V2 stage', () => {
      const diffuseOnly = createDefaultEffectPipeline();

      expect(getV2FramebufferAllocationMode(diffuseOnly, false)).toBe('direct');

      for (const kind of createDefaultEffectStack()
        .map(layer => layer.kind)
        .filter(kind => kind !== 'diffuse')) {
        expect(getV2FramebufferAllocationMode({
          ...diffuseOnly,
          effectStack: updateEffectStackLayer(diffuseOnly.effectStack, kind, { enabled: true }),
        }, false), kind).toBe('core');
      }

      expect(getV2FramebufferAllocationMode({
        ...diffuseOnly,
        particlesEnabled: true,
      }, false)).toBe('core');
      expect(getV2FramebufferAllocationMode(diffuseOnly, true)).toBe('full');
      expect(getV2FramebufferAllocationMode({
        ...diffuseOnly,
        prismEnabled: true,
      }, false)).toBe('full');
    });

    it('falls back to core allocation for a legacy pipeline when called defensively', () => {
      expect(getV2FramebufferAllocationMode({
        ...createDefaultEffectPipeline(),
        version: 'legacy-v1',
      }, false)).toBe('core');
    });
  });

  describe('requiresHeavyV2Postprocess', () => {
    it('keeps lightweight stack effects off the heavy program', () => {
      const stack = createDefaultEffectStack();
      for (const kind of ['noise', 'slit', 'stretch', 'distort', 'mirror', 'kaleidoscope', 'voronoi', 'diffuse'] as const) {
        expect(requiresHeavyV2Postprocess(
          updateEffectStackLayer(stack, kind, { enabled: true }),
          false,
        ), kind).toBe(false);
      }
    });

    it('requires the heavy program for heavy layers or Prism', () => {
      const stack = createDefaultEffectStack();
      for (const kind of ['glass'] as const) {
        expect(requiresHeavyV2Postprocess(
          updateEffectStackLayer(stack, kind, { enabled: true }),
          false,
        ), kind).toBe(true);
      }
      expect(requiresHeavyV2Postprocess(stack, true)).toBe(true);
    });
  });

  it('creates the V2 stack in its canonical order with only Diffuse enabled', () => {
    expect(createDefaultEffectPipeline()).toEqual({
      version: 'stack-v2',
      effectStack: [
        { kind: 'noise', enabled: false },
        { kind: 'slit', enabled: false },
        { kind: 'stretch', enabled: false },
        { kind: 'distort', enabled: false },
        { kind: 'mirror', enabled: false },
        { kind: 'kaleidoscope', enabled: false },
        { kind: 'voronoi', enabled: false },
        { kind: 'glass', enabled: false },
        { kind: 'diffuse', enabled: true },
      ],
      selectedKind: 'diffuse',
      prismEnabled: false,
      particlesEnabled: false,
    });
  });

  it('removes unknown and duplicate layers while filling in missing kinds', () => {
    expect(normalizeEffectStack([
      { kind: 'glass', enabled: true },
      { kind: 'future-effect', enabled: true },
      { kind: 'mirror', enabled: 1 },
      { kind: 'glass', enabled: false },
    ])).toEqual([
      { kind: 'glass', enabled: true },
      { kind: 'mirror', enabled: true },
      { kind: 'noise', enabled: false },
      { kind: 'slit', enabled: false },
      { kind: 'stretch', enabled: false },
      { kind: 'distort', enabled: false },
      { kind: 'kaleidoscope', enabled: false },
      { kind: 'voronoi', enabled: false },
      { kind: 'diffuse', enabled: false },
    ]);
  });

  it('always normalizes Diffuse to the fixed final position without changing toggles', () => {
    const normalized = normalizeEffectStack([
      { kind: 'diffuse', enabled: false },
      { kind: 'glass', enabled: true },
      { kind: 'noise', enabled: true },
      { kind: 'slit', enabled: false },
      { kind: 'stretch', enabled: true },
      { kind: 'distort', enabled: false },
      { kind: 'mirror', enabled: true },
      { kind: 'kaleidoscope', enabled: false },
      { kind: 'voronoi', enabled: true },
    ]);

    expect(normalized.map(layer => layer.kind)).toEqual([
      'glass',
      'noise',
      'slit',
      'stretch',
      'distort',
      'mirror',
      'kaleidoscope',
      'voronoi',
      'diffuse',
    ]);
    expect(Object.fromEntries(normalized.map(layer => [layer.kind, layer.enabled]))).toEqual({
      glass: true,
      noise: true,
      slit: false,
      stretch: true,
      distort: false,
      mirror: true,
      kaleidoscope: false,
      voronoi: true,
      diffuse: false,
    });
  });

  it('treats a missing pipeline as a legacy-v1 preset', () => {
    expect(normalizeEffectPipelineConfig(undefined)).toEqual({
      version: 'legacy-v1',
      effectStack: createDefaultEffectStack(),
      selectedKind: 'diffuse',
      prismEnabled: false,
      particlesEnabled: false,
    });
  });

  it('moves and toggles V2 layers without changing their identity', () => {
    const moved = moveEffectStackLayer(createDefaultEffectStack(), 'glass', 1);
    const toggled = updateEffectStackLayer(moved, 'glass', { enabled: true });

    expect(toggled.map(layer => layer.kind)).toEqual([
      'noise',
      'glass',
      'slit',
      'stretch',
      'distort',
      'mirror',
      'kaleidoscope',
      'voronoi',
      'diffuse',
    ]);

    expect(moveEffectStackLayer(toggled, 'diffuse', 0)).toEqual(toggled);
    expect(isEffectStackLayerEnabled({
      version: 'stack-v2',
      effectStack: toggled,
      selectedKind: 'glass',
      prismEnabled: false,
      particlesEnabled: false,
    }, 'glass')).toBe(true);
    expect(isEffectStackLayerEnabled({
      version: 'legacy-v1',
      effectStack: toggled,
      selectedKind: 'glass',
      prismEnabled: false,
      particlesEnabled: false,
    }, 'glass')).toBe(false);
  });

  it('keeps Diffuse fixed and clamps every movable layer before it', () => {
    const stack = updateEffectStackLayer(createDefaultEffectStack(), 'noise', { enabled: true });

    expect(moveEffectStackLayer(stack, 'diffuse', 0)).toEqual(stack);

    const movedPastDiffuse = moveEffectStackLayer(stack, 'noise', Number.MAX_SAFE_INTEGER);
    expect(movedPastDiffuse.map(layer => layer.kind)).toEqual([
      'slit',
      'stretch',
      'distort',
      'mirror',
      'kaleidoscope',
      'voronoi',
      'glass',
      'noise',
      'diffuse',
    ]);
    expect(movedPastDiffuse.at(-2)).toEqual({ kind: 'noise', enabled: true });
    expect(movedPastDiffuse.at(-1)).toEqual({ kind: 'diffuse', enabled: true });
  });
});
