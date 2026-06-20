import type { DiffuseConfig } from '../types/distortion';

export function withAnimatedDiffuseSeed(diffuse: DiffuseConfig, frameIndex: number): DiffuseConfig {
  if (!diffuse.seedAnimEnabled) return diffuse;
  return {
    ...diffuse,
    seed: diffuse.seed + Math.max(0, Math.floor(frameIndex)),
  };
}
