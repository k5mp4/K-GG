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

  it('keeps Cone out of the SANDBOX module list', () => {
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

describe('SANDBOX Shapes module', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('lists Shapes as a module row with its own switch', () => {
    const initialState = useGradientStore.getInitialState();
    const previous = initialState.shapes;
    initialState.shapes = { ...previous, enabled: true };
    try {
      const markup = renderSandbox();
      expect(markup).toContain('data-sandbox-module="shapes"');
      expect(markup).toContain('aria-label="Shapes on"');
    } finally {
      initialState.shapes = previous;
    }
  });
});

describe('SANDBOX module list', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('lists every module without an Edit Layer selector and opens only Cloth by default', () => {
    const markup = renderSandbox();

    expect(markup).not.toContain('Edit Layer');
    for (const id of ['cloth', 'normal', 'prism', 'particles', 'flowGradient', 'seamless', 'shapes', 'controller']) {
      expect(markup).toContain(`data-sandbox-module="${id}"`);
    }
    expect(markup.match(/data-open="true"/g)).toHaveLength(1);
    expect(markup).toContain('data-sandbox-module="cloth" data-open="true"');
    expect(markup).toContain('data-cloth-panel');
  });

  it('shows Off and Applied only through the switch, not as status text', () => {
    const markup = renderSandbox();

    // Row status text uses the cream/40 class; the switch carries Off/On itself.
    expect(markup).not.toContain('tracking-wider text-cream/40">Off<');
    expect(markup).not.toContain('text-emerald-300">Applied<');
  });
});
