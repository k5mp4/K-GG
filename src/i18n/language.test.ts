import { describe, expect, it } from 'vitest';
import { formatMessage, resolveUiLanguage, UI_LANGUAGE_STORAGE_KEY } from './language';
import { enMessages, jaMessages } from './messages';

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]).sort();
}

describe('UI message catalogs', () => {
  it('has exactly the same non-empty keys in English and Japanese', () => {
    const englishKeys = Object.keys(enMessages).sort();
    const japaneseKeys = Object.keys(jaMessages).sort();

    expect(japaneseKeys).toEqual(englishKeys);
    for (const key of englishKeys) {
      expect(enMessages[key as keyof typeof enMessages].trim(), `English: ${key}`).not.toBe('');
      expect(jaMessages[key as keyof typeof jaMessages].trim(), `Japanese: ${key}`).not.toBe('');
    }
  });

  it('uses the same placeholders for every translated message', () => {
    for (const key of Object.keys(enMessages) as Array<keyof typeof enMessages>) {
      expect(placeholders(jaMessages[key]), key).toEqual(placeholders(enMessages[key]));
    }
  });
});

describe('UI language resolution', () => {
  it('uses a valid saved language before the browser language', () => {
    expect(resolveUiLanguage('ja', 'en-US')).toBe('ja');
    expect(resolveUiLanguage('en', 'ja-JP')).toBe('en');
  });

  it('falls back to Japanese only for a ja-prefixed browser language', () => {
    expect(resolveUiLanguage(null, 'ja')).toBe('ja');
    expect(resolveUiLanguage(undefined, 'JA-jp')).toBe('ja');
    expect(resolveUiLanguage('invalid', 'en-US')).toBe('en');
    expect(resolveUiLanguage('invalid', undefined)).toBe('en');
  });

  it('keeps the persisted storage key stable', () => {
    expect(UI_LANGUAGE_STORAGE_KEY).toBe('kgg.ui-language');
  });
});

describe('message formatting', () => {
  it('formats string and numeric placeholders and leaves missing values visible', () => {
    expect(formatMessage('Version {{version}} / {{count}}', { version: '1.2.3', count: 4 }))
      .toBe('Version 1.2.3 / 4');
    expect(formatMessage('Missing {{name}}')).toBe('Missing {{name}}');
  });
});
