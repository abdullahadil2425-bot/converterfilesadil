import { useState } from "react";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { CATEGORIES, TOOLS, type ToolCategory } from "@/lib/tools";

import { ToolCard } from "./ToolCard";

export function ToolGrid() {
  const { t } = useI18n();
  const [active, setActive] = useState<ToolCategory | "all">("all");
  const visible = active === "all" ? TOOLS : TOOLS.filter((tool) => tool.category === active);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-center gap-2" role="tablist">
        {(["all", ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={active === cat}
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              active === cat
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-paper text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {t(`cat_${cat}`)}
          </button>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </div>
  );
}
