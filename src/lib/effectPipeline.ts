import type {
  EffectPipelineConfig,
  EffectPipelineVersion,
  EffectStackKind,
  EffectStackLayer,
} from '../types/distortion';
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
): boolean {
  if (clothGradientEnabled || forceTextureDiffusePass) return false;
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
): 'direct' | 'core' | 'full' {
  if (canRenderV2Direct(pipeline, normalMapEnabled, clothGradientEnabled, forceTextureDiffusePass)) return 'direct';
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
): boolean {
  return pipeline.version === 'stack-v2'
    && !canRenderV2Direct(pipeline, normalMapEnabled, clothGradientEnabled, forceTextureDiffusePass);
}

export type V2RenderPlanOptions = {
  normalMapEnabled: boolean;
  normalMapBlur: number;
  prismGlowRadius: number;
  clothGradientEnabled?: boolean;
  /** Requires Diffuse to run as a texture stack pass even when it is the only layer. */
  forceTextureDiffusePass?: boolean;
};

export type V2RenderPlan = {
  normalizedStack: EffectStackLayer[];
  enabledLayers: EffectStackLayer[];
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
  const normalRequested = shouldRenderNormalMap(options.normalMapEnabled, diffuseEnabled);
  const normalNeedsBlur = normalRequested && options.normalMapBlur >= 0.5;
  const prismRequested = pipeline.prismEnabled;
  const prismNeedsBlur = prismRequested && Number.isFinite(options.prismGlowRadius)
    && options.prismGlowRadius > 0.01;
  const particlesRequested = pipeline.particlesEnabled;
  const glassV2Requested = enabledLayers.some(layer => layer.kind === 'glass');
  const noiseRequested = enabledLayers.some(layer => layer.kind === 'noise');
  const stretchRequested = enabledLayers.some(layer => layer.kind === 'stretch');

  return {
    normalizedStack,
    enabledLayers,
    diffuseEnabled,
    normalRequested,
    normalNeedsBlur,
    prismRequested,
    prismNeedsBlur,
    particlesRequested,
    framebufferAllocationMode: getV2FramebufferAllocationMode(
      pipeline,
      normalRequested,
      options.clothGradientEnabled,
      forceTextureDiffusePass,
    ),
    programs: {
      stackCore: requiresV2StackCore(
        pipeline,
        normalRequested,
        options.clothGradientEnabled,
        forceTextureDiffusePass,
      ),
      noiseStack: noiseRequested,
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
