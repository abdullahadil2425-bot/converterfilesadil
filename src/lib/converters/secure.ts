// Password and signature tools. Uses the pdf-lib fork that supports encryption.
import { baseName, ToolError, type OutFile } from "./shared";

export type SignWhere = "last" | "first" | "all";

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
  doc.context.trailerInfo.Encrypt = undefined;
  return [await save(doc, `${baseName(file.name)}-unlocked.pdf`)];
}

export async function signPdf(file: File, signaturePng: string, where: SignWhere): Promise<OutFile[]> {
  if (!signaturePng) throw new ToolError("signature");
  const { PDFDocument } = await lib();
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const bytes = Uint8Array.from(atob(signaturePng.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
  const img = await doc.embedPng(bytes);
  const pages = doc.getPages();
  const targets = where === "all" ? pages : where === "first" ? pages.slice(0, 1) : pages.slice(-1);
  for (const page of targets) {
    const pw = page.getWidth();
    const w = pw * 0.3;
    const h = (w * img.height) / img.width;
    page.drawImage(img, { x: pw - w - pw * 0.07, y: page.getHeight() * 0.06, width: w, height: h });
  }
  return [await save(doc, `${baseName(file.name)}-signed.pdf`)];
}
