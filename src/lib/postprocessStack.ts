import type {
  PostprocessConfig,
  PostprocessEffectMode,
  PostprocessStackKind,
  PostprocessStackLayer,
} from '../types/distortion';

export const POSTPROCESS_STACK_KINDS = [
  'distort',
  'mirror',
  'kaleidoscope',
  'prism',
  'voronoi',
  'glass',
] as const satisfies readonly PostprocessStackKind[];

const STACK_KIND_SET = new Set<string>(POSTPROCESS_STACK_KINDS);

export function isPostprocessStackKind(value: unknown): value is PostprocessStackKind {
  return typeof value === 'string' && STACK_KIND_SET.has(value);
}

export function createDefaultPostprocessStack(
  activeKind: PostprocessEffectMode = 'distort',
): PostprocessStackLayer[] {
  return POSTPROCESS_STACK_KINDS.map(kind => ({
    kind,
    enabled: kind === activeKind,
  }));
}

export function normalizePostprocessEffectStack(
  stack: unknown,
  legacyMode: PostprocessEffectMode = 'distort',
): PostprocessStackLayer[] {
  if (!Array.isArray(stack)) {
    return createDefaultPostprocessStack(legacyMode);
  }

  const seen = new Set<PostprocessStackKind>();
  const normalized: PostprocessStackLayer[] = [];
  for (const rawLayer of stack) {
    if (typeof rawLayer !== 'object' || rawLayer === null) continue;
    const kind = (rawLayer as { kind?: unknown }).kind;
    if (!isPostprocessStackKind(kind) || seen.has(kind)) continue;
    normalized.push({
      kind,
      enabled: Boolean((rawLayer as { enabled?: unknown }).enabled),
    });
    seen.add(kind);
  }

  for (const kind of POSTPROCESS_STACK_KINDS) {
    if (!seen.has(kind)) normalized.push({ kind, enabled: false });
  }
  return normalized;
}

export function movePostprocessStackLayer(
  stack: PostprocessStackLayer[],
  kind: PostprocessStackKind,
  targetIndex: number,
): PostprocessStackLayer[] {
  const normalized = normalizePostprocessEffectStack(stack);
  const fromIndex = normalized.findIndex(layer => layer.kind === kind);
  if (fromIndex < 0) return normalized;
  const next = normalized.filter(layer => layer.kind !== kind);
  const clampedIndex = Math.max(0, Math.min(next.length, Math.round(targetIndex)));
  next.splice(clampedIndex, 0, normalized[fromIndex]);
  return next;
}

export function updatePostprocessStackLayer(
  stack: PostprocessStackLayer[],
  kind: PostprocessStackKind,
  patch: Partial<Pick<PostprocessStackLayer, 'enabled'>>,
): PostprocessStackLayer[] {
  return normalizePostprocessEffectStack(stack).map(layer => (
    layer.kind === kind ? { ...layer, ...patch } : layer
  ));
}

export function isPostprocessLayerEnabled(
  postprocess: PostprocessConfig,
  kind: PostprocessStackKind,
): boolean {
  if (!postprocess.enabled) return false;
  return normalizePostprocessEffectStack(postprocess.effectStack, postprocess.effectMode)
    .some(layer => layer.kind === kind && layer.enabled);
}

export function getActivePostprocessStackLayers(
  postprocess: PostprocessConfig,
): PostprocessStackLayer[] {
  if (!postprocess.enabled) return [];
  return normalizePostprocessEffectStack(postprocess.effectStack, postprocess.effectMode)
    .filter(layer => layer.enabled);
}
