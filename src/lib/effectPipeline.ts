import type {
  DiffuseMode,
  EffectPipelineConfig,
  EffectPipelineVersion,
  EffectStackKind,
  EffectStackLayer,
  NoiseDistortionConfig,
} from '../types/distortion';
import type { GradientType } from '../types/gradient';
import { shouldRenderNormalMap } from './normalMap';

/** V2 で新規作成する主スタックの初期順序。 */
export const EFFECT_STACK_KINDS = [
  'noise',
  'slit',
  'stretch',
  'distort',
  'mirror',
  'kaleidoscope',
  'voronoi',
  'glass',
  'diffuse',
] as const satisfies readonly EffectStackKind[];

/** Postprocessの全体ON/OFFへ反映する、主スタック内のレイヤー。 */
export const POSTPROCESS_EFFECT_STACK_KINDS = [
  'stretch',
  'distort',
  'mirror',
  'kaleidoscope',
  'voronoi',
  'glass',
] as const satisfies readonly EffectStackKind[];

const EFFECT_STACK_KIND_SET = new Set<string>(EFFECT_STACK_KINDS);
const POSTPROCESS_EFFECT_STACK_KIND_SET = new Set<string>(POSTPROCESS_EFFECT_STACK_KINDS);
const ANALYTIC_GRADIENT_TYPES = new Set<GradientType>([
  'linear',
  'radial',
  'fourcolor',
  'diamond',
  'angle',
  'bezier',
]);
const ANALYTIC_NOISE_TYPES = new Set<NoiseDistortionConfig['type']>([
  'simplex',
  'fbm',
  'voronoi',
  'curl',
  'fast_curl',
  'domain_warp_anim',
  'ridged_fbm',
  'ae_fractal',
  'caustics',
  'phasor',
]);
const ANALYTIC_DIFFUSE_MODES = new Set<DiffuseMode>(['block', 'smooth']);

export function isEffectStackKind(value: unknown): value is EffectStackKind {
  return typeof value === 'string' && EFFECT_STACK_KIND_SET.has(value);
}

export function createDefaultEffectStack(): EffectStackLayer[] {
  return EFFECT_STACK_KINDS.map(kind => ({
    kind,
    enabled: kind === 'diffuse',
  }));
}

export function createDefaultEffectPipeline(): EffectPipelineConfig {
  return {
    version: 'stack-v2',
    effectStack: createDefaultEffectStack(),
    selectedKind: 'diffuse',
    prismEnabled: false,
    particlesEnabled: false,
    flowGradientEnabled: false,
  };
}

export function createLegacyEffectPipeline(): EffectPipelineConfig {
  return {
    ...createDefaultEffectPipeline(),
    version: 'legacy-v1',
  };
}

function normalizeVersion(value: unknown): EffectPipelineVersion {
  return value === 'stack-v2' ? 'stack-v2' : 'legacy-v1';
}

/**
 * V2 の並びを保ちつつ、未知値・重複を除去し、欠けた既知レイヤーを補う。
 * レイヤー情報がまったく読めない場合は新規作成と同じ初期状態へ戻す。
 */
export function normalizeEffectStack(stack: unknown): EffectStackLayer[] {
  if (!Array.isArray(stack)) return createDefaultEffectStack();

  const seen = new Set<EffectStackKind>();
  const normalized: EffectStackLayer[] = [];
  for (const rawLayer of stack) {
    if (typeof rawLayer !== 'object' || rawLayer === null) continue;
    const rawKind = (rawLayer as { kind?: unknown }).kind;
    const kind = rawKind === 'glassV2' ? 'glass' : rawKind;
    if (!isEffectStackKind(kind)) continue;
    const enabled = Boolean((rawLayer as { enabled?: unknown }).enabled);
    const existing = normalized.find(layer => layer.kind === kind);
    if (existing) {
      existing.enabled = existing.enabled || enabled;
      continue;
    }
    normalized.push({ kind, enabled });
    seen.add(kind);
  }

  if (normalized.length === 0) return createDefaultEffectStack();

  for (const kind of EFFECT_STACK_KINDS) {
    if (!seen.has(kind)) normalized.push({ kind, enabled: false });
  }
  return normalized;
}

export function getPostprocessEffectStackEnabledSignature(effectPipeline: EffectPipelineConfig): string {
  if (effectPipeline.version !== 'stack-v2') return '';
  return normalizeEffectStack(effectPipeline.effectStack)
    .filter(layer => POSTPROCESS_EFFECT_STACK_KIND_SET.has(layer.kind))
    .map(layer => `${layer.kind}:${layer.enabled ? '1' : '0'}`)
    .sort()
    .join('|');
}

export function hasEnabledPostprocessEffectStack(effectPipeline: EffectPipelineConfig): boolean {
  return getPostprocessEffectStackEnabledSignature(effectPipeline)
    .split('|')
    .some(layer => layer.endsWith(':1'));
}

/**
 * プリセットなど外部入力を安全なパイプライン状態へ変換する。
 * `effectPipeline` が存在しない旧プリセットは Legacy v1 として扱う。
 */
export function normalizeEffectPipelineConfig(value: unknown): EffectPipelineConfig {
  if (typeof value !== 'object' || value === null) return createLegacyEffectPipeline();

  const raw = value as Partial<EffectPipelineConfig>;
  const effectStack = normalizeEffectStack(raw.effectStack);
  const rawSelectedKind = (value as { selectedKind?: unknown }).selectedKind;
  const selectedKind = rawSelectedKind === 'glassV2'
    ? 'glass'
    : isEffectStackKind(rawSelectedKind)
      ? rawSelectedKind
    : 'diffuse';

  return {
    version: normalizeVersion(raw.version),
    effectStack,
    selectedKind,
    prismEnabled: Boolean(raw.prismEnabled),
    particlesEnabled: Boolean(raw.particlesEnabled),
    flowGradientEnabled: Boolean(raw.flowGradientEnabled),
  };
}

export function moveEffectStackLayer(
  stack: EffectStackLayer[],
  kind: EffectStackKind,
  targetIndex: number,
): EffectStackLayer[] {
  const normalized = normalizeEffectStack(stack);
  const fromIndex = normalized.findIndex(layer => layer.kind === kind);
  if (fromIndex < 0) return normalized;
  const next = normalized.filter(layer => layer.kind !== kind);
  const clampedIndex = Math.max(0, Math.min(next.length, Math.round(targetIndex)));
  next.splice(clampedIndex, 0, normalized[fromIndex]);
  return next;
}

/**
 * 主スタックの全レイヤーを一度ずつ含むランダムな順列を作る。
 * レイヤーの有効状態や設定は順序変更から独立して保持する。
 */
export function randomizeEffectStackOrder(
  stack: EffectStackLayer[],
  random: () => number = Math.random,
): EffectStackLayer[] {
  const next = normalizeEffectStack(stack).map(layer => ({ ...layer }));
  for (let index = next.length - 1; index > 0; index -= 1) {
    const sample = random();
    const bounded = Number.isFinite(sample)
      ? Math.max(0, Math.min(0.9999999999999999, sample))
      : 0;
    const swapIndex = Math.floor(bounded * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

/**
 * 指定した主スタックレイヤーだけを有効にする。固定段はこの配列に
 * 含まれないため、Prism／Particlesの状態へ影響しない。
 */
export function soloEffectStackLayer(
  stack: EffectStackLayer[],
  kind: EffectStackKind,
): EffectStackLayer[] {
  return normalizeEffectStack(stack).map(layer => ({
    ...layer,
    enabled: layer.kind === kind,
  }));
}

export type EffectStackEnabledState = Record<EffectStackKind, boolean>;

export function captureEffectStackEnabledState(stack: EffectStackLayer[]): EffectStackEnabledState {
  const state = {} as EffectStackEnabledState;
  for (const layer of normalizeEffectStack(stack)) state[layer.kind] = layer.enabled;
  return state;
}

export function restoreEffectStackEnabledState(
  stack: EffectStackLayer[],
  enabledState: EffectStackEnabledState,
): EffectStackLayer[] {
  return normalizeEffectStack(stack).map(layer => ({
    ...layer,
    enabled: enabledState[layer.kind],
  }));
}

/** Returns true when solo mode temporarily hid a layer that was enabled before soloing. */
export function isEffectStackLayerTemporarilyHidden(
  kind: EffectStackKind,
  enabled: boolean,
  soloTargetKind: EffectStackKind,
  previousEnabledState: EffectStackEnabledState,
): boolean {
  return kind !== soloTargetKind && previousEnabledState[kind] && !enabled;
}

export function updateEffectStackLayer(
  stack: EffectStackLayer[],
  kind: EffectStackKind,
  patch: Partial<Pick<EffectStackLayer, 'enabled'>>,
): EffectStackLayer[] {
  return normalizeEffectStack(stack).map(layer => (
    layer.kind === kind ? { ...layer, ...patch } : layer
  ));
}

export function isEffectStackLayerEnabled(
  pipeline: EffectPipelineConfig,
  kind: EffectStackKind,
): boolean {
  return pipeline.version === 'stack-v2'
    && normalizeEffectStack(pipeline.effectStack).some(layer => layer.kind === kind && layer.enabled);
}

export function canRenderV2Direct(
  pipeline: EffectPipelineConfig,
  normalMapEnabled: boolean,
  clothGradientEnabled = false,
  forceTextureDiffusePass = false,
  seamlessEnabled = false,
  flowGradientEnabled = false,
): boolean {
  const flowStageEnabled = flowGradientEnabled || pipeline.flowGradientEnabled === true;
  if (clothGradientEnabled || forceTextureDiffusePass || seamlessEnabled || flowStageEnabled) return false;
  const stack = normalizeEffectStack(pipeline.effectStack);
  return pipeline.version === 'stack-v2'
    && !normalMapEnabled
    && !pipeline.prismEnabled
    && !pipeline.particlesEnabled
    && !stack.some(layer => layer.kind !== 'diffuse' && layer.enabled);
}

export function getV2FramebufferAllocationMode(
  pipeline: EffectPipelineConfig,
  normalMapEnabled: boolean,
  clothGradientEnabled = false,
  forceTextureDiffusePass = false,
  seamlessEnabled = false,
  flowGradientEnabled = false,
): 'direct' | 'core' | 'full' {
  if (canRenderV2Direct(pipeline, normalMapEnabled, clothGradientEnabled, forceTextureDiffusePass, seamlessEnabled, flowGradientEnabled)) return 'direct';
  if (normalMapEnabled || pipeline.prismEnabled) return 'full';
  return 'core';
}

/**
 * Returns whether the V2 lightweight texture program is needed. The core
 * program also owns the final texture-to-screen copy, so every non-direct
 * V2 path needs it even when its effect stages use dedicated programs.
 */
export function requiresV2StackCore(
  pipeline: EffectPipelineConfig,
  normalMapEnabled = false,
  clothGradientEnabled = false,
  forceTextureDiffusePass = false,
  seamlessEnabled = false,
  flowGradientEnabled = false,
): boolean {
  return pipeline.version === 'stack-v2'
    && !canRenderV2Direct(pipeline, normalMapEnabled, clothGradientEnabled, forceTextureDiffusePass, seamlessEnabled, flowGradientEnabled);
}

export type V2RenderPlanOptions = {
  normalMapEnabled: boolean;
  normalMapBlur: number;
  prismGlowRadius: number;
  clothGradientEnabled?: boolean;
  /** Requires Diffuse to run as a texture stack pass even when it is the only layer. */
  forceTextureDiffusePass?: boolean;
  /** Requires a full color texture before the final Seamless pass. */
  seamlessEnabled?: boolean;
  /** Requires a texture path so Flow Gradient can be presented after compositing. */
  flowGradientEnabled?: boolean;
  /** The analytic Generator can only consume these source-independent gradients. */
  gradientType?: GradientType;
  sourceImageEnabled?: boolean;
  imageGradientEnabled?: boolean;
  noiseType?: NoiseDistortionConfig['type'];
  noiseLoopMode?: NoiseDistortionConfig['noiseLoopMode'];
  diffuseMode?: DiffuseMode;
};

export type AnalyticPrefixReason =
  | 'enabled'
  | 'legacy-pipeline'
  | 'missing-analytic-inputs'
  | 'non-analytic-gradient'
  | 'source-image'
  | 'image-gradient'
  | 'cloth'
  | 'flow-gradient'
  | 'seamless'
  | 'normal-map'
  | 'prism'
  | 'particles'
  | 'forced-texture-diffuse'
  | 'unsupported-noise'
  | 'unsupported-diffuse'
  | 'invalid-order'
  | 'diffuse-before-slit'
  | 'texture-first'
  | 'no-prefix-layers';

export type AnalyticPrefixPlan = {
  enabled: boolean;
  consumedLayers: Extract<EffectStackKind, 'noise' | 'diffuse'>[];
  /** Index in `enabledLayers`, or null when the prefix reaches the final output. */
  firstTextureLayerIndex: number | null;
  reason: AnalyticPrefixReason;
};

export type V2RenderPlan = {
  normalizedStack: EffectStackLayer[];
  enabledLayers: EffectStackLayer[];
  analyticPrefix: AnalyticPrefixPlan;
  diffuseEnabled: boolean;
  normalRequested: boolean;
  normalNeedsBlur: boolean;
  prismRequested: boolean;
  prismNeedsBlur: boolean;
  particlesRequested: boolean;
  framebufferAllocationMode: 'direct' | 'core' | 'full';
  programs: {
    stackCore: boolean;
    noiseStack: boolean;
    glassV2: boolean;
    normalMap: boolean;
    blur: boolean;
    stretch: boolean;
    prism: boolean;
    prismComposite: boolean;
    particles: boolean;
  };
};

function disabledAnalyticPrefix(reason: AnalyticPrefixReason, firstTextureLayerIndex: number | null = null): AnalyticPrefixPlan {
  return {
    enabled: false,
    consumedLayers: [],
    firstTextureLayerIndex,
    reason,
  };
}

/**
 * Determines which leading V2 layers can stay in the analytic Generator.
 *
 * The returned index is relative to the enabled layer list. This keeps the
 * value useful to the renderer even when disabled layers are interspersed in
 * the normalized persisted stack.
 */
export function getAnalyticGradientPrefixPlan(
  pipeline: EffectPipelineConfig,
  enabledLayers: EffectStackLayer[],
  options: V2RenderPlanOptions,
): AnalyticPrefixPlan {
  if (pipeline.version !== 'stack-v2') return disabledAnalyticPrefix('legacy-pipeline');
  if (options.gradientType === undefined || options.noiseType === undefined || options.diffuseMode === undefined) {
    return disabledAnalyticPrefix('missing-analytic-inputs');
  }
  if (!ANALYTIC_GRADIENT_TYPES.has(options.gradientType)) return disabledAnalyticPrefix('non-analytic-gradient');
  if (options.sourceImageEnabled) return disabledAnalyticPrefix('source-image');
  if (options.imageGradientEnabled) return disabledAnalyticPrefix('image-gradient');
  if (options.clothGradientEnabled) return disabledAnalyticPrefix('cloth');
  if (options.flowGradientEnabled || pipeline.flowGradientEnabled) return disabledAnalyticPrefix('flow-gradient');
  if (options.seamlessEnabled) return disabledAnalyticPrefix('seamless');
  if (options.normalMapEnabled) return disabledAnalyticPrefix('normal-map');
  if (pipeline.prismEnabled) return disabledAnalyticPrefix('prism');
  if (pipeline.particlesEnabled) return disabledAnalyticPrefix('particles');

  const firstTextureLayerIndex = enabledLayers.findIndex(layer => layer.kind !== 'noise' && layer.kind !== 'diffuse');
  const prefixLayers = firstTextureLayerIndex < 0
    ? enabledLayers
    : enabledLayers.slice(0, firstTextureLayerIndex);
  if (prefixLayers.length === 0) {
    return disabledAnalyticPrefix(firstTextureLayerIndex === 0 ? 'texture-first' : 'no-prefix-layers', firstTextureLayerIndex < 0 ? null : firstTextureLayerIndex);
  }
  if (prefixLayers.some(layer => layer.kind !== 'noise' && layer.kind !== 'diffuse')) {
    return disabledAnalyticPrefix('texture-first', firstTextureLayerIndex);
  }

  const noiseIndex = prefixLayers.findIndex(layer => layer.kind === 'noise');
  const diffuseIndex = prefixLayers.findIndex(layer => layer.kind === 'diffuse');
  if (noiseIndex >= 0 && diffuseIndex >= 0 && diffuseIndex < noiseIndex) {
    return disabledAnalyticPrefix('invalid-order', firstTextureLayerIndex < 0 ? null : firstTextureLayerIndex);
  }
  if (
    noiseIndex >= 0
    && (
      !ANALYTIC_NOISE_TYPES.has(options.noiseType)
      || options.noiseLoopMode === 'seamless'
    )
  ) {
    return disabledAnalyticPrefix('unsupported-noise', firstTextureLayerIndex < 0 ? null : firstTextureLayerIndex);
  }
  if (diffuseIndex >= 0 && (!ANALYTIC_DIFFUSE_MODES.has(options.diffuseMode) || options.forceTextureDiffusePass)) {
    return disabledAnalyticPrefix(
      options.forceTextureDiffusePass ? 'forced-texture-diffuse' : 'unsupported-diffuse',
      firstTextureLayerIndex < 0 ? null : firstTextureLayerIndex,
    );
  }
  const firstTextureLayer = firstTextureLayerIndex >= 0 ? enabledLayers[firstTextureLayerIndex] : null;
  if (diffuseIndex >= 0 && firstTextureLayer?.kind === 'slit') {
    return disabledAnalyticPrefix('diffuse-before-slit', firstTextureLayerIndex);
  }

  const consumedLayers = prefixLayers
    .filter((layer): layer is EffectStackLayer & { kind: 'noise' | 'diffuse' } => layer.kind === 'noise' || layer.kind === 'diffuse')
    .map(layer => layer.kind);
  if (consumedLayers.length === 0) return disabledAnalyticPrefix('no-prefix-layers', firstTextureLayerIndex < 0 ? null : firstTextureLayerIndex);
  return {
    enabled: true,
    consumedLayers,
    firstTextureLayerIndex: firstTextureLayerIndex < 0 ? null : firstTextureLayerIndex,
    reason: 'enabled',
  };
}

/**
 * Builds the immutable V2 render contract once per frame.
 *
 * Keeping layer normalization, resource requirements, and FBO selection in
 * one pure function prevents the renderer from making subtly different
 * decisions in its readiness and draw loops.
 */
export function getV2RenderPlan(
  pipeline: EffectPipelineConfig,
  options: V2RenderPlanOptions,
): V2RenderPlan {
  const normalizedStack = normalizeEffectStack(pipeline.effectStack);
  const enabledLayers = normalizedStack.filter(layer => layer.enabled);
  const diffuseEnabled = enabledLayers.some(layer => layer.kind === 'diffuse');
  const forceTextureDiffusePass = diffuseEnabled && Boolean(options.forceTextureDiffusePass);
  const seamlessEnabled = Boolean(options.seamlessEnabled);
  const normalRequested = shouldRenderNormalMap(options.normalMapEnabled, diffuseEnabled);
  const normalNeedsBlur = normalRequested && options.normalMapBlur >= 0.5;
  const prismRequested = pipeline.prismEnabled;
  const prismNeedsBlur = prismRequested && Number.isFinite(options.prismGlowRadius)
    && options.prismGlowRadius > 0.01;
  const particlesRequested = pipeline.particlesEnabled;
  const glassV2Requested = enabledLayers.some(layer => layer.kind === 'glass');
  const noiseRequested = enabledLayers.some(layer => layer.kind === 'noise');
  const stretchRequested = enabledLayers.some(layer => layer.kind === 'stretch');
  const flowGradientEnabled = Boolean(options.flowGradientEnabled);
  const analyticPrefix = getAnalyticGradientPrefixPlan(pipeline, enabledLayers, options);
  const analyticPrefixDirect = analyticPrefix.enabled && analyticPrefix.firstTextureLayerIndex === null;
  const framebufferAllocationMode = analyticPrefixDirect
    ? 'direct'
    : getV2FramebufferAllocationMode(
      pipeline,
      normalRequested,
      options.clothGradientEnabled,
      forceTextureDiffusePass,
      seamlessEnabled,
      flowGradientEnabled,
    );

  return {
    normalizedStack,
    enabledLayers,
    analyticPrefix,
    diffuseEnabled,
    normalRequested,
    normalNeedsBlur,
    prismRequested,
    prismNeedsBlur,
    particlesRequested,
    framebufferAllocationMode,
    programs: {
      stackCore: framebufferAllocationMode !== 'direct' && requiresV2StackCore(
        pipeline,
        normalRequested,
        options.clothGradientEnabled,
        forceTextureDiffusePass,
        seamlessEnabled,
        flowGradientEnabled,
      ),
      noiseStack: noiseRequested && !analyticPrefix.consumedLayers.includes('noise'),
      glassV2: glassV2Requested,
      normalMap: normalRequested,
      blur: normalNeedsBlur || prismNeedsBlur,
      stretch: stretchRequested,
      prism: prismRequested,
      prismComposite: prismRequested,
      particles: particlesRequested,
    },
  };
}

export function requiresHeavyV2Postprocess(
  effectStack: EffectStackLayer[],
  prismEnabled: boolean,
): boolean {
  if (prismEnabled) return true;
  return effectStack.some(layer => layer.enabled && layer.kind === 'glass');
}
