// Opens a PDF for editing with pdf-lib, handling password protection honestly.
import { ToolError } from "./shared";

/**
 * Returns a pdf-lib document. PDFs that only carry owner restrictions (no open password)
 * are decrypted first; PDFs that need a password to open throw ToolError("locked"),
 * so edits never silently produce a broken file.
 */
export async function openPdfForEdit(bytes: ArrayBuffer) {
  const lib = await import("pdf-lib");
  try {
    return { lib, doc: await lib.PDFDocument.load(bytes) };
  } catch (err) {
    if (!/encrypt/i.test(String((err as Error)?.message))) throw new ToolError("badtype");
  }
  const { PDFDocument: Decrypting } = await import("@cantoo/pdf-lib");
  let plain: Uint8Array;
  try {
    const enc = await Decrypting.load(bytes, { password: "" });
    delete (enc.context.trailerInfo as { Encrypt?: unknown }).Encrypt;
    plain = await enc.save();
  } catch {
    throw new ToolError("locked");
  }
  return { lib, doc: await lib.PDFDocument.load(plain) };
}

/** Maps pdf.js loading errors to friendly tool errors. */
export function pdfJsError(err: unknown): ToolError {
  const name = (err as { name?: string })?.name;
  if (name === "PasswordException") return new ToolError("locked");
  return new ToolError("badtype");
}
