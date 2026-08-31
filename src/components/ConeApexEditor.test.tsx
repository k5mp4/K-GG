import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ConeApexEditor } from './ConeApexEditor';
import { LanguageProvider } from '../i18n/LanguageProvider';

describe('ConeApexEditor', () => {
  it('renders one simple cyan circular apex handle without auxiliary markers', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <ConeApexEditor width={640} height={360} />
      </LanguageProvider>,
    );

    expect(markup.match(/data-cone-apex-anchor/g)).toHaveLength(1);
    expect(markup).toContain('aria-label="Drag cone vertex"');
    expect(markup).toContain('title="Drag cone vertex"');
    expect(markup).toContain('border-radius:50%');
    expect(markup).toContain('background:#56e0f5');
    expect(markup).toContain('touch-action:none');
    expect(markup).not.toContain('aria-hidden="true"');
    expect(markup).not.toContain('<span');
  });
});
