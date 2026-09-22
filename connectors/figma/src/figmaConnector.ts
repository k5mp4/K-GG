import type { PngDimensions } from '../../../packages/kgg-image/src';

export function getFigmaImageBounds(center: { x: number; y: number }, dimensions: PngDimensions) {
  return {
    x: center.x - dimensions.width / 2,
    y: center.y - dimensions.height / 2,
    width: dimensions.width,
    height: dimensions.height,
  };
}

export function safeFigmaNodeName(value: string): string {
  const name = value
    // This range is intentionally matched to remove ASCII control characters from Figma node names.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, 100);
  return name || 'K-GG Image';
}
