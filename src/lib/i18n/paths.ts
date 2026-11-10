import { DEFAULT_LANG, isLang, type Lang } from "./languages";

/** The `{-$lang}` URL param for a language: the default language has no prefix. */
export function langParam(lang: Lang): string | undefined {
  return lang === DEFAULT_LANG ? undefined : lang;
}

/** "/tools" + "ps" -> "/ps/tools"; "/" + "ps" -> "/ps"; English stays unprefixed. */
export function localizedPath(lang: Lang, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return clean;
  return clean === "/" ? `/${lang}` : `/${lang}${clean}`;
}

/** Splits "/ps/tools/x" into { lang: "ps", path: "/tools/x" }. lang is null when unprefixed. */
export function splitLangPath(pathname: string): { lang: Lang | null; path: string } {
  const match = pathname.match(/^\/([^/]+)(\/.*)?$/);
  if (match && isLang(match[1])) return { lang: match[1], path: match[2] || "/" };
  return { lang: null, path: pathname || "/" };
}
