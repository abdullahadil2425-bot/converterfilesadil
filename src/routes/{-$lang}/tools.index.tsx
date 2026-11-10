import { createFileRoute } from "@tanstack/react-router";

import { HowItWorks } from "@/components/site/Sections";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { useI18n } from "@/lib/i18n/context";
import { langFromParam, seoHead } from "@/lib/seo";

export const Route = createFileRoute("/{-$lang}/tools/")({
  head: ({ params }) => seoHead(langFromParam(params.lang), "/tools"),
  component: ToolsPage,
});

function ToolsPage() {
  const { t } = useI18n();
  return (
    <>
      <section className="bg-dots">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-10 text-center sm:px-6">
          <h1 className="text-4xl font-semibold sm:text-5xl">{t("tools_title")}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("tools_sub")}</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <ToolGrid />
      </section>
      <div className="pt-24">
        <HowItWorks />
      </div>
    </>
  );
}
