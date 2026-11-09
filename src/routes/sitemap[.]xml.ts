import { createFileRoute } from "@tanstack/react-router";

import { TOOLS } from "@/lib/tools";

const STATIC_PATHS = ["/", "/tools", "/about", "/contact", "/privacy"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        const paths = [...STATIC_PATHS, ...TOOLS.map((t) => `/tools/${t.slug}`)];
        const body =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          paths
            .map(
              (p) =>
                `  <url><loc>${origin}${p}</loc><changefreq>weekly</changefreq><priority>${p === "/" ? "1.0" : p.startsWith("/tools/") ? "0.8" : "0.6"}</priority></url>`,
            )
            .join("\n") +
          `\n</urlset>\n`;
        return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
