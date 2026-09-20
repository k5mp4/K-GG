import type { ParameterLimitKey } from '../../packages/kgg-control/src/parameterLimits';
import type { DiffuseMode } from '../types/distortion';

export * from '../../packages/kgg-control/src/parameterLimits';

export function getDiffuseGrainParameterLimitKey(mode: DiffuseMode | undefined): ParameterLimitKey {
  switch (mode) {
    case 'dither':
      return 'diffuse.ditherGrain';
    case 'halftone':
      return 'diffuse.halftoneGrain';
    case 'ascii':
      return 'diffuse.asciiGrain';
    default:
      return 'diffuse.grain';
  }
}
