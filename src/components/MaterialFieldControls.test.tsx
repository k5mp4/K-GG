import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { normalizeMeshGradientConfig, type GradientConfig } from '../types/gradient';
import { MaterialFieldControls } from './MaterialFieldControls';

// Server rendering reads the store's initial state, so the scenario is set
// there for the duration of one render.
function renderWith(gradient: Partial<GradientConfig>, imageGradientEnabled = false): string {
  const initialState = useGradientStore.getInitialState();
  const previousGradient = initialState.gradient;
  const previousImageGradient = initialState.imageGradient;
  initialState.gradient = { ...previousGradient, ...gradient };
  initialState.imageGradient = { ...previousImageGradient, enabled: imageGradientEnabled };
  try {
    return renderToStaticMarkup(
      <LanguageProvider>
        <MaterialFieldControls />
      </LanguageProvider>,
    );
  } finally {
    initialState.gradient = previousGradient;
    initialState.imageGradient = previousImageGradient;
  }
}

describe('MaterialFieldControls', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('offers the structure input without an influence slider while it is off', () => {
    const markup = renderWith({ fieldInput: { source: 'none', influence: 1 } });
    expect(markup).toContain('data-material-field-controls');
    expect(markup).toContain('Structure Input');
    expect(markup).not.toContain('Structure Influence');
    expect(markup).not.toContain('data-material-field-inactive');
    // The shared structure editor is available even when the Gradient does not use it.
    expect(markup).toContain('Shared Structure');
  });

  it('shows the influence for a selected source', () => {
    const markup = renderWith({ fieldInput: { source: 'cracks', influence: 0.5 } });
    expect(markup).toContain('Structure Influence');
    expect(markup).not.toContain('data-material-field-inactive');
  });

  it('explains, without clearing the setting, why Image Gradient or Mesh direct color disables it', () => {
    const imageMarkup = renderWith({ fieldInput: { source: 'thickness', influence: 1 } }, true);
    expect(imageMarkup).toContain('data-material-field-inactive="image-gradient"');
    expect(imageMarkup).toContain('Structure Influence');

    const mesh = normalizeMeshGradientConfig(undefined);
    const directMarkup = renderWith({ gradientType: 'mesh', mesh: { ...mesh, colorMode: 'direct' }, fieldInput: { source: 'thickness', influence: 1 } });
    expect(directMarkup).toContain('data-material-field-inactive="mesh-direct"');

    const rampMarkup = renderWith({ gradientType: 'mesh', mesh: { ...mesh, colorMode: 'ramp' }, fieldInput: { source: 'thickness', influence: 1 } });
    expect(rampMarkup).not.toContain('data-material-field-inactive');
  });
});
