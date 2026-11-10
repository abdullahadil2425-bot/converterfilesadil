import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { useI18n } from "@/lib/i18n/context";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — PDF ADIL" },
      { name: "description", content: "PDF ADIL processes your files in your browser. Nothing is uploaded, stored or shared." },
      { property: "og:title", content: "Privacy Policy — PDF ADIL" },
      { property: "og:description", content: "Your files never leave your device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl px-4 pt-14 sm:px-6">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-mint/30">
        <ShieldCheck className="size-7" />
      </span>
      <h1 className="mt-5 text-4xl font-semibold">{t("privacy_title")}</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t("privacy_body")}</p>
    </div>
  );
}
