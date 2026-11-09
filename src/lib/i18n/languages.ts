export const LANGUAGES = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "ps", name: "پښتو", dir: "rtl" },
  { code: "fa", name: "دری / فارسی", dir: "rtl" },
  { code: "ar", name: "العربية", dir: "rtl" },
  { code: "ur", name: "اردو", dir: "rtl" },
  { code: "hi", name: "हिन्दी", dir: "ltr" },
  { code: "tr", name: "Türkçe", dir: "ltr" },
  { code: "fr", name: "Français", dir: "ltr" },
  { code: "es", name: "Español", dir: "ltr" },
  { code: "de", name: "Deutsch", dir: "ltr" },
  { code: "ru", name: "Русский", dir: "ltr" },
  { code: "zh", name: "中文", dir: "ltr" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANG: Lang = "en";

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && LANGUAGES.some((l) => l.code === value);
}

export function langDir(lang: Lang): "ltr" | "rtl" {
  return LANGUAGES.find((l) => l.code === lang)?.dir ?? "ltr";
}

/** Picks the best supported language from a browser language list like ["ps-AF", "en"]. */
export function matchBrowserLang(list: readonly string[]): Lang | null {
  for (const raw of list) {
    const base = raw.toLowerCase().split("-")[0];
    if (base === "prs") return "fa";
    if (isLang(base)) return base;
  }
  return null;
}
