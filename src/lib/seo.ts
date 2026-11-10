import { DICTS } from "./i18n/dict";
import { localizedPath } from "./i18n/paths";
import { DEFAULT_LANG, isLang, LANGUAGES, type Lang } from "./i18n/languages";
import { TOOLS, toolText } from "./tools";

export const SITE_NAME = "PDF ADIL";

const OG_LOCALE: Record<Lang, string> = {
  en: "en_US", ps: "ps_AF", fa: "fa_AF", ar: "ar_AR", ur: "ur_PK", hi: "hi_IN",
  tr: "tr_TR", fr: "fr_FR", es: "es_ES", de: "de_DE", ru: "ru_RU", zh: "zh_CN",
};

/** Language from the `{-$lang}` URL param; anything else means the default language. */
export function langFromParam(param: unknown): Lang {
  return isLang(param) ? param : DEFAULT_LANG;
}

function clip(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
}

/** Title and description of every indexable page, in every language. */
export function pageTexts(lang: Lang, path: string): { title: string; description: string } | null {
  const d = DICTS[lang];
  if (path === "/") return { title: `${SITE_NAME} — ${d.brand_tag}`, description: `${d.hero_sub} ${d.hero_badge}.` };
  if (path === "/tools") return { title: `${d.tools_title} — ${d.brand_tag} | ${SITE_NAME}`, description: `${d.tools_sub} ${d.footer_desc}` };
  if (path === "/about") return { title: `${d.about_title} | ${SITE_NAME}`, description: d.about_body1 };
  if (path === "/contact") return { title: `${d.contact_title} | ${SITE_NAME}`, description: d.contact_sub };
  if (path === "/privacy") return { title: `${d.privacy_title} | ${SITE_NAME}`, description: d.privacy_body };
  const slug = path.match(/^\/tools\/([^/]+)$/)?.[1];
  const tool = slug ? TOOLS.find((t) => t.slug === slug) : undefined;
  if (tool) {
    const { name, description } = toolText(tool, lang);
    return { title: `${name} — ${d.brand_tag} | ${SITE_NAME}`, description: `${description} ${d.feat_free_d}` };
  }
  return null;
}

/** Every indexable page path without a language prefix. */
export function indexablePaths(): string[] {
  return ["/", "/tools", "/about", "/contact", "/privacy", ...TOOLS.map((t) => `/tools/${t.slug}`)];
}

/**
 * head() fields for one page in one language: unique title/description, a canonical link to
 * this exact language version, and Open Graph tags. Paths stay relative so they follow
 * whichever domain serves the site; hreflang alternates (which must be absolute) live in /sitemap.xml.
 */
export function seoHead(lang: Lang, path: string, ogType = "website") {
  const texts = pageTexts(lang, path) ?? { title: SITE_NAME, description: DICTS[lang].footer_desc };
  const url = localizedPath(lang, path);
  const description = clip(texts.description);
  return {
    meta: [
      { title: texts.title },
      { name: "description", content: description },
      { property: "og:title", content: texts.title },
      { property: "og:description", content: description },
      { property: "og:type", content: ogType },
      { property: "og:url", content: url },
      { property: "og:locale", content: OG_LOCALE[lang] },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export const ALL_LANGS: Lang[] = LANGUAGES.map((l) => l.code);
