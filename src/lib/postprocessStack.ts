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
  'glassV2',
] as const satisfies readonly PostprocessStackKind[];

const STACK_KIND_SET = new Set<string>([
  ...POSTPROCESS_STACK_KINDS,
  'glass',
]);
const POSTPROCESS_EFFECT_MODE_SET = new Set<string>([
  ...POSTPROCESS_STACK_KINDS,
  'particles',
]);

function normalizePostprocessStackKind(value: unknown): PostprocessStackKind | null {
  if (value === 'glass') return 'glassV2';
  if (typeof value !== 'string' || !STACK_KIND_SET.has(value)) return null;
  return value as PostprocessStackKind;
}

export function normalizePostprocessEffectMode(
  value: unknown,
  fallback: PostprocessEffectMode = 'distort',
): PostprocessEffectMode {
  if (value === 'glass') return 'glassV2';
  if (typeof value === 'string' && POSTPROCESS_EFFECT_MODE_SET.has(value)) {
    return value as PostprocessEffectMode;
  }
  return fallback === 'glass' ? 'glassV2' : fallback;
}

export function isPostprocessStackKind(value: unknown): value is PostprocessStackKind {
  return normalizePostprocessStackKind(value) !== null;
}

export function createDefaultPostprocessStack(
  activeKind: PostprocessEffectMode = 'distort',
): PostprocessStackLayer[] {
  const normalizedActiveKind = normalizePostprocessEffectMode(activeKind);
  return POSTPROCESS_STACK_KINDS.map(kind => ({
    kind,
    enabled: kind === normalizedActiveKind,
  }));
}

export function normalizePostprocessEffectStack(
  stack: unknown,
  legacyMode: PostprocessEffectMode = 'distort',
): PostprocessStackLayer[] {
  if (!Array.isArray(stack)) {
    return createDefaultPostprocessStack(normalizePostprocessEffectMode(legacyMode));
  }

  const seen = new Set<PostprocessStackKind>();
  const normalized: PostprocessStackLayer[] = [];
  for (const rawLayer of stack) {
    if (typeof rawLayer !== 'object' || rawLayer === null) continue;
    const kind = normalizePostprocessStackKind((rawLayer as { kind?: unknown }).kind);
    if (!kind) continue;
    const enabled = Boolean((rawLayer as { enabled?: unknown }).enabled);
    const existing = normalized.find(layer => layer.kind === kind);
    if (existing) {
      existing.enabled ||= enabled;
      continue;
    }
    normalized.push({
      kind,
      enabled,
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
  const normalizedKind = normalizePostprocessStackKind(kind);
  if (!normalizedKind) return normalized;
  const fromIndex = normalized.findIndex(layer => layer.kind === normalizedKind);
  if (fromIndex < 0) return normalized;
  const next = normalized.filter(layer => layer.kind !== normalizedKind);
  const clampedIndex = Math.max(0, Math.min(next.length, Math.round(targetIndex)));
  next.splice(clampedIndex, 0, normalized[fromIndex]);
  return next;
}

export function updatePostprocessStackLayer(
  stack: PostprocessStackLayer[],
  kind: PostprocessStackKind,
  patch: Partial<Pick<PostprocessStackLayer, 'enabled'>>,
): PostprocessStackLayer[] {
  const normalizedKind = normalizePostprocessStackKind(kind);
  if (!normalizedKind) return normalizePostprocessEffectStack(stack);
  return normalizePostprocessEffectStack(stack).map(layer => (
    layer.kind === normalizedKind ? { ...layer, ...patch } : layer
  ));
}

export function isPostprocessLayerEnabled(
  postprocess: PostprocessConfig,
  kind: PostprocessStackKind,
): boolean {
  if (!postprocess.enabled) return false;
  const normalizedKind = normalizePostprocessStackKind(kind);
  if (!normalizedKind) return false;
  return normalizePostprocessEffectStack(postprocess.effectStack, postprocess.effectMode)
    .some(layer => layer.kind === normalizedKind && layer.enabled);
}

export function getActivePostprocessStackLayers(
  postprocess: PostprocessConfig,
): PostprocessStackLayer[] {
  if (!postprocess.enabled) return [];
  return normalizePostprocessEffectStack(postprocess.effectStack, postprocess.effectMode)
    .filter(layer => layer.enabled);
}
