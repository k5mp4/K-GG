import { describe, expect, it } from 'vitest';
import { buildGradientPreviewStyle } from './gradientPreview';

const stops = [
  { position: 0, color: '#D11402' },
  { position: 1, color: '#E5DABD' },
];

describe('buildGradientPreviewStyle', () => {
  it('keeps the sampled color layer visible with a valid checker layer', () => {
    const style = buildGradientPreviewStyle(stops, undefined, 'rgb', 'ease', 0);

    expect(style.backgroundImage).toContain('linear-gradient');
    expect(style.backgroundImage).toContain('rgba(209, 20, 2, 1.000)');
    expect(style.backgroundImage).toContain('repeating-conic-gradient');
    expect(style.backgroundImage).not.toContain('/ 8px 8px');
    expect(style.backgroundSize).toBe('100% 100%, 8px 8px');
    expect(style.backgroundRepeat).toBe('no-repeat, repeat');
  });

  it('uses a safe neutral preview when there are no stops', () => {
    const style = buildGradientPreviewStyle([], undefined, 'rgb', 'ease', 0);

    expect(style.backgroundImage).toBe('linear-gradient(90deg, #555, #888)');
    expect(style.backgroundSize).toBe('100% 100%');
  });
});
