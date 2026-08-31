import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CustomSelect } from './CustomSelect';

vi.mock('../i18n/LanguageProvider', () => ({
  useLanguage: () => ({ language: 'ja' }),
}));

describe('CustomSelect localization controls', () => {
  it('keeps an opted-out Cone Seam Mode label and options in English', () => {
    const markup = renderToStaticMarkup(
      <CustomSelect
        label="Seam Mode"
        value="mirror"
        options={[
          { value: 'mirror', label: 'Mirror Repeat' },
          { value: 'weld', label: 'Edge Weld' },
          { value: 'reapply', label: 'Gradient Reapply' },
        ]}
        localizeLabel={false}
        localizeOptions={false}
        onChange={() => undefined}
      />,
    );

    expect(markup).toContain('>Seam Mode</label>');
    expect(markup).toContain('title="Mirror Repeat"');
    expect(markup).toContain('title="Edge Weld"');
    expect(markup).toContain('title="Gradient Reapply"');
    expect(markup).toContain('>Mirror Repeat</span>');
    expect(markup).toContain('>Edge Weld</span>');
    expect(markup).toContain('>Gradient Reapply</span>');
    expect(markup).not.toContain('シーム方式');
    expect(markup).not.toContain('ミラー反復');
    expect(markup).not.toContain('エッジ溶接');
    expect(markup).not.toContain('グラデーション再適用');
  });
});
