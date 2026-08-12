export const SEAMLESS_MIN_BLEND_WIDTH = 0.02;
export const SEAMLESS_MAX_BLEND_WIDTH = 0.5;

export type SeamlessConfig = {
  enabled: boolean;
  /** Normalized width of the opposing-edge cross-fade band. */
  blendWidth: number;
};

export const DEFAULT_SEAMLESS: SeamlessConfig = {
  enabled: false,
  blendWidth: 0.25,
};

export function normalizeSeamlessConfig(value: unknown): SeamlessConfig {
  const raw = typeof value === 'object' && value !== null
    ? value as Partial<SeamlessConfig>
    : {};
  const blendWidth = typeof raw.blendWidth === 'number' && Number.isFinite(raw.blendWidth)
    ? Math.max(SEAMLESS_MIN_BLEND_WIDTH, Math.min(SEAMLESS_MAX_BLEND_WIDTH, raw.blendWidth))
    : DEFAULT_SEAMLESS.blendWidth;
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_SEAMLESS.enabled,
    blendWidth,
  };
}
