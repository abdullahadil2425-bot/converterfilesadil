import { Download, MousePointerClick, ShieldCheck, Sparkles, Upload, Zap } from "lucide-react";

import { useI18n } from "@/lib/i18n/context";

export function Features() {
  const { t } = useI18n();
  const items = [
    { icon: Sparkles, title: t("feat_free_t"), desc: t("feat_free_d"), tone: "bg-sun/30 text-foreground" },
    { icon: ShieldCheck, title: t("feat_private_t"), desc: t("feat_private_d"), tone: "bg-mint/30 text-foreground" },
    { icon: Zap, title: t("feat_fast_t"), desc: t("feat_fast_d"), tone: "bg-sky/30 text-foreground" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(({ icon: Icon, title, desc, tone }) => (
        <div key={title} className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
            <Icon className="size-6" />
          </span>
          <div>
            <h3 className="font-sans text-base font-bold">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    { icon: Upload, title: t("how_1_t"), desc: t("how_1_d") },
    { icon: MousePointerClick, title: t("how_2_t"), desc: t("how_2_d") },
    { icon: Download, title: t("how_3_t"), desc: t("how_3_d") },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <h2 className="text-center text-3xl font-semibold sm:text-4xl">{t("how_title")}</h2>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, desc }, i) => (
          <li key={title} className="relative rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
            <span className="absolute -top-4 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
              {i + 1}
            </span>
            <span className="mx-auto mt-2 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="size-7" />
            </span>
            <h3 className="mt-4 font-sans text-lg font-bold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
