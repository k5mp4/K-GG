export type ImageGradientChannel = 'luminance' | 'red' | 'green' | 'blue';

export type ImageGradientConfig = {
  enabled: boolean;
  channel: ImageGradientChannel;
  /** 画像チャンネル値からアンカー配色値へ寄せる比率（0–1） */
  anchorInfluence: number;
};

export const IMAGE_GRADIENT_DEFAULTS: ImageGradientConfig = {
  enabled: false,
  channel: 'luminance',
  anchorInfluence: 0.5,
};

const IMAGE_GRADIENT_CHANNELS: readonly ImageGradientChannel[] = ['luminance', 'red', 'green', 'blue'];

/** Presetなどの非信頼な永続データを現在の設定形式へ正規化する。 */
export function normalizeImageGradientConfig(
  value: Partial<ImageGradientConfig> | undefined,
  missingAnchorInfluence = IMAGE_GRADIENT_DEFAULTS.anchorInfluence,
): ImageGradientConfig {
  const anchorInfluence = value?.anchorInfluence;
  return {
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : IMAGE_GRADIENT_DEFAULTS.enabled,
    channel: IMAGE_GRADIENT_CHANNELS.includes(value?.channel as ImageGradientChannel)
      ? value!.channel!
      : IMAGE_GRADIENT_DEFAULTS.channel,
    anchorInfluence: typeof anchorInfluence === 'number' && Number.isFinite(anchorInfluence)
      ? Math.min(1, Math.max(0, anchorInfluence))
      : missingAnchorInfluence,
  };
}
