import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { DEFAULT_ICE } from '../types/ice';
import { IcePanel } from './IcePanel';

function render(ice = DEFAULT_ICE, imageGradientEnabled = false): string {
  const initial = useGradientStore.getInitialState();
  const previousIce = initial.ice;
  const previousImage = initial.imageGradient;
  initial.ice = ice;
  initial.imageGradient = { ...previousImage, enabled: imageGradientEnabled };
  try {
    return renderToStaticMarkup(<LanguageProvider><IcePanel /></LanguageProvider>);
  } finally {
    initial.ice = previousIce;
    initial.imageGradient = previousImage;
  }
}

describe('IcePanel', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('groups the shared structure, optics, and motion', () => {
    const markup = render({ ...DEFAULT_ICE, enabled: true });
    expect(markup).toContain('data-ice-panel');
    expect(markup).toContain('data-material-field-structure');
    for (const label of ['Structure (shared)', 'Optics', 'Motion', 'Refraction', 'IOR', 'Absorption', 'Scattering', 'Body Color', 'Light Cycles', 'Shared by Gradient and Ice']) {
      expect(markup, label).toContain(label);
    }
    expect(markup).not.toContain('data-ice-inactive');
  });

  it('explains why Ice is not applied without clearing the settings', () => {
    expect(render(DEFAULT_ICE)).toContain('data-ice-inactive="off"');
    expect(render({ ...DEFAULT_ICE, enabled: true }, true)).toContain('data-ice-inactive="image-gradient"');
  });
});
