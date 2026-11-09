import { createFileRoute } from "@tanstack/react-router";

import heroImage from "@/assets/hero-machine.jpg";
import { Features } from "@/components/site/Sections";
import { useI18n } from "@/lib/i18n/context";
import { LANGUAGES } from "@/lib/i18n/languages";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About PDFKor — Simple file tools in your language" },
      {
        name: "description",
        content: "PDFKor builds free, private, multilingual tools to convert and edit PDF, Word, Excel and image files.",
      },
      { property: "og:title", content: "About PDFKor" },
      { property: "og:description", content: "Free, private, multilingual file tools that run in your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <h1 className="text-4xl font-semibold sm:text-5xl">{t("about_title")}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{t("about_body1")}</p>
          <p className="text-lg leading-relaxed text-muted-foreground">{t("about_body2")}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            {LANGUAGES.map((l) => (
              <span key={l.code} dir={l.dir} className="rounded-full border border-border bg-paper px-3 py-1 text-sm">
                {l.name}
              </span>
            ))}
          </div>
        </div>
        <img
          src={heroImage}
          alt="A friendly file conversion machine"
          width={1280}
          height={960}
          loading="lazy"
          className="w-full rounded-[2.5rem] border border-border shadow-lift"
        />
      </div>
      <div className="mt-16">
        <Features />
      </div>
    </div>
  );
}
