// Checks real file content (not just the name) before a tool runs.
import type { Fmt } from "../tools";
import { MAX_FILE_BYTES, ToolError } from "./shared";

const ext = (name: string) => name.toLowerCase().split(".").pop() ?? "";

function startsWith(head: Uint8Array, bytes: number[]) {
  return bytes.every((b, i) => head[i] === b);
}

const ZIP = [0x50, 0x4b, 0x03, 0x04];
const OLE = [0xd0, 0xcf, 0x11, 0xe0];

function isImage(file: File, head: Uint8Array) {
  if (file.type.startsWith("image/")) return true;
  const ascii = String.fromCharCode(...head.slice(0, 12));
  return (
    startsWith(head, [0xff, 0xd8, 0xff]) ||
    startsWith(head, [0x89, 0x50, 0x4e, 0x47]) ||
    ascii.startsWith("GIF8") ||
    ascii.startsWith("BM") ||
    (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP")
  );
}

/** True when the first bytes look like the format the tool expects. */
export function looksLike(from: Fmt, file: File, head: Uint8Array): boolean {
  const ascii = String.fromCharCode(...head.slice(0, 1024));
  switch (from) {
    case "pdf":
      return ascii.includes("%PDF");
    case "word":
    case "ppt":
      return startsWith(head, ZIP);
    case "excel":
      return ["csv", "txt"].includes(ext(file.name)) || startsWith(head, ZIP) || startsWith(head, OLE);
    case "jpg":
    case "png":
    case "webp":
    case "bmp":
    case "ico":
    case "image":
      return isImage(file, head);
    default:
      // Text formats: reject obvious binary files (NUL bytes near the start).
      return !head.slice(0, 1024).includes(0);
  }
}

export async function validateFiles(from: Fmt, files: File[]): Promise<void> {
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) throw new ToolError("toolarge");
    const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
    if (file.size === 0 || !looksLike(from, file, head)) throw new ToolError("badtype");
  }
}
