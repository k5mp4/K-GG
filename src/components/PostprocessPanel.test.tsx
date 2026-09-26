import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { updateEffectStackLayer } from '../lib/effectPipeline';
import { useGradientStore } from '../store/gradientStore';
import { PostprocessPanel } from './PostprocessPanel';

function renderPostprocessPanelWithLayerSelected(kind: 'cone' | 'stretch') {
  const initialState = useGradientStore.getInitialState();
  const previousEffectPipeline = initialState.effectPipeline;
  initialState.effectPipeline = {
    ...previousEffectPipeline,
    selectedKind: kind,
    effectStack: updateEffectStackLayer(previousEffectPipeline.effectStack, kind, { enabled: true }),
  };
  try {
    return renderToStaticMarkup(
      <LanguageProvider>
        <PostprocessPanel />
      </LanguageProvider>,
    );
  } finally {
    initialState.effectPipeline = previousEffectPipeline;
  }
}

describe('PostprocessPanel Video Motion integration', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('keeps Video Motion mounted in the Postprocess property surface', () => {
    const current = useGradientStore.getState().effectPipeline;
    useGradientStore.setState({
      effectPipeline: {
        ...current,
        selectedKind: 'videoMotion',
        effectStack: updateEffectStackLayer(current.effectStack, 'videoMotion', { enabled: true }),
      },
    });

    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <PostprocessPanel />
      </LanguageProvider>,
    );

    expect(markup).toContain('data-video-motion-panel');
    expect(markup).toContain('Choose Video');
    expect(markup).toContain('Motion Feedback');
    expect(markup).not.toContain('Motion Warp');
    expect(markup).not.toContain('Motion Datamosh');

    useGradientStore.setState({
      effectPipeline: {
        ...useGradientStore.getState().effectPipeline,
        selectedKind: 'glass',
      },
    });
    const otherLayerMarkup = renderToStaticMarkup(
      <LanguageProvider>
        <PostprocessPanel />
      </LanguageProvider>,
    );
    expect(otherLayerMarkup).toContain('data-video-motion-panel');
  });

  it('keeps the existing Cone controls available in the Postprocess property surface', () => {
    const markup = renderPostprocessPanelWithLayerSelected('cone');

    expect(markup).toContain('data-cone-settings="shown"');
    expect(markup).toContain('data-cone-view-panel');
    expect(markup).toContain('Mapping');
    expect(markup).toContain('Flow Cycles');
    expect(markup).not.toContain('data-postprocess-master-toggle');
  });

  it('shows the Stretch parameters when Stretch is selected in the Effect Stack', () => {
    const markup = renderPostprocessPanelWithLayerSelected('stretch');

    expect(markup).toContain('data-stretch-settings');
    for (const label of ['Stretch', 'Scan Position', 'Band Height', 'Height Variance', 'Variation', 'Seed', 'Glow Intensity']) {
      expect(markup).toContain(label);
    }
    expect(markup).toContain('Edit Layer');
    // Stretch is a Postprocess layer: the Effect Stack owns its ON/OFF, so the
    // module shows the Postprocess master switch and no per-layer switch.
    expect(markup).toContain('data-postprocess-master-toggle');
    expect(markup.match(/role="switch"/g) ?? []).toHaveLength(2); // master + Glow
  });

  it('exposes Glass IOR and refinable Chromatic Steps in Optics', () => {
    const initialState = useGradientStore.getInitialState();
    const previousPostprocess = initialState.postprocess;
    const previousEffectPipeline = initialState.effectPipeline;
    initialState.postprocess = {
      ...previousPostprocess,
      effectMode: 'glassV2',
      glassSurfaceType: 'organic',
    };
    initialState.effectPipeline = {
      ...previousEffectPipeline,
      selectedKind: 'glass',
      effectStack: updateEffectStackLayer(previousEffectPipeline.effectStack, 'glass', { enabled: true }),
    };
    let organicMarkup: string;
    let rippleMarkup: string;
    try {
      organicMarkup = renderToStaticMarkup(
        <LanguageProvider>
          <PostprocessPanel />
        </LanguageProvider>,
      );
      initialState.postprocess = { ...initialState.postprocess, glassSurfaceType: 'ripple' };
      rippleMarkup = renderToStaticMarkup(
        <LanguageProvider>
          <PostprocessPanel />
        </LanguageProvider>,
      );
    } finally {
      initialState.postprocess = previousPostprocess;
      initialState.effectPipeline = previousEffectPipeline;
    }

    expect(organicMarkup).toContain('Surface Type');
    expect(organicMarkup).toContain('Organic');
    expect(organicMarkup).toContain('IOR');
    expect(organicMarkup).toContain('Chromatic Steps');
    expect(organicMarkup).toContain('1 keeps the current dispersion samples');
    expect(organicMarkup).not.toContain('value="faceted"');
    expect(rippleMarkup).toContain('Ripple');
    expect(rippleMarkup).toContain('Frequency');
    expect(rippleMarkup).toContain('Depth');
    expect(rippleMarkup).toContain('Animation Speed');
    expect(rippleMarkup).toContain('complete Ripple cycles run in one Animation loop');
    expect(rippleMarkup).toContain('lenticular ridge');
  });

  it('exposes Faceted as a static GlassTile pattern with planar surface controls', () => {
    const initialState = useGradientStore.getInitialState();
    const previousPostprocess = initialState.postprocess;
    const previousEffectPipeline = initialState.effectPipeline;
    initialState.postprocess = {
      ...previousPostprocess,
      effectMode: 'glassTile',
      glassTilePattern: 'faceted',
    };
    initialState.effectPipeline = {
      ...previousEffectPipeline,
      selectedKind: 'glassTile',
      effectStack: updateEffectStackLayer(previousEffectPipeline.effectStack, 'glassTile', { enabled: true }),
    };

    let markup: string;
    try {
      markup = renderToStaticMarkup(
        <LanguageProvider>
          <PostprocessPanel />
        </LanguageProvider>,
      );
    } finally {
      initialState.postprocess = previousPostprocess;
      initialState.effectPipeline = previousEffectPipeline;
    }

    expect(markup).toContain('Pattern');
    expect(markup).toContain('Faceted');
    expect(markup).toContain('Facet Density');
    expect(markup).toContain('Facet Depth');
    expect(markup).toContain('continuous shared-vertex triangular surface');
    expect(markup).not.toContain('Tile Size');
    expect(markup).not.toContain('Bevel');
    expect(markup).not.toContain('Surface Height');
    expect(markup).not.toContain('Curvature');
    expect(markup).not.toContain('Detail Scale');
  });
});
