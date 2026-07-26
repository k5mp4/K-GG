import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { catalogs, type MessageKey } from './messages';
import { formatMessage, resolveUiLanguage, UI_LANGUAGE_STORAGE_KEY, type Replacements, type UiLanguage } from './language';

type LanguageContextValue = {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  t: (key: MessageKey, replacements?: Replacements) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLanguage(): UiLanguage {
  if (typeof window === 'undefined') return 'en';
  let saved: string | null = null;
  try { saved = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY); } catch { /* storage may be unavailable */ }
  return resolveUiLanguage(saved, window.navigator.language);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<UiLanguage>(readInitialLanguage);

  const setLanguage = useCallback((next: UiLanguage) => {
    setLanguageState(next);
    try { window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, next); } catch { /* keep the in-memory setting */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== UI_LANGUAGE_STORAGE_KEY) return;
      setLanguageState(resolveUiLanguage(event.newValue, window.navigator.language));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const t = useCallback((key: MessageKey, replacements?: Replacements) => (
    formatMessage(catalogs[language][key], replacements)
  ), [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
