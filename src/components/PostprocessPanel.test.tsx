import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { updateEffectStackLayer } from '../lib/effectPipeline';
import { useGradientStore } from '../store/gradientStore';
import { PostprocessPanel } from './PostprocessPanel';

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
});
