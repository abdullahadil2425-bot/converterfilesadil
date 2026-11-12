export type OutFile = { name: string; blob: Blob };

export class ToolError extends Error {
  constructor(public code: "pages" | "nofile" | "generic" | "password" | "signature") {
    super(code);
  }
}

export const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || "file";

export const isRtl = (s: string) => /[\u0590-\u08FF\uFB1D-\uFEFC]/.test(s);

/** Returns the first chosen file, or throws a friendly "choose a file" error. */
export function one(files: File[]): File {
  const f = files[0];
  if (!f) throw new ToolError("nofile");
  return f;
}

/** Text from the chosen file, or from the paste box when no file was chosen. */
export async function readInput(files: File[], pasted: string, fallbackName: string): Promise<{ text: string; name: string }> {
  const file = files[0];
  const text = file ? await file.text() : pasted;
  if (!text.trim()) throw new ToolError("nofile");
  return { text, name: file ? baseName(file.name) : fallbackName };
}

export function textBlob(text: string, type: string): Blob {
  return new Blob([text], { type: `${type};charset=utf-8` });
}

export function wrapHtml(body: string, title: string): string {
  const safeTitle = title.replace(/[<>&]/g, "");
  return `<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title><style>body{font-family:system-ui,"Noto Sans",Arial,sans-serif;line-height:1.6;max-width:860px;margin:2rem auto;padding:0 1rem}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 8px}img{max-width:100%}</style></head><body dir="auto">\n${body}\n</body></html>\n`;
}

/** 24-bit BMP encoder (browsers cannot export BMP from a canvas). */
export function encodeBmp(width: number, height: number, rgba: Uint8ClampedArray): Uint8Array {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const dataSize = rowSize * height;
  const fileSize = 54 + dataSize;
  const buf = new Uint8Array(fileSize);
  const view = new DataView(buf.buffer);
  buf[0] = 0x42;
  buf[1] = 0x4d;
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, dataSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  for (let y = 0; y < height; y++) {
    const src = (height - 1 - y) * width * 4;
    const dst = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const s = src + x * 4;
      const d = dst + x * 3;
      buf[d] = rgba[s + 2] ?? 0;
      buf[d + 1] = rgba[s + 1] ?? 0;
      buf[d + 2] = rgba[s] ?? 0;
    }
  }
  return buf;
}

/** Wraps one PNG (up to 256×256) into an .ico file. */
export function encodeIco(png: Uint8Array, width: number, height: number): Uint8Array {
  const buf = new Uint8Array(22 + png.length);
  const view = new DataView(buf.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  buf[6] = width >= 256 ? 0 : width;
  buf[7] = height >= 256 ? 0 : height;
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, png.length, true);
  view.setUint32(18, 22, true);
  buf.set(png, 22);
  return buf;
}
