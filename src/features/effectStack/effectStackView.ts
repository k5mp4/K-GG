import {
  EFFECT_STACK_KINDS,
  canRenderV2Direct,
  isEffectStackLayerTemporarilyHidden,
  normalizeEffectStack,
  type EffectStackEnabledState,
} from '../../lib/effectPipeline';
import type { MessageKey } from '../../i18n/messages';
import type { EffectPipelineConfig, EffectStackKind } from '../../types/distortion';

/**
 * Serializable Effect Stack state shown by the panel. The main window builds
 * it from the document and renderer state; a native Effect Stack window
 * receives it as-is and renders the same panel from it.
 */

export type LazyProgramKey = 'stackCore' | 'noiseStack' | 'glassV2' | 'glassTile' | 'videoMotion' | 'stretch' | 'prism' | 'prismComposite' | 'normalMap' | 'blur' | 'particles';
export type LazyProgramStatus = 'loading' | 'ready' | 'failed' | 'fallback';

export type EffectStackLayerStatus = { labelKey: MessageKey; className: string };

export type EffectStackLayerView = {
  kind: EffectStackKind;
  enabled: boolean;
  status: EffectStackLayerStatus;
};

export type EffectStackView = {
  layers: EffectStackLayerView[];
  selectedKind: EffectStackKind;
  imageGradientEnabled: boolean;
  /** True while a randomized order animates; `previousOrder` is the order it started from. */
  randomizing: boolean;
  previousOrder: EffectStackKind[];
};

export type EffectStackActions = {
  select: (kind: EffectStackKind, solo: boolean) => void;
  toggle: (kind: EffectStackKind, enabled: boolean) => void;
  move: (kind: EffectStackKind, targetIndex: number) => void;
  randomize: () => void;
  prefetch: (kind: EffectStackKind) => void;
};

export type SoloSnapshot = {
  targetKind: EffectStackKind;
  enabledState: EffectStackEnabledState;
};

export type EffectStackViewInput = {
  effectPipeline: EffectPipelineConfig;
  normalMapEnabled: boolean;
  imageGradientEnabled: boolean;
  programStatus: Partial<Record<LazyProgramKey, LazyProgramStatus>>;
  soloSnapshot: SoloSnapshot | null;
  randomizing: boolean;
  previousOrder: EffectStackKind[];
};

const CORE_EFFECTS = new Set<EffectStackKind>([
  'diffuse', 'noise', 'slit', 'distort', 'mirror', 'kaleidoscope', 'voronoi', 'cone',
]);
const IMAGE_GRADIENT_PROTECTED_EFFECTS = new Set<EffectStackKind>([
  'stretch', 'distort', 'mirror', 'kaleidoscope', 'voronoi', 'glass', 'glassTile', 'cone',
]);

export function isEffectStackKind(value: unknown): value is EffectStackKind {
  return typeof value === 'string' && (EFFECT_STACK_KINDS as readonly string[]).includes(value);
}

function programKeyForEffect(kind: EffectStackKind): LazyProgramKey {
  if (kind === 'noise') return 'noiseStack';
  if (CORE_EFFECTS.has(kind)) return 'stackCore';
  if (kind === 'glass') return 'glassV2';
  if (kind === 'glassTile') return 'glassTile';
  if (kind === 'videoMotion') return 'videoMotion';
  return 'stretch';
}

function programStatusLabel(status: LazyProgramStatus | undefined, enabled: boolean): EffectStackLayerStatus {
  if (!enabled) return { labelKey: 'stack.status.off', className: 'text-cream/40' };
  if (status === 'loading') return { labelKey: 'stack.status.loading', className: 'text-amber-300' };
  if (status === 'failed') return { labelKey: 'stack.status.unavailable', className: 'text-red-300' };
  if (status === 'fallback') return { labelKey: 'stack.status.fallback', className: 'text-cyan-300' };
  if (status === 'ready') return { labelKey: 'stack.status.applied', className: 'text-emerald-300' };
  return { labelKey: 'stack.status.preparing', className: 'text-amber-300' };
}

function layerStatus(kind: EffectStackKind, enabled: boolean, input: EffectStackViewInput): EffectStackLayerStatus {
  const { soloSnapshot } = input;
  if (soloSnapshot && isEffectStackLayerTemporarilyHidden(kind, enabled, soloSnapshot.targetKind, soloSnapshot.enabledState)) {
    return { labelKey: 'stack.status.stay', className: 'text-amber-300' };
  }
  if (input.imageGradientEnabled && IMAGE_GRADIENT_PROTECTED_EFFECTS.has(kind)) {
    return { labelKey: 'stack.status.protected', className: 'text-amber-300' };
  }
  // Diffuse-only V2 is drawn directly by the Bootstrap generator and never
  // requests stackCore, so it is genuinely applied without a lazy-program
  // ready event.
  if (enabled && kind === 'diffuse' && canRenderV2Direct(input.effectPipeline, input.normalMapEnabled)) {
    return { labelKey: 'stack.status.applied', className: 'text-emerald-300' };
  }
  return programStatusLabel(input.programStatus[programKeyForEffect(kind)], enabled);
}

export function buildEffectStackView(input: EffectStackViewInput): EffectStackView {
  return {
    layers: normalizeEffectStack(input.effectPipeline.effectStack).map(layer => ({
      kind: layer.kind,
      enabled: layer.enabled,
      status: layerStatus(layer.kind, layer.enabled, input),
    })),
    selectedKind: input.effectPipeline.selectedKind,
    imageGradientEnabled: input.imageGradientEnabled,
    randomizing: input.randomizing,
    previousOrder: input.previousOrder,
  };
}
