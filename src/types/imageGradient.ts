export type ImageGradientChannel = 'luminance' | 'red' | 'green' | 'blue';

export type ImageGradientConfig = {
  enabled: boolean;
  channel: ImageGradientChannel;
};

export const IMAGE_GRADIENT_DEFAULTS: ImageGradientConfig = {
  enabled: false,
  channel: 'luminance',
};
