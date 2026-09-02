import type { NoiseDistortionConfig } from '../types/distortion';

export function getNoiseSeedField(type: NoiseDistortionConfig['type']): 'curlSeed' | 'noiseSeed' {
  return type === 'curl' || type === 'fast_curl' ? 'curlSeed' : 'noiseSeed';
}
