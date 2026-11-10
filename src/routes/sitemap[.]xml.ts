import { createFileRoute } from "@tanstack/react-router";

import { localizedPath } from "@/lib/i18n/paths";
import { ALL_LANGS, indexablePaths } from "@/lib/seo";

// One <url> per page per language, each listing every language version (hreflang) so
// search engines show visitors the page in their own language.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        const entries = indexablePaths().flatMap((path) => {
          const alternates =
            ALL_LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${origin}${localizedPath(l, path)}"/>`).join("\n") +
            `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${path}"/>`;
          return ALL_LANGS.map(
            (lang) => `  <url>\n    <loc>${origin}${localizedPath(lang, path)}</loc>\n${alternates}\n  </url>`,
          );
        });
        const body =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
          entries.join("\n") +
          `\n</urlset>\n`;
        return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
