import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail } from "lucide-react";

import heroImage from "@/assets/hero-machine.jpg";
import { Features, HowItWorks } from "@/components/site/Sections";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDFKor — Free PDF Converter: Word, Excel, JPG to PDF & more" },
      {
        name: "description",
        content:
          "Free online tools to convert Word, Excel, PowerPoint and images to PDF and back, plus merge, split, compress and rotate PDF files. Works in 12 languages.",
      },
      { property: "og:title", content: "PDFKor — Free PDF & File Converter" },
      {
        property: "og:description",
        content: "Convert, merge, split and compress PDF, Word, Excel and image files for free, right in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();

  return (
    <>
      <section className="bg-dots relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="space-y-6 text-center lg:text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-paper px-4 py-1.5 text-sm font-semibold text-foreground shadow-soft">
              <span className="size-2 rounded-full bg-fmt-excel" />
              {t("hero_badge")}
            </span>
            <h1 className="text-4xl leading-[1.1] font-semibold text-balance sm:text-5xl lg:text-6xl">
              {t("hero_title")}
            </h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">{t("hero_sub")}</p>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button asChild size="lg" className="gap-2 rounded-full px-7 text-base shadow-lift">
                <a href="#tools">
                  {t("hero_cta")} <ArrowRight className="size-4 rtl:rotate-180" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 rounded-full bg-paper px-7 text-base">
                <Link to="/contact">
                  <Mail className="size-4" /> {t("hero_cta2")}
                </Link>
              </Button>
            </div>
            <div dir="ltr" className="flex flex-wrap justify-center gap-2 pt-2 lg:justify-start">
              {[
                ["PDF", "bg-fmt-pdf"],
                ["Word", "bg-fmt-word"],
                ["Excel", "bg-fmt-excel"],
                ["PowerPoint", "bg-fmt-ppt"],
                ["JPG · PNG", "bg-fmt-image"],
              ].map(([label, bg]) => (
                <span key={label} className={`rounded-lg px-2.5 py-1 text-xs font-bold text-paper ${bg}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-6 -z-10 rounded-[3rem] bg-primary/10 blur-2xl" />
            <img
              src={heroImage}
              alt="A friendly machine turning a Word document into a PDF"
              width={1280}
              height={960}
              className="animate-float-soft w-full rounded-[2.5rem] border border-border shadow-lift"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-4 max-w-6xl px-4 sm:px-6">
        <Features />
      </section>

      <section id="tools" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">{t("tools_title")}</h2>
          <p className="mt-2 text-muted-foreground">{t("tools_sub")}</p>
        </div>
        <ToolGrid />
      </section>

      <div className="pt-24">
        <HowItWorks />
      </div>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-5 rounded-[2.5rem] bg-foreground px-6 py-12 text-center text-background sm:px-12">
          <h2 className="text-3xl font-semibold">{t("contact_title")}</h2>
          <p className="max-w-lg opacity-80">{t("contact_sub")}</p>
          <Button asChild size="lg" className="gap-2 rounded-full px-7">
            <Link to="/contact">
              <Mail className="size-4" /> {t("hero_cta2")}
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
