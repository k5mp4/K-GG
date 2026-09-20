import { describe, expect, it } from 'vitest';
import { generateGradientFromUi, type GradientGeneratorUiParams } from './gradientGenerator';

const BASE_PARAMS: GradientGeneratorUiParams = {
  algorithm: 'perceptual',
  baseColor: '#808080',
  colorIntensity: 0.5,
  brightness: 0.5,
  contrast: 0.5,
  family: 'soft',
  accentPosition: 0.5,
  accentWidth: 0.2,
  stopCount: 5,
};

describe('gradient generator UI mapping', () => {
  it('maps black, white and gray base colors into safe perceptual gradients', () => {
    for (const baseColor of ['#000000', '#FFFFFF', '#808080']) {
      const stops = generateGradientFromUi({ ...BASE_PARAMS, baseColor });
      expect(stops).toHaveLength(5);
      stops.forEach((stop) => expect(stop.color).toMatch(/^#[0-9A-F]{6}$/));
    }
  });

  it('keeps both algorithms within the requested stop range', () => {
    for (const algorithm of ['cubehelix', 'perceptual'] as const) {
      const stops = generateGradientFromUi({ ...BASE_PARAMS, algorithm, stopCount: 3 });
      expect(stops).toHaveLength(3);
      expect(stops[0].position).toBe(0);
      expect(stops.at(-1)?.position).toBe(1);
    }
  });
});
