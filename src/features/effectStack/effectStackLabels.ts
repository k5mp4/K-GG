import type { EffectStackKind } from '../../types/distortion';
import type { MessageKey } from '../../i18n/messages';

/** Display names of the Effect Stack layers, shared by the column, rail and window. */
export const EFFECT_STACK_LABELS: Record<EffectStackKind, string> = {
  diffuse: 'Diffuse',
  noise: 'Noise',
  slit: 'Slit',
  stretch: 'Stretch',
  distort: 'Distort',
  mirror: 'Mirror',
  kaleidoscope: 'Kaleidoscope',
  voronoi: 'Voronoi',
  glass: 'Glass',
  glassTile: 'GlassTile',
  datamosh: 'Datamosh',
  cone: '3D',
  texture: 'Texture',
  distortChroma: 'Distort Chroma',
  ice: 'Ice',
};

/** Short names for the icon rail; the full name stays in the tooltip and accessible name. */
export const EFFECT_STACK_RAIL_ABBREVIATIONS: Record<EffectStackKind, string> = {
  diffuse: 'DF',
  noise: 'NS',
  slit: 'SL',
  stretch: 'ST',
  distort: 'DS',
  mirror: 'MR',
  kaleidoscope: 'KL',
  voronoi: 'VR',
  glass: 'GL',
  glassTile: 'GT',
  datamosh: 'DM',
  cone: '3D',
  texture: 'TX',
  distortChroma: 'DC',
  ice: 'IC',
};

/** Message key of the two-sentence role description shown when a rail icon stretches open. */
export function effectDescriptionKey(kind: EffectStackKind): MessageKey {
  return `stack.description.${kind}` as MessageKey;
}
