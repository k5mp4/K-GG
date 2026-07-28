import type { ColorStop, OpacityStop, RampColorMode, RampInterpolation } from '../types/gradient';
import { getColorAtPosition, getOpacityAtPosition } from './gradientRampUtils';

export type GradientPreviewStyle = {
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#808080';
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

/**
 * Build a CSS preview without putting background-size syntax inside
 * background-image. That distinction keeps transparent previews valid in all
 * browsers and prevents the whole color layer from falling back to black.
 */
export function buildGradientPreviewStyle(
  stops: ColorStop[],
  opacityStops: OpacityStop[] | undefined,
  colorMode: RampColorMode,
  interpolation: RampInterpolation,
  variable: number,
): GradientPreviewStyle {
  if (stops.length === 0) {
    return {
      backgroundImage: 'linear-gradient(90deg, #555, #888)',
      backgroundSize: '100% 100%',
      backgroundPosition: '0 0',
      backgroundRepeat: 'no-repeat',
    };
  }

  const colors = Array.from({ length: 18 }, (_, index) => {
    const t = index / 17;
    return hexToRgba(
      getColorAtPosition(stops, t, interpolation, colorMode, variable),
      getOpacityAtPosition(opacityStops, t),
    );
  });
  const colorLayer = `linear-gradient(90deg, ${colors.map((color, index) => `${color} ${(index / 17) * 100}%`).join(', ')})`;
  const checkerLayer = 'repeating-conic-gradient(#5b5b5b 0 25%, #414141 0 50%)';

  return {
    backgroundImage: `${colorLayer}, ${checkerLayer}`,
    backgroundSize: '100% 100%, 8px 8px',
    backgroundPosition: '0 0, 0 0',
    backgroundRepeat: 'no-repeat, repeat',
  };
}
