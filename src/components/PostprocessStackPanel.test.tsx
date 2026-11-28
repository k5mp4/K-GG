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

  it('shows the Cone layer as a normal draggable Effect Stack layer labeled 3D', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <PostprocessStackPanel />
      </LanguageProvider>,
    );

    expect(markup).toContain('data-effect-stack-panel');
    expect(markup).toContain('aria-label="Drag 3D"');
    expect(markup).not.toContain('aria-label="Drag Cone"');
    expect(markup).not.toContain('data-effect-stack-output-stage="cone"');
    expect(markup).not.toContain('Cone output');
  });

  it('does not show category chips', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <PostprocessStackPanel />
      </LanguageProvider>,
    );
    // Texture is now a layer row, so only the retired category names are checked.
    expect(markup).not.toMatch(/>(Transform|Structure)</);
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

describe('Effect Stack terminology', () => {
  const view = (overrides: Partial<Parameters<typeof buildEffectStackView>[0]> = {}) => buildEffectStackView({
    effectPipeline: STORE_DEFAULTS.effectPipeline,
    normalMapEnabled: false,
    imageGradientEnabled: false,
    programStatus: {},
    soloSnapshot: null,
    randomizing: false,
    previousOrder: [],
    ...overrides,
  });

  it('shows the on/off state only in the switch, not as a status word', () => {
    const allReady = view({ programStatus: Object.fromEntries(['stackCore', 'noiseStack', 'glassV2', 'glassTile', 'datamosh', 'texture', 'distortChroma', 'ice', 'threeD', 'stretch'].map(key => [key, 'ready'])) });
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <EffectStackPanelView view={allReady} actions={noopActions} />
      </LanguageProvider>,
    );
    expect(allReady.layers.some(layer => layer.status.notice)).toBe(false);
    expect(markup).not.toContain('effect-stack-row__status');
    expect(markup).toContain('role="switch"');
  });

  it('keeps a status word for states the switch cannot show', () => {
    const pipeline = {
      ...STORE_DEFAULTS.effectPipeline,
      effectStack: STORE_DEFAULTS.effectPipeline.effectStack.map(layer => layer.kind === 'glass' ? { ...layer, enabled: true } : layer),
    };
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <EffectStackPanelView view={view({ effectPipeline: pipeline })} actions={noopActions} />
      </LanguageProvider>,
    );
    const glassView = view({ effectPipeline: pipeline });
    expect(glassView.layers.find(layer => layer.kind === 'glass')?.status.notice).toBe(true);
    expect(markup.match(/effect-stack-row__status/g)?.length).toBe(glassView.layers.filter(layer => layer.status.notice).length);
    expect(markup).toContain('Preparing…');
  });

  it('does not show the developer Stack V2 label in the browser header', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <EffectStackPanelView view={view()} actions={noopActions} />
      </LanguageProvider>,
    );
    expect(markup).not.toContain('Stack V2');
  });
});

describe('Effect Stack accessibility', () => {
  const markup = () => renderToStaticMarkup(
    <LanguageProvider>
      <EffectStackPanelView
        view={buildEffectStackView({
          effectPipeline: { ...STORE_DEFAULTS.effectPipeline, selectedKind: 'glass' },
          normalMapEnabled: false,
          imageGradientEnabled: false,
          programStatus: {},
          soloSnapshot: null,
          randomizing: false,
          previousOrder: [],
        })}
        actions={noopActions}
      />
    </LanguageProvider>,
  );

  it('names every switch and solo button after its layer', () => {
    const html = markup();
    expect(html).toMatch(/role="switch"[^>]*aria-label="Enable Glass"/);
    expect(html).toContain('aria-label="Solo Glass"');
    expect(html).not.toMatch(/role="switch"[^>]*aria-label="(Enabled|Disabled)"/);
  });

  it('exposes the rows as a list that states the apply order, with one row in the Tab order', () => {
    const html = markup();
    expect(html).toContain('role="list" aria-label="Effect Stack layers, applied from top to bottom"');
    expect(html.match(/class="effect-stack-row__select" tabindex="0"/g)?.length).toBe(1);
    expect(html).toMatch(/class="effect-stack-row__select" tabindex="0" aria-current="true"/);
    expect(html).toContain('Applied from top to bottom');
  });
});

describe('Effect Stack row switch', () => {
  it('keeps a small ON/OFF text inside the row switch', () => {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <EffectStackPanelView
          view={buildEffectStackView({
            effectPipeline: STORE_DEFAULTS.effectPipeline,
            normalMapEnabled: false,
            imageGradientEnabled: false,
            programStatus: {},
            soloSnapshot: null,
            randomizing: false,
            previousOrder: [],
          })}
          actions={noopActions}
        />
      </LanguageProvider>,
    );
    expect(html).toMatch(/role="switch"[^>]*aria-label="Enable Noise"[^]*?text-\[7px\][^>]*>Off</);
  });
});
