import { describe, expect, it } from 'vitest';
import {
  canRenderV2Direct,
  captureEffectStackEnabledState,
  createDefaultEffectPipeline,
  createDefaultEffectStack,
  getV2FramebufferAllocationMode,
  getV2RenderPlan,
  isEffectStackLayerTemporarilyHidden,
  isEffectStackLayerEnabled,
  moveEffectStackLayer,
  normalizeEffectPipelineConfig,
  normalizeEffectStack,
  requiresV2StackCore,
  requiresHeavyV2Postprocess,
  randomizeEffectStackOrder,
  soloEffectStackLayer,
  restoreEffectStackEnabledState,
  updateEffectStackLayer,
} from './effectPipeline';
import { shouldRenderNormalMap } from './normalMap';

function analyticPlanOptions(overrides: Partial<Parameters<typeof getV2RenderPlan>[1]> = {}) {
  return {
    normalMapEnabled: false,
    normalMapBlur: 0,
    prismGlowRadius: 0,
    gradientType: 'linear' as const,
    sourceImageEnabled: false,
    imageGradientEnabled: false,
    noiseType: 'simplex' as const,
    noiseLoopMode: 'legacy' as const,
    diffuseMode: 'block' as const,
    ...overrides,
  };
}

describe('effectPipeline', () => {
  describe('canRenderV2Direct', () => {
    it('only allows the V2 Diffuse-only pipeline without fixed or main-stack stages', () => {
      const diffuseOnly = createDefaultEffectPipeline();

      expect(canRenderV2Direct(diffuseOnly, false)).toBe(true);
      expect(canRenderV2Direct(diffuseOnly, false, false, true)).toBe(false);
      expect(canRenderV2Direct(diffuseOnly, true)).toBe(false);
      expect(canRenderV2Direct({ ...diffuseOnly, prismEnabled: true }, false)).toBe(false);
      expect(canRenderV2Direct({ ...diffuseOnly, particlesEnabled: true }, false)).toBe(false);
      expect(canRenderV2Direct({
        ...diffuseOnly,
        effectStack: updateEffectStackLayer(diffuseOnly.effectStack, 'noise', { enabled: true }),
      }, false)).toBe(false);
      expect(canRenderV2Direct({ ...diffuseOnly, version: 'legacy-v1' }, false)).toBe(false);
    });

    it('keeps Flow Gradient on the texture path so its output can reach the screen', () => {
      const pipeline = { ...createDefaultEffectPipeline(), flowGradientEnabled: true };
      const plan = getV2RenderPlan(pipeline, {
        normalMapEnabled: false,
        normalMapBlur: 0,
        prismGlowRadius: 0,
        flowGradientEnabled: true,
      });

      expect(canRenderV2Direct(pipeline, false)).toBe(false);
      expect(plan.framebufferAllocationMode).toBe('core');
      expect(plan.programs.stackCore).toBe(true);
    });
  });

  describe('getV2FramebufferAllocationMode', () => {
    it('allocates only the framebuffer set required by each V2 stage', () => {
      const diffuseOnly = createDefaultEffectPipeline();

      expect(getV2FramebufferAllocationMode(diffuseOnly, false)).toBe('direct');
      expect(getV2FramebufferAllocationMode(diffuseOnly, false, false, true)).toBe('core');

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

  describe('requiresV2StackCore', () => {
    it('keeps the core program for every non-direct path because it owns the final copy', () => {
      const pipeline = createDefaultEffectPipeline();
      expect(requiresV2StackCore({
        ...pipeline,
        effectStack: updateEffectStackLayer(pipeline.effectStack, 'diffuse', { enabled: false }),
      })).toBe(false);
      expect(requiresV2StackCore({
        ...pipeline,
        effectStack: updateEffectStackLayer(pipeline.effectStack, 'stretch', { enabled: true }),
      })).toBe(true);
      expect(requiresV2StackCore({
        ...pipeline,
        effectStack: updateEffectStackLayer(
          updateEffectStackLayer(pipeline.effectStack, 'diffuse', { enabled: false }),
          'glass',
          { enabled: true },
        ),
      })).toBe(true);
      expect(requiresV2StackCore(pipeline, true)).toBe(true);
      expect(requiresV2StackCore(pipeline, false, false, true)).toBe(true);
    });
  });

  describe('getV2RenderPlan', () => {
    it('consumes Base + Noise + Diffuse as a direct analytic prefix', () => {
      const pipeline = createDefaultEffectPipeline();
      const plan = getV2RenderPlan({
        ...pipeline,
        effectStack: updateEffectStackLayer(pipeline.effectStack, 'noise', { enabled: true }),
      }, analyticPlanOptions());

      expect(plan.analyticPrefix).toEqual({
        enabled: true,
        consumedLayers: ['noise', 'diffuse'],
        firstTextureLayerIndex: null,
        reason: 'enabled',
      });
      expect(plan.framebufferAllocationMode).toBe('direct');
      expect(plan.programs.stackCore).toBe(false);
      expect(plan.programs.noiseStack).toBe(false);
    });

    it('materializes the analytic prefix once before the first Glass texture layer', () => {
      const pipeline = createDefaultEffectPipeline();
      const plan = getV2RenderPlan({
        ...pipeline,
        effectStack: [
          { kind: 'noise', enabled: true },
          { kind: 'diffuse', enabled: true },
          { kind: 'glass', enabled: true },
          ...pipeline.effectStack.filter(layer => !['noise', 'diffuse', 'glass'].includes(layer.kind)),
        ],
      }, analyticPlanOptions());

      expect(plan.analyticPrefix).toEqual({
        enabled: true,
        consumedLayers: ['noise', 'diffuse'],
        firstTextureLayerIndex: 2,
        reason: 'enabled',
      });
      expect(plan.framebufferAllocationMode).toBe('core');
      expect(plan.programs.stackCore).toBe(true);
    });

    it('does not fuse a non-adjacent Noise and Diffuse pair', () => {
      const pipeline = createDefaultEffectPipeline();
      const reordered = [
        { kind: 'noise' as const, enabled: true },
        { kind: 'slit' as const, enabled: true },
        { kind: 'diffuse' as const, enabled: true },
      ];
      const plan = getV2RenderPlan({ ...pipeline, effectStack: reordered }, analyticPlanOptions());

      expect(plan.noiseDiffuseComposition).toEqual({
        enabled: false,
        noiseLayerIndex: 0,
        diffuseLayerIndex: 2,
        reason: 'not-adjacent',
      });
      expect(plan.programs.noiseDiffuseStack).toBe(false);
    });

    it('falls back when Diffuse precedes Noise in the same prefix', () => {
      const pipeline = createDefaultEffectPipeline();
      const reordered = [
        { kind: 'diffuse' as const, enabled: true },
        { kind: 'noise' as const, enabled: true },
        ...pipeline.effectStack.filter(layer => layer.kind !== 'diffuse' && layer.kind !== 'noise'),
      ];
      const plan = getV2RenderPlan({ ...pipeline, effectStack: reordered }, analyticPlanOptions());

      expect(plan.analyticPrefix.enabled).toBe(false);
      expect(plan.analyticPrefix.consumedLayers).toEqual([]);
      expect(plan.analyticPrefix.reason).toBe('invalid-order');
    });

    it('falls back when a texture layer precedes Noise and Diffuse', () => {
      const pipeline = createDefaultEffectPipeline();
      const reordered = [
        { kind: 'glass' as const, enabled: true },
        { kind: 'noise' as const, enabled: true },
        { kind: 'diffuse' as const, enabled: true },
        ...pipeline.effectStack.filter(layer => !['glass', 'noise', 'diffuse'].includes(layer.kind)),
      ];
      const plan = getV2RenderPlan({ ...pipeline, effectStack: reordered }, analyticPlanOptions());

      expect(plan.analyticPrefix).toEqual({
        enabled: false,
        consumedLayers: [],
        firstTextureLayerIndex: 0,
        reason: 'texture-first',
      });
    });

    it('plans one-pass Noise + Diffuse composition after a texture boundary', () => {
      const pipeline = createDefaultEffectPipeline();
      const reordered = [
        { kind: 'glass' as const, enabled: true },
        { kind: 'noise' as const, enabled: true },
        { kind: 'diffuse' as const, enabled: true },
        ...pipeline.effectStack.filter(layer => !['glass', 'noise', 'diffuse'].includes(layer.kind)),
      ];
      const plan = getV2RenderPlan({ ...pipeline, effectStack: reordered }, analyticPlanOptions());

      expect(plan.noiseDiffuseComposition).toEqual({
        enabled: true,
        noiseLayerIndex: 1,
        diffuseLayerIndex: 2,
        reason: 'enabled',
      });
      expect(plan.programs.noiseDiffuseStack).toBe(true);
      expect(plan.programs.noiseStack).toBe(false);
    });

    it.each([
      ['Diffuse → Slit', ['diffuse', 'slit'], 1],
      ['Noise → Diffuse → Slit', ['noise', 'diffuse', 'slit'], 2],
    ] as const)('keeps %s in the texture stack for Slit output-space Diffuse evaluation', (_label, kinds, firstTextureLayerIndex) => {
      const pipeline = createDefaultEffectPipeline();
      const reordered = kinds.map(kind => ({ kind, enabled: true }));
      const plan = getV2RenderPlan({ ...pipeline, effectStack: reordered }, analyticPlanOptions());

      expect(plan.analyticPrefix).toEqual({
        enabled: false,
        consumedLayers: [],
        firstTextureLayerIndex,
        reason: 'diffuse-before-slit',
      });
      expect(plan.framebufferAllocationMode).toBe('core');
      expect(plan.programs.stackCore).toBe(true);
    });

    it('does not fuse Noise → Diffuse before Slit', () => {
      const pipeline = createDefaultEffectPipeline();
      const reordered = [
        { kind: 'noise' as const, enabled: true },
        { kind: 'diffuse' as const, enabled: true },
        { kind: 'slit' as const, enabled: true },
      ];
      const plan = getV2RenderPlan({ ...pipeline, effectStack: reordered }, analyticPlanOptions());

      expect(plan.noiseDiffuseComposition).toEqual({
        enabled: false,
        noiseLayerIndex: 0,
        diffuseLayerIndex: 1,
        reason: 'diffuse-before-slit',
      });
      expect(plan.programs.noiseDiffuseStack).toBe(false);
    });

    it.each([
      ['Diffuse → Glass', ['diffuse', 'glass'], ['diffuse'], 1],
      ['Noise → Glass → Diffuse', ['noise', 'glass', 'diffuse'], ['noise'], 1],
      ['Glass → Noise → Diffuse', ['glass', 'noise', 'diffuse'], [], 0],
    ] as const)('selects the expected prefix boundary for %s', (_label, kinds, consumedLayers, firstTextureLayerIndex) => {
      const pipeline = createDefaultEffectPipeline();
      const reordered = kinds.map(kind => ({ kind, enabled: true }));
      const plan = getV2RenderPlan({ ...pipeline, effectStack: reordered }, analyticPlanOptions());

      expect(plan.analyticPrefix.consumedLayers).toEqual(consumedLayers);
      expect(plan.analyticPrefix.firstTextureLayerIndex).toBe(firstTextureLayerIndex);
      expect(plan.analyticPrefix.enabled).toBe(consumedLayers.length > 0);
      expect(plan.analyticPrefix.reason).toBe(consumedLayers.length > 0 ? 'enabled' : 'texture-first');
    });

    it.each([
      ['source-image', { sourceImageEnabled: true }, 'source-image'],
      ['image-gradient', { imageGradientEnabled: true }, 'image-gradient'],
      ['normal-map', { normalMapEnabled: true }, 'normal-map'],
      ['seamless', { seamlessEnabled: true }, 'seamless'],
      ['flow-gradient', { flowGradientEnabled: true }, 'flow-gradient'],
      ['mesh-gradient', { gradientType: 'mesh' as const }, 'non-analytic-gradient'],
      ['seamless-noise-loop', { noiseLoopMode: 'seamless' as const }, 'unsupported-noise'],
      ['seamless-noise-type', { noiseType: 'seamless' as const }, 'unsupported-noise'],
    ] as const)('falls back for the protected %s input', (_label, options, reason) => {
      const pipeline = createDefaultEffectPipeline();
      const plan = getV2RenderPlan({
        ...pipeline,
        effectStack: updateEffectStackLayer(pipeline.effectStack, 'noise', { enabled: true }),
      }, analyticPlanOptions(options));

      expect(plan.analyticPrefix.enabled).toBe(false);
      expect(plan.analyticPrefix.reason).toBe(reason);
    });

    it('keeps legacy Diffuse forced texture behavior out of the analytic prefix', () => {
      const pipeline = createDefaultEffectPipeline();
      const plan = getV2RenderPlan(pipeline, analyticPlanOptions({
        diffuseMode: 'legacy',
        forceTextureDiffusePass: true,
      }));

      expect(plan.analyticPrefix.enabled).toBe(false);
      expect(plan.analyticPrefix.reason).toBe('forced-texture-diffuse');
      expect(plan.framebufferAllocationMode).toBe('core');
      expect(plan.programs.stackCore).toBe(true);
    });

    it('keeps legacy Stipple on the texture-stack path when Diffuse is the only layer', () => {
      const plan = getV2RenderPlan(createDefaultEffectPipeline(), {
        normalMapEnabled: false,
        normalMapBlur: 0,
        prismGlowRadius: 0,
        forceTextureDiffusePass: true,
      });

      expect(plan.framebufferAllocationMode).toBe('core');
      expect(plan.programs.stackCore).toBe(true);
    });

    it('keeps Normal Map parity with Legacy by suppressing it while Diffuse is enabled', () => {
      const pipeline = createDefaultEffectPipeline();
      const withDiffuseOff = {
        ...pipeline,
        effectStack: updateEffectStackLayer(pipeline.effectStack, 'diffuse', { enabled: false }),
      };

      expect(shouldRenderNormalMap(true, false)).toBe(true);
      expect(shouldRenderNormalMap(true, true)).toBe(false);
      expect(getV2RenderPlan(pipeline, {
        normalMapEnabled: true,
        normalMapBlur: 1,
        prismGlowRadius: 0,
      }).normalRequested).toBe(false);
      expect(getV2RenderPlan(withDiffuseOff, {
        normalMapEnabled: true,
        normalMapBlur: 1,
        prismGlowRadius: 0,
      }).normalRequested).toBe(true);
    });

    it('requests the dedicated Noise program only when the Noise layer is enabled', () => {
      const pipeline = createDefaultEffectPipeline();
      const plan = getV2RenderPlan({
        ...pipeline,
        effectStack: updateEffectStackLayer(pipeline.effectStack, 'noise', { enabled: true }),
      }, {
        normalMapEnabled: false,
        normalMapBlur: 0,
        prismGlowRadius: 0,
      });

      expect(plan.programs.stackCore).toBe(true);
      expect(plan.programs.noiseStack).toBe(true);
    });

    it('derives one consistent resource plan from the normalized enabled layers', () => {
      const pipeline = createDefaultEffectPipeline();
      const glassPipeline = {
        ...pipeline,
        effectStack: updateEffectStackLayer(
          updateEffectStackLayer(pipeline.effectStack, 'glass', { enabled: true }),
          'diffuse', { enabled: false },
        ),
        prismEnabled: true,
        particlesEnabled: true,
      };

      const plan = getV2RenderPlan(glassPipeline, {
        normalMapEnabled: true,
        normalMapBlur: 1,
        prismGlowRadius: 4,
      });

      expect(plan.enabledLayers.map(layer => layer.kind)).toEqual(['glass']);
      expect(plan.diffuseEnabled).toBe(false);
      expect(plan.framebufferAllocationMode).toBe('full');
      expect(plan.programs).toEqual({
        stackCore: true,
        noiseStack: false,
        noiseDiffuseStack: false,
        glassV2: true,
        normalMap: true,
        blur: true,
        stretch: false,
        prism: true,
        prismComposite: true,
        particles: true,
      });
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
      flowGradientEnabled: false,
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

  it('migrates Glass V2 aliases into one V2-backed Glass layer', () => {
    const normalized = normalizeEffectStack([
      { kind: 'glass', enabled: false },
      { kind: 'glassV2', enabled: true },
      { kind: 'mirror', enabled: true },
    ]);

    expect(normalized.slice(0, 3)).toEqual([
      { kind: 'glass', enabled: true },
      { kind: 'mirror', enabled: true },
      { kind: 'noise', enabled: false },
    ]);
    expect(JSON.stringify(normalized)).not.toContain('glassV2');
  });

  it('merges a trailing Glass V2 alias even after all canonical layers are present', () => {
    const normalized = normalizeEffectStack([
      ...createDefaultEffectStack().map(layer => (
        layer.kind === 'glass' ? { ...layer, enabled: false } : layer
      )),
      { kind: 'glassV2', enabled: true },
    ]);

    expect(normalized.find(layer => layer.kind === 'glass')).toEqual({ kind: 'glass', enabled: true });
    expect(JSON.stringify(normalized)).not.toContain('glassV2');
  });

  it('preserves the requested Diffuse position while filling missing layers', () => {
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
      'diffuse',
      'glass',
      'noise',
      'slit',
      'stretch',
      'distort',
      'mirror',
      'kaleidoscope',
      'voronoi',
    ]);
    expect(Object.fromEntries(normalized.map(layer => [layer.kind, layer.enabled]))).toEqual({
      diffuse: false,
      glass: true,
      noise: true,
      slit: false,
      stretch: true,
      distort: false,
      mirror: true,
      kaleidoscope: false,
      voronoi: true,
    });
  });

  it('treats a missing pipeline as a legacy-v1 preset', () => {
    expect(normalizeEffectPipelineConfig(undefined)).toEqual({
      version: 'legacy-v1',
      effectStack: createDefaultEffectStack(),
      selectedKind: 'diffuse',
      prismEnabled: false,
      particlesEnabled: false,
      flowGradientEnabled: false,
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

    expect(moveEffectStackLayer(toggled, 'diffuse', 0).at(0)).toEqual({ kind: 'diffuse', enabled: true });
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

  it('allows Diffuse and other layers to move across the complete stack', () => {
    const stack = updateEffectStackLayer(createDefaultEffectStack(), 'noise', { enabled: true });

    expect(moveEffectStackLayer(stack, 'diffuse', 0).at(0)).toEqual({ kind: 'diffuse', enabled: true });

    const movedPastDiffuse = moveEffectStackLayer(stack, 'noise', Number.MAX_SAFE_INTEGER);
    expect(movedPastDiffuse.map(layer => layer.kind)).toEqual([
      'slit',
      'stretch',
      'distort',
      'mirror',
      'kaleidoscope',
      'voronoi',
      'glass',
      'diffuse',
      'noise',
    ]);
    expect(movedPastDiffuse.at(-2)).toEqual({ kind: 'diffuse', enabled: true });
    expect(movedPastDiffuse.at(-1)).toEqual({ kind: 'noise', enabled: true });
  });

  it('randomizes the complete stack without changing layer enabled state', () => {
    const stack = updateEffectStackLayer(
      updateEffectStackLayer(createDefaultEffectStack(), 'noise', { enabled: true }),
      'glass',
      { enabled: true },
    );
    const enabledByKind = Object.fromEntries(stack.map(layer => [layer.kind, layer.enabled]));
    let seed = 0;
    const randomized = randomizeEffectStackOrder(stack, () => (seed += 0.17) % 1);

    expect(randomized).toHaveLength(9);
    expect(new Set(randomized.map(layer => layer.kind))).toEqual(new Set(stack.map(layer => layer.kind)));
    expect(Object.fromEntries(randomized.map(layer => [layer.kind, layer.enabled]))).toEqual(enabledByKind);
    expect(randomized).not.toBe(stack);
  });

  it('solos one main-stack layer without changing layer identities', () => {
    const stack = updateEffectStackLayer(createDefaultEffectStack(), 'glass', { enabled: true });
    const solo = soloEffectStackLayer(stack, 'mirror');

    expect(solo.filter(layer => layer.enabled).map(layer => layer.kind)).toEqual(['mirror']);
    expect(solo.map(layer => layer.kind)).toEqual(stack.map(layer => layer.kind));
  });

  it('restores the enabled state captured before solo mode', () => {
    const stack = updateEffectStackLayer(
      updateEffectStackLayer(createDefaultEffectStack(), 'noise', { enabled: true }),
      'glass',
      { enabled: true },
    );
    const captured = captureEffectStackEnabledState(stack);
    const solo = soloEffectStackLayer(stack, 'glass');
    expect(restoreEffectStackEnabledState(solo, captured)).toEqual(stack);
  });

  it('marks only layers newly hidden by solo mode as temporary', () => {
    const stack = updateEffectStackLayer(
      updateEffectStackLayer(createDefaultEffectStack(), 'noise', { enabled: true }),
      'glass',
      { enabled: true },
    );
    const previousEnabledState = captureEffectStackEnabledState(stack);
    const solo = soloEffectStackLayer(stack, 'glass');

    expect(isEffectStackLayerTemporarilyHidden('noise', solo.find(layer => layer.kind === 'noise')!.enabled, 'glass', previousEnabledState)).toBe(true);
    expect(isEffectStackLayerTemporarilyHidden('slit', solo.find(layer => layer.kind === 'slit')!.enabled, 'glass', previousEnabledState)).toBe(false);
    expect(isEffectStackLayerTemporarilyHidden('glass', true, 'glass', previousEnabledState)).toBe(false);
  });
});
