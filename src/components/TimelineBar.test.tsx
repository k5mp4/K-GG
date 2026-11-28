import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { TimelineBar } from './TimelineBar';

describe('TimelineBar animation switch', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('labels the enable switch apart from the Animation panel name', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <TimelineBar animLoopRef={{ current: null }} onSeek={() => {}} />
      </LanguageProvider>,
    );
    expect(markup).toMatch(/data-animation-enabled-toggle[^]*?role="switch"[^>]*aria-label="Apply Keyframes"/);
    expect(markup).not.toMatch(/<button[^>]*title="Animation"/);
  });
});
