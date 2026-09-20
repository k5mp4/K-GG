import { clampParameter, getParameterDefault, getParameterLimit } from '../lib/parameterLimits';

export const SEAMLESS_MIN_BLEND_WIDTH = getParameterLimit('seamless.blendWidth').min;
export const SEAMLESS_MAX_BLEND_WIDTH = getParameterLimit('seamless.blendWidth').max;

export type SeamlessConfig = {
  enabled: boolean;
  /** Normalized width of the opposing-edge cross-fade band. */
  blendWidth: number;
};

export const DEFAULT_SEAMLESS: SeamlessConfig = {
  enabled: false,
  blendWidth: getParameterDefault('seamless.blendWidth'),
};

export function normalizeSeamlessConfig(value: unknown): SeamlessConfig {
  const raw = typeof value === 'object' && value !== null
    ? value as Partial<SeamlessConfig>
    : {};
  const blendWidth = clampParameter(
    raw.blendWidth,
    DEFAULT_SEAMLESS.blendWidth,
    getParameterLimit('seamless.blendWidth'),
  );
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_SEAMLESS.enabled,
    blendWidth,
  };
}
