import type { MessageKey } from '../../i18n/messages';

export type LeftTab = 'diffuse' | 'noise' | 'slit' | 'postprocess' | 'sandbox' | 'export' | 'preset';
export type LeftTabDefinition = { value: LeftTab; labelKey: MessageKey };

export const LEFT_TABS: LeftTabDefinition[] = [
  { value: 'diffuse', labelKey: 'effect.diffuse' },
  { value: 'noise', labelKey: 'effect.noise' },
  { value: 'slit', labelKey: 'effect.slit' },
  { value: 'postprocess', labelKey: 'effect.postprocess' },
  { value: 'sandbox', labelKey: 'effect.sandbox' },
  { value: 'export', labelKey: 'effect.export' },
  { value: 'preset', labelKey: 'effect.preset' },
];

export const TAB_ANIMATION_PREFIX: Partial<Record<LeftTab, string>> = {
  diffuse: 'diffuse.',
  noise: 'noiseDistortion.',
  slit: 'slitScan.',
  postprocess: 'postprocess.',
};
