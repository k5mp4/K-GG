import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { SandboxPanel } from './SandboxPanel';

describe('SandboxPanel Cone ownership', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('keeps Cone out of the SANDBOX Edit Layer selector and modules', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <SandboxPanel onRenderViewModeChange={() => undefined} />
      </LanguageProvider>,
    );

    expect(markup).toContain('data-sandbox-panel');
    expect(markup).not.toContain('>Cone</span>');
    expect(markup).not.toContain('data-sandbox-module="cone"');
  });
});
