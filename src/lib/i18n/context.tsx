import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { DICTS, type DictKey } from "./dict";
import { DEFAULT_LANG, isLang, langDir, matchBrowserLang, type Lang } from "./languages";

const STORAGE_KEY = "pdfkor-lang";

type I18nValue = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  t: (key: DictKey, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Server render is always the default language; the visitor's choice is applied after hydration.
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) {
      setLangState(saved);
      return;
    }
    const detected = matchBrowserLang(navigator.languages ?? [navigator.language]);
    if (detected) setLangState(detected);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = langDir(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, dir: langDir(lang), setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function translate(lang: Lang, key: DictKey, vars?: Record<string, string>): string {
  let text = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, v);
  return text;
}

// Used when a component renders outside I18nProvider (error/not-found screens, a
// stale hot-reload module): show default-language text instead of crashing the page.
const FALLBACK: I18nValue = {
  lang: DEFAULT_LANG,
  dir: langDir(DEFAULT_LANG),
  setLang: () => {},
  t: (key, vars) => translate(DEFAULT_LANG, key, vars),
};

let warned = false;

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  if (import.meta.env.DEV && !warned) {
    warned = true;
    console.warn("useI18n used outside I18nProvider; falling back to default language.");
  }
  return FALLBACK;
}
