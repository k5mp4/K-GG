import type { MessageKey } from '../../i18n/messages';
import type { EffectStackKind } from '../../types/distortion';
import { EFFECT_STACK_LABELS } from '../effectStack/effectStackLabels';

/**
 * Property modules of the left panel. The values stay stable because the
 * control runtime (MCP / OSC) addresses modules by them.
 */
export type LeftTab = 'diffuse' | 'noise' | 'slit' | 'postprocess' | 'sandbox' | 'export' | 'preset';
export type LeftTabDefinition = { value: LeftTab; labelKey: MessageKey };

/** Module order of the sliding left panel. */
export const LEFT_TABS: LeftTabDefinition[] = [
  { value: 'diffuse', labelKey: 'effect.diffuse' },
  { value: 'noise', labelKey: 'effect.noise' },
  { value: 'slit', labelKey: 'effect.slit' },
  { value: 'postprocess', labelKey: 'effect.postprocess' },
  { value: 'sandbox', labelKey: 'effect.sandbox' },
  { value: 'export', labelKey: 'effect.export' },
  { value: 'preset', labelKey: 'effect.preset' },
];

/** Modules that edit an Effect Stack layer; they are reached from the Effect Stack only. */
export const LAYER_TABS: readonly LeftTab[] = ['diffuse', 'noise', 'slit', 'postprocess'];

/** Modes shown as TOP bar tabs next to the editing-layer entry. */
export const TOP_BAR_TABS: LeftTabDefinition[] = LEFT_TABS.filter(tab => !LAYER_TABS.includes(tab.value));

export function isLayerTab(tab: LeftTab): boolean {
  return LAYER_TABS.includes(tab);
}

const LAYER_TAB_BY_KIND: Partial<Record<EffectStackKind, LeftTab>> = {
  diffuse: 'diffuse',
  noise: 'noise',
  slit: 'slit',
};

/** The property module that edits an Effect Stack layer. */
export function getLayerTab(kind: EffectStackKind): LeftTab {
  return LAYER_TAB_BY_KIND[kind] ?? 'postprocess';
}

const LAYER_KIND_BY_TAB: Partial<Record<LeftTab, EffectStackKind>> = {
  diffuse: 'diffuse',
  noise: 'noise',
  slit: 'slit',
};

/**
 * The layer the TOP bar names as being edited: the selected Effect Stack layer,
 * unless the open module edits another layer (for example a module chosen
 * through the control runtime).
 */
export function resolveEditingLayer(leftTab: LeftTab, selectedKind: EffectStackKind): { kind: EffectStackKind; tab: LeftTab; label: string } {
  const tabKind = LAYER_KIND_BY_TAB[leftTab];
  const kind = isLayerTab(leftTab) && getLayerTab(selectedKind) !== leftTab && tabKind ? tabKind : selectedKind;
  return { kind, tab: getLayerTab(kind), label: EFFECT_STACK_LABELS[kind] };
}

export const TAB_ANIMATION_PREFIX: Partial<Record<LeftTab, string>> = {
  diffuse: 'diffuse.',
  noise: 'noiseDistortion.',
  slit: 'slitScan.',
  postprocess: 'postprocess.',
};
