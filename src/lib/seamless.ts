import {
  normalizeSeamlessConfig,
  type SeamlessConfig,
} from '../types/seamless';

function raisedCosineBlend(distance: number, blendWidth: number): number {
  const t = Math.max(0, Math.min(1, distance / Math.max(blendWidth, Number.EPSILON)));
  // 0.5 at the outermost pixel and 0 at the inner edge of the band.
  return 0.25 * (1 + Math.cos(Math.PI * t));
}

function blendAxisInto(
  source: Uint8ClampedArray,
  output: Uint8ClampedArray,
  width: number,
  height: number,
  blendWidth: number,
  axis: 'x' | 'y',
): void {
  output.set(source);
  const axisSize = axis === 'x' ? width : height;
  if (axisSize <= 1) return;

  for (let line = 0; line < (axis === 'x' ? height : width); line += 1) {
    for (let coordinate = 0; coordinate < axisSize; coordinate += 1) {
      const edge = Math.min(coordinate, axisSize - 1 - coordinate);
      const normalized = edge / axisSize;
      if (normalized >= blendWidth) continue;

      const x = axis === 'x' ? coordinate : line;
      const y = axis === 'x' ? line : coordinate;
      const oppositeX = axis === 'x' ? axisSize - 1 - coordinate : line;
      const oppositeY = axis === 'y' ? axisSize - 1 - coordinate : line;
      const sourceIndex = (y * width + x) * 4;
      const oppositeIndex = (oppositeY * width + oppositeX) * 4;
      const weight = raisedCosineBlend(normalized, blendWidth);
      for (let channel = 0; channel < 4; channel += 1) {
        const value = source[sourceIndex + channel]
          + (source[oppositeIndex + channel] - source[sourceIndex + channel]) * weight;
        output[sourceIndex + channel] = value;
      }
    }
  }
}

function blendAxis(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  blendWidth: number,
  axis: 'x' | 'y',
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(source.length);
  blendAxisInto(source, output, width, height, blendWidth, axis);
  return output;
}

/**
 * CPU reference implementation for full-frame and tiled export.
 *
 * Each axis is processed independently. Pairing the two edge bands with a
 * symmetric raised-cosine weight makes the opposing boundary pixels equal,
 * while keeping the transition soft enough for repeated texture use.
 */
export function applySeamlessToRgba(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  config: SeamlessConfig,
): Uint8ClampedArray {
  const normalized = normalizeSeamlessConfig(config);
  if (!normalized.enabled || width <= 0 || height <= 0) return new Uint8ClampedArray(source);
  if (source.length < width * height * 4) {
    throw new RangeError('Seamless source buffer is smaller than the requested image size');
  }

  const horizontal = blendAxis(source, width, height, normalized.blendWidth, 'x');
  return blendAxis(horizontal, width, height, normalized.blendWidth, 'y');
}

/** Applies the CPU reference pass to a 2D canvas in place. */
export function applySeamlessToCanvas(
  canvas: HTMLCanvasElement,
  config: SeamlessConfig,
): void {
  const normalized = normalizeSeamlessConfig(config);
  if (!normalized.enabled || canvas.width <= 0 || canvas.height <= 0) return;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Failed to create 2D context for Seamless processing');
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  // Keep the source ImageData plus one scratch frame instead of retaining both
  // axis results while processing a large tiled export.
  const scratch = new Uint8ClampedArray(image.data.length);
  blendAxisInto(image.data, scratch, canvas.width, canvas.height, normalized.blendWidth, 'x');
  blendAxisInto(scratch, image.data, canvas.width, canvas.height, normalized.blendWidth, 'y');
  context.putImageData(image, 0, 0);
}
