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
  'Perlin',
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
    expect(markup).not.toContain('title="fBm"');
  });

  it.each([
    ['simplex', 'noiseSeed'],
    ['curl', 'curlSeed'],
    ['fast_curl', 'curlSeed'],
  ] as const)('routes %s Seed through %s', (type, field) => {
    expect(getNoiseSeedField(type)).toBe(field);
  });

  it('shows the Perlin Roughness/Sharpness/Layer Mix controls only when Type is Perlin', () => {
    // renderToStaticMarkup drives React's SSR snapshot, which zustand reads
    // from getInitialState() rather than the live getState() (see
    // node_modules/zustand/react.js useStore). Mutate getInitialState()
    // directly, matching the pattern PostprocessPanel.test.tsx already uses
    // for this same SSR quirk.
    const initialState = useGradientStore.getInitialState();
    const previousNoiseDistortion = initialState.noiseDistortion;
    try {
      initialState.noiseDistortion = { ...previousNoiseDistortion, type: 'perlin' };
      const perlinMarkup = renderToStaticMarkup(
        <LanguageProvider>
          <NoiseDistortionPanel />
        </LanguageProvider>,
      );
      expect(perlinMarkup).toContain('>Roughness</label>');
      expect(perlinMarkup).toContain('>Sharpness</label>');
      expect(perlinMarkup).toContain('>Layer Mix</label>');
      expect(perlinMarkup).toContain('>Octaves</label>');

      initialState.noiseDistortion = { ...previousNoiseDistortion, type: 'fbm' };
      const fbmMarkup = renderToStaticMarkup(
        <LanguageProvider>
          <NoiseDistortionPanel />
        </LanguageProvider>,
      );
      expect(fbmMarkup).not.toContain('>Roughness</label>');

      initialState.noiseDistortion = { ...previousNoiseDistortion, type: 'simplex' };
      const simplexMarkup = renderToStaticMarkup(
        <LanguageProvider>
          <NoiseDistortionPanel />
        </LanguageProvider>,
      );
      expect(simplexMarkup).not.toContain('>Roughness</label>');

      initialState.noiseDistortion = { ...previousNoiseDistortion, type: 'ridged_fbm' };
      const ridgedMarkup = renderToStaticMarkup(
        <LanguageProvider>
          <NoiseDistortionPanel />
        </LanguageProvider>,
      );
      expect(ridgedMarkup).not.toContain('>Roughness</label>');
    } finally {
      initialState.noiseDistortion = previousNoiseDistortion;
    }
  });
});
