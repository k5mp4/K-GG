import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { SandboxPanel } from './SandboxPanel';
import { TexturePanel } from './TexturePanel';
import type { TextureConfig } from '../types/texture';

function renderSandbox() {
  return renderToStaticMarkup(
    <LanguageProvider>
      <SandboxPanel onRenderViewModeChange={() => undefined} />
    </LanguageProvider>,
  );
}

describe('SandboxPanel Cone ownership', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('keeps Cone out of the SANDBOX Edit Layer selector and modules', () => {
    const markup = renderSandbox();

    expect(markup).toContain('data-sandbox-panel');
    expect(markup).not.toContain('>Cone</span>');
    expect(markup).not.toContain('data-sandbox-module="cone"');
  });
});

/** zustand renders the initial state on the server, so patch that object for the render. */
function renderWithTexture(patch: Partial<TextureConfig>, render: () => string): string {
  const initialState = useGradientStore.getInitialState();
  const previous = initialState.texture;
  initialState.texture = { ...previous, ...patch };
  try {
    return render();
  } finally {
    initialState.texture = previous;
  }
}

function renderTexturePanel() {
  return renderToStaticMarkup(
    <LanguageProvider>
      <TexturePanel imageSource={null} imageName="" onImageLoad={() => undefined} onImageClear={() => undefined} />
    </LanguageProvider>,
  );
}

describe('Texture layer panel', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('keeps Texture out of the SANDBOX modules because it is an Effect Stack layer', () => {
    const markup = renderWithTexture({ enabled: true }, renderSandbox);

    expect(markup).toContain('/6');
    expect(markup).not.toContain('data-sandbox-module="texture"');
    expect(markup).not.toContain('data-texture-panel');
  });

  it('shows the procedural preset controls and hides the image controls', () => {
    const markup = renderTexturePanel();

    expect(markup).toContain('data-texture-panel');
    expect(markup).toContain('Anisotropy');
    expect(markup).toContain('Grain Angle');
    expect(markup).not.toContain('type="file"');
  });

  it('follows the disc for radial presets', () => {
    const markup = renderWithTexture({ preset: 'cdGroove' }, renderTexturePanel);

    expect(markup).toContain('Center X');
    expect(markup).not.toContain('Grain Angle');
  });

  it('offers the image loader and the missing-image notice for image sources', () => {
    const markup = renderWithTexture({ source: 'image' }, renderTexturePanel);

    expect(markup).toContain('type="file"');
    expect(markup).toContain('No image loaded');
    expect(markup).toContain('Grain Angle');
  });
});
