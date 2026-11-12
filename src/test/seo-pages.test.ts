import { describe, expect, it } from "vitest";

import { LANGUAGES, type Lang } from "@/lib/i18n/languages";
import { localizedPath } from "@/lib/i18n/paths";
import { ALL_LANGS, indexablePaths, pageTexts, seoHead } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";
import { Route as AboutRoute } from "@/routes/{-$lang}/about";
import { Route as ContactRoute } from "@/routes/{-$lang}/contact";
import { Route as HomeRoute } from "@/routes/{-$lang}/index";
import { Route as PrivacyRoute } from "@/routes/{-$lang}/privacy";
import { Route as ToolRoute } from "@/routes/{-$lang}/tools.$slug";
import { Route as ToolsRoute } from "@/routes/{-$lang}/tools.index";
import { Route as SitemapRoute } from "@/routes/sitemap[.]xml";

type MetaTag = { title?: string; name?: string; property?: string; content?: string };
type LinkTag = { rel?: string; href?: string };
type Head = { meta?: MetaTag[]; links?: LinkTag[] };

const ORIGIN = "https://pdf-adil.example";
const param = (lang: Lang) => (lang === "en" ? undefined : lang);
const metaValue = (head: Head, key: string) =>
  head.meta?.find((m) => m.name === key || m.property === key)?.content;
const titleOf = (head: Head) => head.meta?.find((m) => "title" in m)?.title;
const canonicalOf = (head: Head) => head.links?.find((l) => l.rel === "canonical")?.href;

// Calls the real head() of the page that serves `path`, the same way the router does.
function routeHead(lang: Lang, path: string): Head {
  const params = { lang: param(lang) };
  const call = (route: { options: { head?: unknown } }, extra: object = {}) =>
    (route.options.head as (ctx: object) => Head)({ params, ...extra });
  if (path === "/") return call(HomeRoute);
  if (path === "/tools") return call(ToolsRoute);
  if (path === "/about") return call(AboutRoute);
  if (path === "/contact") return call(ContactRoute);
  if (path === "/privacy") return call(PrivacyRoute);
  const slug = path.replace("/tools/", "");
  return call(ToolRoute, { params: { ...params, slug }, loaderData: { slug } });
}

async function fetchSitemap(): Promise<string> {
  const handlers = (SitemapRoute.options as { server: { handlers: { GET: (ctx: object) => Response } } }).server
    .handlers;
  const res = await handlers.GET({ request: new Request(`${ORIGIN}/sitemap.xml`) });
  expect(res.headers.get("content-type")).toContain("application/xml");
  return res.text();
}

const PATHS = indexablePaths();

describe("SEO for every language", () => {
  it("covers all 12 languages and every tool page", () => {
    expect(ALL_LANGS).toHaveLength(12);
    expect(PATHS).toHaveLength(5 + TOOLS.length);
  });

  describe.each(LANGUAGES.map((l) => l.code))("%s", (lang) => {
    const heads = PATHS.map((path) => ({ path, head: routeHead(lang, path) }));

    it("gives every page a title and description", () => {
      for (const { path, head } of heads) {
        expect(pageTexts(lang, path), path).not.toBeNull();
        expect(titleOf(head)?.trim(), path).toBeTruthy();
        const desc = metaValue(head, "description");
        expect(desc?.trim(), path).toBeTruthy();
        expect(desc!.length, path).toBeLessThanOrEqual(160);
      }
    });

    it("never repeats a title or description between two pages", () => {
      const titles = heads.map(({ head }) => titleOf(head));
      const descs = heads.map(({ head }) => metaValue(head, "description"));
      expect(new Set(titles).size).toBe(titles.length);
      expect(new Set(descs).size).toBe(descs.length);
    });

    it("points canonical and og:url at the page's own language URL", () => {
      for (const { path, head } of heads) {
        const expected = localizedPath(lang, path);
        expect(canonicalOf(head), path).toBe(expected);
        expect(metaValue(head, "og:url"), path).toBe(expected);
        expect(head.links?.filter((l) => l.rel === "canonical"), path).toHaveLength(1);
        if (lang === "en") expect(expected.startsWith("/en"), path).toBe(false);
        else expect(expected === `/${lang}` || expected.startsWith(`/${lang}/`), path).toBe(true);
      }
    });

    it("matches Open Graph tags to the title and description", () => {
      for (const { path, head } of heads) {
        expect(metaValue(head, "og:title"), path).toBe(titleOf(head));
        expect(metaValue(head, "og:description"), path).toBe(metaValue(head, "description"));
        expect(metaValue(head, "og:type"), path).toBe("website");
        expect(metaValue(head, "og:locale"), path).toMatch(new RegExp(`^${lang}_`));
        expect(metaValue(head, "twitter:card"), path).toBe("summary_large_image");
      }
    });

    if (lang !== "en") {
      it("uses translated titles, not the English ones", () => {
        const translated = PATHS.filter((p) => titleOf(seoHead(lang, p)) !== titleOf(seoHead("en", p)));
        expect(translated).toEqual(PATHS);
      });
    }
  });
});

describe("sitemap.xml", () => {
  it("lists every page in every language exactly once", async () => {
    const xml = await fetchSitemap();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = PATHS.flatMap((p) => ALL_LANGS.map((l) => `${ORIGIN}${localizedPath(l, p)}`));
    expect(locs).toHaveLength(12 * PATHS.length);
    expect(new Set(locs)).toEqual(new Set(expected));
  });

  it("links each URL to all 12 language versions plus x-default", async () => {
    const xml = await fetchSitemap();
    const blocks = xml.split("<url>").slice(1);
    for (const block of blocks) {
      const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "";
      const path = loc.replace(ORIGIN, "").replace(/^\/(ps|fa|ar|ur|hi|tr|fr|es|de|ru|zh)(?=\/|$)/, "") || "/";
      for (const l of ALL_LANGS) {
        expect(block, loc).toContain(`hreflang="${l}" href="${ORIGIN}${localizedPath(l, path)}"`);
      }
      expect(block, loc).toContain(`hreflang="x-default" href="${ORIGIN}${path}"`);
      expect(block.match(/hreflang=/g), loc).toHaveLength(13);
    }
  });

  it("uses the same URLs as each page's canonical link", async () => {
    const xml = await fetchSitemap();
    for (const lang of ALL_LANGS) {
      for (const path of PATHS) {
        expect(xml).toContain(`<loc>${ORIGIN}${canonicalOf(routeHead(lang, path))}</loc>`);
      }
    }
  });
});
