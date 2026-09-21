import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { PostprocessStackPanel } from './PostprocessStackPanel';

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
});
