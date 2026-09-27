import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { DEFAULT_CONE_VIEW, type ConeShape } from '../types/coneView';
import { ConeViewPanel } from './ConeViewPanel';

// Server rendering reads the store's initial state (zustand useStore), so
// the shape is set there for the duration of one render.
function renderShape(shape: ConeShape): string {
  const initialState = useGradientStore.getInitialState();
  const previousConeView = initialState.coneView;
  initialState.coneView = { ...DEFAULT_CONE_VIEW, shape };
  try {
    return renderToStaticMarkup(
      <LanguageProvider>
        <ConeViewPanel />
      </LanguageProvider>,
    );
  } finally {
    initialState.coneView = previousConeView;
  }
}

/** Slider labels rendered as element text, e.g. `>Bend<`. */
function hasLabel(markup: string, label: string): boolean {
  return markup.includes(`>${label}<`);
}

describe('ConeViewPanel shape controls', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('shows the Torus controls and not the Cone-only Depth and Rotation', () => {
    const markup = renderShape('torus');
    for (const label of ['Bend', 'Ring Repeat', 'Twist', 'Spin']) {
      expect(hasLabel(markup, label), label).toBe(true);
    }
    expect(hasLabel(markup, 'Depth')).toBe(false);
    expect(hasLabel(markup, 'Rotation')).toBe(false);
    // Rotation is the torus camera roll.
    expect(hasLabel(markup, 'Camera Roll')).toBe(true);
  });

  it('keeps Depth and Rotation for the Cone', () => {
    const markup = renderShape('cone');
    expect(hasLabel(markup, 'Depth')).toBe(true);
    expect(hasLabel(markup, 'Rotation')).toBe(true);
    expect(hasLabel(markup, 'Bend')).toBe(false);
  });
});
