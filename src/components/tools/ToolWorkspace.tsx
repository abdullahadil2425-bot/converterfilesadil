import { CheckCircle2, Download, FileIcon, Loader2, RotateCcw, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OutFile, Quality, RunOptions } from "@/lib/converters";
import type { DictKey } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/context";
import type { ToolDef } from "@/lib/tools";
import { cn } from "@/lib/utils";

type Status = "idle" | "working" | "done" | "error";
type Result = OutFile & { url: string };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function triggerDownload(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-muted p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
            value === o.value ? "bg-paper text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ToolWorkspace({ tool }: { tool: ToolDef }) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<DictKey | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [opts, setOpts] = useState<RunOptions>({ quality: "med", angle: 90, pages: "", watermark: "", pasted: "", password: "", signature: "", signWhere: "last" });

  useEffect(() => () => results.forEach((r) => URL.revokeObjectURL(r.url)), [results]);

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    setFiles((prev) => (tool.multiple ? [...prev, ...incoming] : incoming.slice(0, 1)));
    setError(null);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setStatus("idle");
    setError(null);
    setOpts((o) => ({ ...o, pasted: "" }));
  };

  const run = async () => {
    if (files.length === 0 && !(tool.paste && opts.pasted.trim())) {
      setError("err_nofile");
      return;
    }
    setStatus("working");
    setError(null);
    try {
      const { runTool, ToolError } = await import("@/lib/converters");
      try {
        const out = await runTool(tool.slug, files, opts);
        setResults(out.map((f) => ({ ...f, url: URL.createObjectURL(f.blob) })));
        setStatus("done");
      } catch (err) {
        console.error(err);
        setError(err instanceof ToolError && err.code === "password" ? "err_password" : err instanceof ToolError && err.code === "signature" ? "err_nosign" : err instanceof ToolError && err.code === "pages" ? "err_pages" : err instanceof ToolError && err.code === "nofile" ? "err_nofile" : "err_generic");
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setError("err_generic");
      setStatus("error");
    }
  };

  const downloadAll = async () => {
    const { zipFiles } = await import("@/lib/converters");
    const zip = await zipFiles(results);
    const url = URL.createObjectURL(zip);
    triggerDownload(url, `${tool.slug}.zip`);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  if (status === "done") {
    const totalIn = files.reduce((s, f) => s + f.size, 0);
    const totalOut = results.reduce((s, r) => s + r.blob.size, 0);
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-mint/30 text-fmt-excel">
            <CheckCircle2 className="size-8" />
          </span>
          <h2 className="text-2xl font-semibold">{t("done_title")}</h2>
          {tool.slug === "compress-pdf" && totalIn > 0 && (
            <p dir="ltr" className="text-sm font-semibold text-muted-foreground">
              {formatSize(totalIn)} → <span className="text-foreground">{formatSize(totalOut)}</span>
            </p>
          )}
        </div>
        <ul className="mx-auto mt-6 max-h-80 max-w-xl space-y-2 overflow-y-auto">
          {results.map((r) => (
            <li key={r.url} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
              <FileIcon className="size-5 shrink-0 text-primary" />
              <span dir="ltr" className="min-w-0 flex-1 truncate text-sm font-medium">{r.name}</span>
              <span dir="ltr" className="text-xs text-muted-foreground">{formatSize(r.blob.size)}</span>
              <Button size="sm" onClick={() => triggerDownload(r.url, r.name)} className="gap-1.5 rounded-full">
                <Download className="size-4" />
                <span className="hidden sm:inline">{t("download")}</span>
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {results.length > 1 && (
            <Button onClick={downloadAll} size="lg" className="gap-2 rounded-full">
              <Download className="size-4" /> {t("download_all")}
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={reset} className="gap-2 rounded-full bg-paper">
            <RotateCcw className="size-4" /> {t("again")}
          </Button>
        </div>
      </div>
    );
  }

  const working = status === "working";

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-6">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border bg-dots bg-muted/50 hover:border-primary/60",
        )}
      >
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lift">
          <UploadCloud className="size-8" />
        </span>
        <p className="font-display text-xl font-semibold">{t("drop_title")}</p>
        <p className="text-sm text-muted-foreground">{t("drop_hint")}</p>
        <input
          ref={inputRef}
          type="file"
          accept={tool.accept}
          multiple={tool.multiple}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{t("selected")}</p>
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2.5">
                <FileIcon className="size-5 shrink-0 text-primary" />
                <span dir="ltr" className="min-w-0 flex-1 truncate text-sm font-medium">{f.name}</span>
                <span dir="ltr" className="text-xs text-muted-foreground">{formatSize(f.size)}</span>
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tool.paste && files.length === 0 && (
        <div className="mt-5 space-y-2">
          <Label htmlFor="paste">{t("paste_label")}</Label>
          <Textarea
            id="paste"
            dir="auto"
            rows={6}
            value={opts.pasted}
            onChange={(e) => setOpts({ ...opts, pasted: e.target.value })}
            className="rounded-2xl bg-background"
          />
        </div>
      )}

      {tool.option && (
        <div className="mt-5 space-y-2">
          {tool.option === "quality" && (
            <>
              <Label>{t("opt_quality")}</Label>
              <div>
                <Segmented<Quality>
                  value={opts.quality}
                  onChange={(quality) => setOpts({ ...opts, quality })}
                  options={[
                    { value: "low", label: t("q_low") },
                    { value: "med", label: t("q_med") },
                    { value: "high", label: t("q_high") },
                  ]}
                />
              </div>
            </>
          )}
          {tool.option === "angle" && (
            <>
              <Label>{t("opt_angle")}</Label>
              <div dir="ltr">
                <Segmented<90 | 180 | 270>
                  value={opts.angle}
                  onChange={(angle) => setOpts({ ...opts, angle })}
                  options={[
                    { value: 90, label: "90°" },
                    { value: 180, label: "180°" },
                    { value: 270, label: "270°" },
                  ]}
                />
              </div>
            </>
          )}
          {tool.option === "pages" && (
            <>
              <Label htmlFor="pages">{t("opt_pages")}</Label>
              <Input
                id="pages"
                dir="ltr"
                inputMode="numeric"
                placeholder="1,3,5-7"
                value={opts.pages}
                onChange={(e) => setOpts({ ...opts, pages: e.target.value })}
                className="max-w-xs rounded-xl bg-background"
              />
            </>
          )}
          {tool.option === "password" && (
            <>
              <Label htmlFor="password">{t("opt_password")}</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                value={opts.password}
                onChange={(e) => setOpts({ ...opts, password: e.target.value })}
                className="max-w-xs rounded-xl bg-background"
              />
            </>
          )}
          {tool.option === "watermark" && (
            <>
              <Label htmlFor="watermark">{t("opt_watermark")}</Label>
              <Input
                id="watermark"
                dir="auto"
                placeholder="CONFIDENTIAL"
                value={opts.watermark}
                onChange={(e) => setOpts({ ...opts, watermark: e.target.value })}
                className="max-w-sm rounded-xl bg-background"
              />
            </>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {t(error)}
        </p>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        <Button size="lg" onClick={run} disabled={working} className="min-w-48 gap-2 rounded-full text-base shadow-lift">
          {working && <Loader2 className="size-5 animate-spin" />}
          {working ? t("working") : t("start")}
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-fmt-excel" /> {t("private_note")}
        </p>
      </div>
    </div>
  );
}
