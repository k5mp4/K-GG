import type { ImageGradientChannel } from '../types/imageGradient';

export function imageGradientChannelValue(
  [red, green, blue]: readonly [number, number, number],
  channel: ImageGradientChannel,
): number {
  if (channel === 'red') return red;
  if (channel === 'green') return green;
  if (channel === 'blue') return blue;
  return red * 0.299 + green * 0.587 + blue * 0.114;
}

/** Returns the centered UV transform used by the shader's Cover sampling. */
export function coverImageUv(
  [u, v]: readonly [number, number],
  imageWidth: number,
  imageHeight: number,
  outputWidth: number,
  outputHeight: number,
): [number, number] {
  const imageAspect = imageWidth / Math.max(imageHeight, 1);
  const outputAspect = outputWidth / Math.max(outputHeight, 1);
  if (imageAspect > outputAspect) {
    const scale = outputAspect / imageAspect;
    return [0.5 + (u - 0.5) * scale, v];
  }
  const scale = imageAspect / outputAspect;
  return [u, 0.5 + (v - 0.5) * scale];
}
