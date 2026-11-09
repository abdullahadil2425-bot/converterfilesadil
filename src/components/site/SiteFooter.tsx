import { Link } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n/context";
import { CATEGORIES, TOOLS, toolText } from "@/lib/tools";

import { Logo } from "./Logo";

export function SiteFooter() {
  const { t, lang } = useI18n();

  return (
    <footer className="mt-24 border-t border-border bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t("footer_desc")}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link to="/about" className="text-muted-foreground hover:text-foreground">{t("nav_about")}</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground">{t("nav_contact")}</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">{t("privacy")}</Link>
          </div>
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <h3 className="mb-3 font-sans text-sm font-semibold text-foreground">{t(`cat_${cat}`)}</h3>
            <ul className="space-y-2">
              {TOOLS.filter((tool) => tool.category === cat).map((tool) => (
                <li key={tool.slug}>
                  <Link
                    to="/tools/$slug"
                    params={{ slug: tool.slug }}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {toolText(tool, lang).name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} PDFKor. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
