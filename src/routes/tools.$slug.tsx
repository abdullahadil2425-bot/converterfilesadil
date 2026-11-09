import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { HowItWorks } from "@/components/site/Sections";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolGraphic } from "@/components/tools/ToolGraphic";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { useI18n } from "@/lib/i18n/context";
import { getTool, TOOLS, toolText } from "@/lib/tools";

export const Route = createFileRoute("/tools/$slug")({
  loader: ({ params }) => {
    const tool = getTool(params.slug);
    if (!tool) throw notFound();
    return { slug: tool.slug };
  },
  head: ({ loaderData }) => {
    const tool = loaderData ? getTool(loaderData.slug) : undefined;
    if (!tool) {
      return { meta: [{ title: "Tool not found — PDFKor" }, { name: "robots", content: "noindex" }] };
    }
    const { name, description } = toolText(tool, "en");
    const title = `${name} — Free Online Converter | PDFKor`;
    return {
      meta: [
        { title },
        { name: "description", content: `${description} No sign-up, no watermark, works in 12 languages.` },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: `PDFKor ${name}`,
            description,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        },
      ],
    };
  },
  component: ToolPage,
});

function ToolPage() {
  const { slug } = Route.useLoaderData();
  const { t, lang } = useI18n();
  const tool = getTool(slug);
  if (!tool) return null;
  const { name, description } = toolText(tool, lang);
  const related = TOOLS.filter((x) => x.category === tool.category && x.slug !== tool.slug).slice(0, 4);

  return (
    <>
      <section className="bg-dots">
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-8 sm:px-6">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">{t("nav_home")}</Link>
            <ChevronRight className="size-4 rtl:rotate-180" />
            <Link to="/tools" className="hover:text-foreground">{t("nav_tools")}</Link>
            <ChevronRight className="size-4 rtl:rotate-180" />
            <span className="text-foreground">{name}</span>
          </nav>
          <div className="mt-6 flex flex-col items-center text-center">
            <ToolGraphic tool={tool} className="max-w-44" />
            <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{name}</h1>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground">{description}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <ToolWorkspace key={tool.slug} tool={tool} />
      </section>

      <div className="pt-24">
        <HowItWorks />
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-3xl font-semibold">{t("related")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <ToolCard key={r.slug} tool={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
