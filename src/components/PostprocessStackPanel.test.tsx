import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { PostprocessStackPanel } from './PostprocessStackPanel';
import { EffectStackPanelView } from './EffectStackPanelView';
import { buildEffectStackView } from '../features/effectStack/effectStackView';
import { STORE_DEFAULTS } from '../store/documentModel';

const noopActions = { select: () => {}, toggle: () => {}, move: () => {}, randomize: () => {}, prefetch: () => {} };

describe('PostprocessStackPanel Cone layer', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('shows Cone as a normal draggable Effect Stack layer', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <PostprocessStackPanel />
      </LanguageProvider>,
    );

    expect(markup).toContain('data-effect-stack-panel');
    expect(markup).toContain('aria-label="Drag Cone"');
    expect(markup).not.toContain('data-effect-stack-output-stage="cone"');
    expect(markup).not.toContain('Cone output');
  });

  it('does not show category chips', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <PostprocessStackPanel />
      </LanguageProvider>,
    );
    expect(markup).not.toMatch(/>(Texture|Transform|Structure)</);
  });
});

describe('Effect Stack window layout', () => {
  it('keeps the header fixed and scrolls the rows inside the window', () => {
    const view = buildEffectStackView({
      effectPipeline: STORE_DEFAULTS.effectPipeline,
      normalMapEnabled: false,
      imageGradientEnabled: false,
      programStatus: {},
      soloSnapshot: null,
      randomizing: false,
      previousOrder: [],
    });
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <EffectStackPanelView view={view} actions={noopActions} variant="window" />
      </LanguageProvider>,
    );
    expect(markup).toContain('h-screen');
    expect(markup).toMatch(/id="kgg-effect-stack-content"[^>]*overflow-y-auto/);
    expect(markup).not.toContain('aria-expanded');
  });
});
