import { Link } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n/context";
import { toolText, type ToolDef } from "@/lib/tools";

import { ToolGraphic } from "./ToolGraphic";

export function ToolCard({ tool }: { tool: ToolDef }) {
  const { lang, langParam } = useI18n();
  const { name, description } = toolText(tool, lang);

  return (
    <Link
      to="/{-$lang}/tools/$slug"
      params={{ lang: langParam, slug: tool.slug }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="bg-dots bg-muted/60 px-8 pt-5 pb-2">
        <ToolGraphic tool={tool} className="mx-auto max-w-40 transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="font-sans text-base font-bold text-foreground">{name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
