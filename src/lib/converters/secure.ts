// Password and signature tools. Uses the pdf-lib fork that supports encryption.
import { openPdfForEdit } from "./pdf-open";
import { baseName, ToolError, type OutFile } from "./shared";

export type SignWhere = "last" | "first" | "all" | "page";

async function lib() {
  return import("@cantoo/pdf-lib");
}

async function save(doc: { save: () => Promise<Uint8Array> }, name: string): Promise<OutFile> {
  const bytes = await doc.save();
  return { name, blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }) };
}

export async function protectPdf(file: File, password: string): Promise<OutFile[]> {
  if (!password.trim()) throw new ToolError("password");
  const { PDFDocument } = await lib();
  let doc;
  try {
    doc = await PDFDocument.load(await file.arrayBuffer());
  } catch {
    // Already protected PDFs must be unlocked first.
    throw new ToolError("password");
  }
  doc.encrypt({ userPassword: password, ownerPassword: password });
  return [await save(doc, `${baseName(file.name)}-protected.pdf`)];
}

export async function unlockPdf(file: File, password: string): Promise<OutFile[]> {
  const { PDFDocument } = await lib();
  let doc;
  try {
    doc = await PDFDocument.load(await file.arrayBuffer(), { password });
  } catch {
    throw new ToolError("password");
  }
  delete (doc.context.trailerInfo as { Encrypt?: unknown }).Encrypt;
  return [await save(doc, `${baseName(file.name)}-unlocked.pdf`)];
}

/** Signature box as fractions of the page: top-left corner (x, y) and width w. */
export type SignBox = { x: number; y: number; w: number };
export const DEFAULT_SIGN_BOX: SignBox = { x: 0.63, y: 0.84, w: 0.3 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export async function signPdf(
  file: File,
  signaturePng: string,
  { where, page = 1, box = DEFAULT_SIGN_BOX }: { where: SignWhere; page?: number; box?: SignBox },
): Promise<OutFile[]> {
  if (!signaturePng) throw new ToolError("signature");
  const { doc } = await openPdfForEdit(await file.arrayBuffer());
  const bytes = Uint8Array.from(atob(signaturePng.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
  const img = await doc.embedPng(bytes);
  const pages = doc.getPages();
  let targets = pages;
  if (where === "first") targets = pages.slice(0, 1);
  else if (where === "last") targets = pages.slice(-1);
  else if (where === "page") {
    const chosen = pages[page - 1];
    if (!Number.isInteger(page) || !chosen) throw new ToolError("pages");
    targets = [chosen];
  }
  const w = clamp(box.w, 0.05, 1);
  for (const p of targets) {
    // Use the visible page area so placement matches the on-screen preview.
    const { width: pw, height: ph } = p.getSize();
    const width = pw * w;
    const height = (width * img.height) / img.width;
    const x = clamp(box.x, 0, 1 - w) * pw;
    const top = clamp(box.y, 0, 1) * ph;
    p.drawImage(img, { x, y: Math.max(0, ph - top - height), width, height });
  }
  const out = await doc.save();
  return [{ name: `${baseName(file.name)}-signed.pdf`, blob: new Blob([new Uint8Array(out)], { type: "application/pdf" }) }];
}
