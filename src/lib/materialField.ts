import type { GradientConfig } from '../types/gradient';
import type { MaterialFieldConfig } from '../types/materialField';

/** Shader-side index for `gradient.fieldInput.source` (`u_mfInputSource`). */
export const MATERIAL_FIELD_INPUT_SOURCE_INDEX = { none: 0, thickness: 1, cracks: 2 } as const;

/**
 * Evaluated thickness is a relative optical distance in [0, 4]. The ramp input
 * divides by this fixed range instead of normalizing each frame, so colors do
 * not drift when the field moves.
 */
export const MATERIAL_FIELD_MAX_THICKNESS = 4;

function wrapTurn(value: number): number {
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
}

/**
 * Loop phase in turns for the shared field. `normalizedTime` is the Loop
 * Timing-remapped clock (`scene.autoTime`), so easing is applied once.
 * Integer cycles make the phase at 0 and 1 identical; the whole-cycle part is
 * discarded before the offset is added to keep that equality exact in floats.
 */
export function resolveMaterialPhase(normalizedTime: number, cycles: number, phase: number): number {
  const time = Number.isFinite(normalizedTime) ? normalizedTime : 0;
  const loops = Number.isFinite(cycles) ? Math.max(0, Math.round(cycles)) : 0;
  const offset = Number.isFinite(phase) ? phase : 0;
  return wrapTurn(wrapTurn(loops * time) + offset);
}

type FieldInputGradient = Pick<GradientConfig, 'fieldInput' | 'gradientType' | 'mesh'>;

/**
 * Whether the Gradient actually reads the shared field. The saved selection is
 * kept while Image Gradient protection or Mesh direct color makes it inert, so
 * returning to a normal ramp gradient restores it.
 */
export function isMaterialFieldInputActive(gradient: FieldInputGradient | undefined, imageGradientProtected: boolean): boolean {
  const input = gradient?.fieldInput;
  if (!input || input.source === 'none' || !(input.influence > 0)) return false;
  if (imageGradientProtected) return false;
  if ((gradient?.gradientType ?? 'linear') === 'mesh' && gradient?.mesh?.colorMode === 'direct') return false;
  return true;
}

export type MaterialFieldInputInactiveReason = 'none' | 'image-gradient' | 'mesh-direct' | null;

/** Explains why a selected input is inert; null means the input is in use. */
export function getMaterialFieldInputInactiveReason(
  gradient: FieldInputGradient,
  imageGradientProtected: boolean,
): MaterialFieldInputInactiveReason {
  const input = gradient.fieldInput;
  if (!input || input.source === 'none' || !(input.influence > 0)) return 'none';
  if (imageGradientProtected) return 'image-gradient';
  if ((gradient.gradientType ?? 'linear') === 'mesh' && gradient.mesh?.colorMode === 'direct') return 'mesh-direct';
  return null;
}

/** The field changes over time only through its periodic domain deformation. */
export function isMaterialFieldAnimated(field: MaterialFieldConfig): boolean {
  return field.morph > 0 && field.cycles > 0;
}

export type MaterialFieldUniforms = {
  /** Seed folded into a small hash-lattice coordinate (`u_mfSeedZ`). */
  seedZ: number;
  /** Seed-dependent domain offset in cells (`u_mfSeedOffset`). */
  seedOffset: [number, number];
  /** Base cells per screen height. */
  scale: number;
  thickness: number;
  thicknessVariation: number;
  cracks: number;
  warp: number;
  morph: number;
  /** Loop angle in radians, `2*pi*phase`. */
  angle: number;
};

/**
 * Folds the integer Seed into small, well-conditioned hash inputs. Large raw
 * Seeds would lose float precision inside the GPU hash.
 */
export function materialFieldSeedLattice(seed: number): { z: number; offset: [number, number] } {
  let hash = (Math.trunc(Number.isFinite(seed) ? seed : 0) ^ 0x9e3779b9) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35) >>> 0;
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return {
    z: (hash % 1021) + 0.5,
    offset: [((hash >>> 10) % 4096) / 64, ((hash >>> 20) % 4096) / 64],
  };
}

/** CPU-side preparation of the per-frame field constants. */
export function getMaterialFieldUniforms(field: MaterialFieldConfig, phaseTurns: number): MaterialFieldUniforms {
  const lattice = materialFieldSeedLattice(field.seed);
  return {
    seedZ: lattice.z,
    seedOffset: lattice.offset,
    scale: field.scale,
    thickness: field.thickness,
    thicknessVariation: field.thicknessVariation,
    cracks: field.cracks,
    warp: field.warp,
    morph: field.morph,
    angle: wrapTurn(phaseTurns) * Math.PI * 2,
  };
}
