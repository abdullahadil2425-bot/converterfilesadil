import { useLocation, useRouter } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";

import { DICTS, type DictKey } from "./dict";
import { DEFAULT_LANG, isLang, langDir, matchBrowserLang, type Lang } from "./languages";
import { langParam, localizedPath, splitLangPath } from "./paths";

const STORAGE_KEY = "pdfkor-lang";

type I18nValue = {
  lang: Lang;
  /** Value for the `{-$lang}` route param in links (undefined for the default language). */
  langParam: string | undefined;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  t: (key: DictKey, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

function translate(lang: Lang, key: DictKey, vars?: Record<string, string>): string {
  let text = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, v);
  return text;
}

/**
 * The language comes from the URL ("/ps/tools" is Pashto), so every language version is its
 * own page for search engines. Switching language moves to that language's URL.
 */
export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const router = useRouter();
  const pathname = useLocation({ select: (l) => l.pathname });

  const goTo = useCallback(
    (next: Lang, replace: boolean) => {
      const { path } = splitLangPath(window.location.pathname);
      const href = localizedPath(next, path) + window.location.search + window.location.hash;
      void router.navigate({ href, replace });
    },
    [router],
  );

  // On an unprefixed (English) URL, move a returning or non-English visitor to their language.
  useEffect(() => {
    if (splitLangPath(pathname).lang) return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const preferred = isLang(saved) ? saved : matchBrowserLang(navigator.languages ?? [navigator.language]);
    if (preferred && preferred !== DEFAULT_LANG) goTo(preferred, true);
    // Only on first load: later English navigation is the visitor's own choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = langDir(lang);
  }, [lang]);

  const setLang = useCallback(
    (next: Lang) => {
      window.localStorage.setItem(STORAGE_KEY, next);
      if (next !== lang) goTo(next, false);
    },
    [goTo, lang],
  );

  const value = useMemo<I18nValue>(
    () => ({ lang, langParam: langParam(lang), dir: langDir(lang), setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Used when a component renders outside I18nProvider (error/not-found screens, a
// stale hot-reload module): show default-language text instead of crashing the page.
const FALLBACK: I18nValue = {
  lang: DEFAULT_LANG,
  langParam: undefined,
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
