import { createFileRoute } from "@tanstack/react-router";

import { HowItWorks } from "@/components/site/Sections";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { useI18n } from "@/lib/i18n/context";

export const Route = createFileRoute("/tools/")({
  head: () => ({
    meta: [
      { title: "All PDF & File Tools — PDF ADIL" },
      {
        name: "description",
        content:
          "Every free PDF ADIL tool in one place: Word to PDF, PDF to Word, Excel, PowerPoint, JPG, PNG, merge, split, compress, rotate and more.",
      },
      { property: "og:title", content: "All PDF & File Tools — PDF ADIL" },
      { property: "og:description", content: "Free tools to convert, merge, split and compress your files." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
