import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { Slider } from "@/components/ui/slider";
import type { SignBox } from "@/lib/converters/secure";

type Props = {
  file: File;
  /** 1-based page shown in the preview. */
  page: number;
  signature: string;
  box: SignBox;
  onBoxChange: (box: SignBox) => void;
  onPageCount: (n: number) => void;
  sizeLabel: string;
  dragHint: string;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Shows the real PDF page with the signature on top; drag to move, slider to resize. */
export function SignPlacer({ file, page, signature, box, onBoxChange, onPageCount, sizeLabel, dragHint }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [ratio, setRatio] = useState(0.4);
  const areaRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    let alive = true;
    setPreview(null);
    setFailed(false);
    import("@/lib/converters/preview")
      .then(({ renderPagePreview }) => renderPagePreview(file, page))
      .then(({ url, numPages }) => {
        if (!alive) return;
        setPreview(url);
        onPageCount(numPages);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
    // onPageCount is a state setter from the parent; re-render only when file or page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, page]);

  useEffect(() => {
    if (!signature) return;
    const img = new Image();
    img.onload = () => img.width && setRatio(img.height / img.width);
    img.src = signature;
  }, [signature]);

  const area = () => areaRef.current?.getBoundingClientRect();

  const down = (e: PointerEvent<HTMLImageElement>) => {
    const r = area();
    if (!r) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: (e.clientX - r.left) / r.width - box.x, dy: (e.clientY - r.top) / r.height - box.y };
  };
  const move = (e: PointerEvent<HTMLImageElement>) => {
    const r = area();
    if (!drag.current || !r) return;
    const hFrac = (box.w * ratio * r.width) / r.height;
    onBoxChange({
      ...box,
      x: clamp((e.clientX - r.left) / r.width - drag.current.dx, 0, 1 - box.w),
      y: clamp((e.clientY - r.top) / r.height - drag.current.dy, 0, Math.max(0, 1 - hFrac)),
    });
  };
  const up = () => {
    drag.current = null;
  };

  if (failed) return null;

  return (
    <div className="space-y-3">
      <div ref={areaRef} className="relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-border bg-paper shadow-soft">
        {preview ? (
          <img src={preview} alt="" className="block w-full select-none" draggable={false} />
        ) : (
          <div className="flex aspect-[1/1.414] items-center justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
        {preview && signature && (
          <img
            src={signature}
            alt=""
            draggable={false}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            data-testid="sign-overlay"
            className="absolute cursor-move touch-none rounded-sm outline-2 outline-dashed outline-primary/70"
            style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%` }}
          />
        )}
      </div>
      {signature && (
        <div className="mx-auto max-w-sm space-y-2">
          <p className="text-center text-xs text-muted-foreground">{dragHint}</p>
          <label className="block text-sm font-semibold">{sizeLabel}</label>
          <Slider
            aria-label={sizeLabel}
            min={10}
            max={60}
            step={1}
            value={[Math.round(box.w * 100)]}
            onValueChange={([v]) => {
              const w = (v ?? 30) / 100;
              onBoxChange({ ...box, w, x: clamp(box.x, 0, 1 - w) });
            }}
          />
        </div>
      )}
    </div>
  );
}
