import type {
  EffectPipelineConfig,
  EffectPipelineVersion,
  EffectStackKind,
  EffectStackLayer,
} from '../types/distortion';

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

const EFFECT_STACK_KIND_SET = new Set<string>(EFFECT_STACK_KINDS);

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
    if (seen.size === EFFECT_STACK_KINDS.length) break;
    if (typeof rawLayer !== 'object' || rawLayer === null) continue;
    const kind = (rawLayer as { kind?: unknown }).kind;
    if (!isEffectStackKind(kind) || seen.has(kind)) continue;
    normalized.push({
      kind,
      enabled: Boolean((rawLayer as { enabled?: unknown }).enabled),
    });
    seen.add(kind);
  }

  if (normalized.length === 0) return createDefaultEffectStack();

  for (const kind of EFFECT_STACK_KINDS) {
    if (!seen.has(kind)) normalized.push({ kind, enabled: false });
  }
  const diffuseLayer = normalized.find(layer => layer.kind === 'diffuse')!;
  return [
    ...normalized.filter(layer => layer.kind !== 'diffuse'),
    diffuseLayer,
  ];
}

/**
 * プリセットなど外部入力を安全なパイプライン状態へ変換する。
 * `effectPipeline` が存在しない旧プリセットは Legacy v1 として扱う。
 */
export function normalizeEffectPipelineConfig(value: unknown): EffectPipelineConfig {
  if (typeof value !== 'object' || value === null) return createLegacyEffectPipeline();

  const raw = value as Partial<EffectPipelineConfig>;
  const effectStack = normalizeEffectStack(raw.effectStack);
  const selectedKind = isEffectStackKind(raw.selectedKind)
    ? raw.selectedKind
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
  if (kind === 'diffuse') return normalized;
  const diffuseLayer = normalized.find(layer => layer.kind === 'diffuse')!;
  const movable = normalized.filter(layer => layer.kind !== 'diffuse');
  const fromIndex = movable.findIndex(layer => layer.kind === kind);
  if (fromIndex < 0) return normalized;
  const next = movable.filter(layer => layer.kind !== kind);
  const clampedIndex = Math.max(0, Math.min(next.length, Math.round(targetIndex)));
  next.splice(clampedIndex, 0, movable[fromIndex]);
  return [...next, diffuseLayer];
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
): boolean {
  return pipeline.version === 'stack-v2'
    && !normalMapEnabled
    && !pipeline.prismEnabled
    && !pipeline.particlesEnabled
    && !pipeline.effectStack.some(layer => layer.kind !== 'diffuse' && layer.enabled);
}

export function getV2FramebufferAllocationMode(
  pipeline: EffectPipelineConfig,
  normalMapEnabled: boolean,
): 'direct' | 'core' | 'full' {
  if (canRenderV2Direct(pipeline, normalMapEnabled)) return 'direct';
  if (normalMapEnabled || pipeline.prismEnabled) return 'full';
  return 'core';
}

export function requiresHeavyV2Postprocess(
  effectStack: EffectStackLayer[],
  prismEnabled: boolean,
): boolean {
  if (prismEnabled) return true;
  return effectStack.some(layer => layer.enabled && (
    layer.kind === 'glass'
  ));
}
