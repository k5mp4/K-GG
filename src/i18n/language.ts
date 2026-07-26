import type { catalogs } from './messages';

export type UiLanguage = keyof typeof catalogs;
export const UI_LANGUAGE_STORAGE_KEY = 'kgg.ui-language';

export function isUiLanguage(value: unknown): value is UiLanguage {
  return value === 'ja' || value === 'en';
}

export function resolveUiLanguage(saved: unknown, browserLanguage: string | undefined): UiLanguage {
  if (isUiLanguage(saved)) return saved;
  return browserLanguage?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export type Replacements = Record<string, string | number>;

export function formatMessage(template: string, replacements: Replacements = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(replacements[name] ?? `{{${name}}}`));
}
