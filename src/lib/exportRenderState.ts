import type { LatestState } from '../types/latestState';

/**
 * Mutable UI state is detached at export start. TexImageSource objects cannot
 * be structured-cloned, so their references are retained while all render
 * parameters, stack order, animation settings, and keyframes are copied.
 */
export function createExportStateSnapshot(state: LatestState): LatestState {
  const {
    sourceImageCanvas,
    imageGradientSource,
    imageMaskSource,
    ...serializableState
  } = state;
  return {
    ...structuredClone(serializableState),
    sourceImageCanvas,
    imageGradientSource,
    imageMaskSource,
  };
}
