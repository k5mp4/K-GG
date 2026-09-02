import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { getNoiseSeedField } from '../lib/noiseSeed';
import { useGradientStore } from '../store/gradientStore';
import { NoiseDistortionPanel } from './NoiseDistortionPanel';

const TYPE_ORDER = [
  'Fast Curl',
  'Curl (Legacy)',
  'Simplex',
  'fBm',
  'Aura Ridges',
  'Fractal Drift',
  'Domain Warp',
  'Seamless',
  'Voronoi',
  'Caustics',
  'Phasor Lines',
] as const;

describe('NoiseDistortionPanel', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('keeps the common controls in Amount, Scale, Seed order', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <NoiseDistortionPanel />
      </LanguageProvider>,
    );
    const position = (label: string) => markup.indexOf(`>${label}</label>`);

    expect(position('Type')).toBeLessThan(position('Amount'));
    expect(position('Amount')).toBeLessThan(position('Scale'));
    expect(position('Scale')).toBeLessThan(position('Seed'));
    expect(markup.match(/>Seed<\/label>/g)).toHaveLength(1);
  });

  it('groups Noise Types in the recommended quality and algorithm order', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <NoiseDistortionPanel />
      </LanguageProvider>,
    );
    const positions = TYPE_ORDER.map((label) => markup.lastIndexOf(`title="${label}"`));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it.each([
    ['simplex', 'noiseSeed'],
    ['curl', 'curlSeed'],
    ['fast_curl', 'curlSeed'],
  ] as const)('routes %s Seed through %s', (type, field) => {
    expect(getNoiseSeedField(type)).toBe(field);
  });
});
