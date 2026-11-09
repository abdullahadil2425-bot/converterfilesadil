import {
  ArrowRight,
  FileOutput,
  Hash,
  Merge,
  Minimize2,
  RotateCw,
  Scissors,
  Stamp,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { FORMATS, type EditIcon, type ToolDef } from "@/lib/tools";

const EDIT_ICONS: Record<EditIcon, LucideIcon> = {
  merge: Merge,
  split: Scissors,
  compress: Minimize2,
  rotate: RotateCw,
  numbers: Hash,
  watermark: Stamp,
  delete: Trash2,
  extract: FileOutput,
};

function FileShape({ x, y, colorVar, badge, tilt = 0 }: { x: number; y: number; colorVar: string; badge: string; tilt?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt} 23 29)`}>
      <path
        d="M7 0H32L46 14V51a7 7 0 0 1-7 7H7a7 7 0 0 1-7-7V7a7 7 0 0 1 7-7Z"
        fill={`var(${colorVar})`}
      />
      <path d="M32 0V9a5 5 0 0 0 5 5H46Z" fill="var(--paper)" opacity="0.55" />
      <rect x="8" y="18" width="20" height="3.2" rx="1.6" fill="var(--paper)" opacity="0.75" />
      <rect x="8" y="25" width="29" height="3.2" rx="1.6" fill="var(--paper)" opacity="0.5" />
      <text
        x="23"
        y="47"
        textAnchor="middle"
        fontSize={badge.length > 3 ? 9 : 11}
        fontWeight="800"
        fill="var(--paper)"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {badge}
      </text>
    </g>
  );
}

/** A small, friendly illustration for each tool: source file → target file, or a PDF with an action badge. */
export function ToolGraphic({ tool, className }: { tool: ToolDef; className?: string }) {
  const from = FORMATS[tool.from];
  const to = FORMATS[tool.to];
  const Icon = tool.edit ? EDIT_ICONS[tool.edit.icon] : ArrowRight;

  return (
    <div className={cn("relative aspect-[4/3] w-full", className)} dir="ltr">
      <svg viewBox="0 0 120 90" className="absolute inset-0 size-full" aria-hidden="true">
        <circle cx="60" cy="47" r="38" fill={`var(${tool.edit ? to.colorVar : from.colorVar})`} opacity="0.1" />
        <circle cx="96" cy="16" r="3" fill="var(--sun)" />
        <circle cx="20" cy="76" r="2.4" fill="var(--mint)" />
        <circle cx="16" cy="22" r="2" fill="var(--sky)" />
        {tool.edit ? (
          <>
            {tool.edit.icon === "merge" && <FileShape x={30} y={20} colorVar={from.colorVar} badge="" tilt={-10} />}
            <FileShape x={37} y={16} colorVar={to.colorVar} badge={to.badge} />
          </>
        ) : (
          <>
            <FileShape x={12} y={20} colorVar={from.colorVar} badge={from.badge} tilt={-7} />
            <FileShape x={62} y={14} colorVar={to.colorVar} badge={to.badge} tilt={4} />
          </>
        )}
      </svg>
      <span
        className={cn(
          "absolute flex items-center justify-center rounded-full border-2 border-paper bg-foreground text-paper shadow-soft",
          tool.edit ? "right-[17%] bottom-[10%] size-[24%]" : "top-1/2 left-1/2 size-[20%] -translate-x-1/2 -translate-y-1/4",
        )}
      >
        <Icon className="size-1/2" strokeWidth={2.5} />
      </span>
    </div>
  );
}
