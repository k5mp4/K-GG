import type { EffectStackKind } from '../../types/distortion';

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
