// Every conversion runs in the visitor's browser. Libraries load lazily per tool.
import { parsePageRanges } from "../page-ranges";
import { htmlToPdf, sanitizeHtml, textToHtml } from "./render-html";

export type Quality = "low" | "med" | "high";
export type RunOptions = {
  quality: Quality;
  angle: 90 | 180 | 270;
  pages: string;
  watermark: string;
  pasted: string;
};
export type OutFile = { name: string; blob: Blob };

export class ToolError extends Error {
  constructor(public code: "pages" | "nofile" | "generic") {
    super(code);
  }
}

const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || "file";
const PDF_MIME = "application/pdf";

// ---------- pdf.js helpers ----------

async function loadPdfJs() {
  const [lib, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  lib.GlobalWorkerOptions.workerSrc = worker.default;
  return lib;
}

async function openPdf(file: File) {
  const lib = await loadPdfJs();
  return lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), type, quality),
  );
}

type RenderedPage = { blob: Blob; widthPt: number; heightPt: number; dataUrl?: string };

async function renderPdfPages(
  file: File,
  scale: number,
  type: "image/jpeg" | "image/png",
  quality = 0.9,
  withDataUrl = false,
): Promise<RenderedPage[]> {
  const doc = await openPdf(file);
  const out: RenderedPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const blob = await canvasToBlob(canvas, type, quality);
    out.push({
      blob,
      widthPt: base.width,
      heightPt: base.height,
      ...(withDataUrl ? { dataUrl: canvas.toDataURL(type, quality) } : {}),
    });
    page.cleanup();
  }
  await doc.cleanup();
  return out;
}

type Line = { cells: string[]; text: string };

/** Extracts text per page, grouped into visual lines; big horizontal gaps split cells. */
async function extractPdfLines(file: File): Promise<Line[][]> {
  const doc = await openPdf(file);
  const pages: Line[][] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; w: number; str: string }[]>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const x = Number(item.transform[4]);
      const y = Math.round(Number(item.transform[5]) / 3) * 3;
      const row = rows.get(y) ?? [];
      row.push({ x, w: item.width, str: item.str });
      rows.set(y, row);
    }
    const lines: Line[] = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) => {
        items.sort((a, b) => a.x - b.x);
        const cells: string[] = [];
        let text = "";
        let current = "";
        let prevEnd = -Infinity;
        for (const it of items) {
          const gap = it.x - prevEnd;
          if (current && gap > 14) {
            cells.push(current.trim());
            current = "";
          }
          const sep = text && gap > 1 ? " " : "";
          text += sep + it.str;
          current += (current && gap > 1 ? " " : "") + it.str;
          prevEnd = it.x + it.w;
        }
        if (current.trim()) cells.push(current.trim());
        return { cells, text: text.replace(/\s+/g, " ").trim() };
      });
    pages.push(lines);
    page.cleanup();
  }
  await doc.cleanup();
  return pages;
}

// ---------- image helpers ----------

async function loadImageCanvas(file: File, background?: string): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

async function convertImage(file: File, type: "image/jpeg" | "image/png" | "image/webp", ext: string): Promise<OutFile> {
  const canvas = await loadImageCanvas(file, type === "image/jpeg" ? "#ffffff" : undefined);
  return { name: `${baseName(file.name)}.${ext}`, blob: await canvasToBlob(canvas, type, 0.92) };
}

// ---------- tool implementations ----------

async function imagesToPdf(files: File[]): Promise<OutFile[]> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  for (const file of files) {
    let img;
    if (file.type === "image/jpeg") img = await pdf.embedJpg(await file.arrayBuffer());
    else if (file.type === "image/png") img = await pdf.embedPng(await file.arrayBuffer());
    else img = await pdf.embedPng(await (await canvasToBlob(await loadImageCanvas(file), "image/png")).arrayBuffer());

    const landscape = img.width > img.height;
    const [pw, ph] = landscape ? [842, 595] : [595, 842];
    const margin = 24;
    const scale = Math.min((pw - margin * 2) / img.width, (ph - margin * 2) / img.height, 1);
    const w = img.width * scale;
    const h = img.height * scale;
    const page = pdf.addPage([pw, ph]);
    page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
  const bytes = await pdf.save();
  const name = files.length === 1 && files[0] ? `${baseName(files[0].name)}.pdf` : "images.pdf";
  return [{ name, blob: new Blob([bytes as BlobPart], { type: PDF_MIME }) }];
}

async function wordToPdf(file: File): Promise<OutFile[]> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  return [{ name: `${baseName(file.name)}.pdf`, blob: await htmlToPdf(result.value) }];
}

async function excelToPdf(file: File): Promise<OutFile[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const html = wb.SheetNames.map((name) => {
    const sheet = wb.Sheets[name];
    if (!sheet) return "";
    const table = XLSX.utils.sheet_to_html(sheet, { header: "", footer: "" });
    return wb.SheetNames.length > 1 ? `<h2>${name}</h2>${table}` : table;
  }).join("");
  return [{ name: `${baseName(file.name)}.pdf`, blob: await htmlToPdf(sanitizeHtml(html)) }];
}

async function textToPdf(files: File[], pasted: string): Promise<OutFile[]> {
  const file = files[0];
  const text = file ? await file.text() : pasted;
  if (!text.trim()) throw new ToolError("nofile");
  return [{ name: `${file ? baseName(file.name) : "text"}.pdf`, blob: await htmlToPdf(textToHtml(text)) }];
}

async function htmlFileToPdf(files: File[], pasted: string): Promise<OutFile[]> {
  const file = files[0];
  const html = file ? await file.text() : pasted;
  if (!html.trim()) throw new ToolError("nofile");
  return [{ name: `${file ? baseName(file.name) : "page"}.pdf`, blob: await htmlToPdf(sanitizeHtml(html)) }];
}

const isRtl = (s: string) => /[\u0590-\u08FF\uFB1D-\uFEFC]/.test(s);

async function pdfToWord(file: File): Promise<OutFile[]> {
  const [pages, docx] = await Promise.all([extractPdfLines(file), import("docx")]);
  const { Document, Packer, Paragraph, TextRun } = docx;
  const doc = new Document({
    sections: pages.map((lines) => ({
      children: (lines.length ? lines : [{ text: "", cells: [] }]).map(
        (line) =>
          new Paragraph({
            bidirectional: isRtl(line.text),
            children: [new TextRun({ text: line.text, rightToLeft: isRtl(line.text) })],
          }),
      ),
    })),
  });
  return [{ name: `${baseName(file.name)}.docx`, blob: await Packer.toBlob(doc) }];
}

async function pdfToExcel(file: File): Promise<OutFile[]> {
  const [pages, XLSX] = await Promise.all([extractPdfLines(file), import("xlsx")]);
  const wb = XLSX.utils.book_new();
  pages.forEach((lines, i) => {
    const ws = XLSX.utils.aoa_to_sheet(lines.map((l) => l.cells));
    XLSX.utils.book_append_sheet(wb, ws, `Page ${i + 1}`);
  });
  const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return [
    {
      name: `${baseName(file.name)}.xlsx`,
      blob: new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    },
  ];
}

async function pdfToText(file: File): Promise<OutFile[]> {
  const pages = await extractPdfLines(file);
  const text = pages.map((lines) => lines.map((l) => l.text).join("\n")).join("\n\n");
  return [{ name: `${baseName(file.name)}.txt`, blob: new Blob([text], { type: "text/plain;charset=utf-8" }) }];
}

async function pdfToImages(file: File, type: "image/jpeg" | "image/png", ext: string): Promise<OutFile[]> {
  const pages = await renderPdfPages(file, 2, type, 0.92);
  const base = baseName(file.name);
  return pages.map((p, i) => ({ name: pages.length > 1 ? `${base}-${i + 1}.${ext}` : `${base}.${ext}`, blob: p.blob }));
}

async function pdfToPowerPoint(file: File): Promise<OutFile[]> {
  const [pages, { default: PptxGenJS }] = await Promise.all([
    renderPdfPages(file, 2, "image/jpeg", 0.9, true),
    import("pptxgenjs"),
  ]);
  const first = pages[0];
  if (!first) throw new ToolError("generic");
  const pptx = new PptxGenJS();
  const w = 10;
  const h = (w * first.heightPt) / first.widthPt;
  pptx.defineLayout({ name: "PDF", width: w, height: h });
  pptx.layout = "PDF";
  for (const p of pages) {
    const slide = pptx.addSlide();
    if (p.dataUrl) slide.addImage({ data: p.dataUrl, x: 0, y: 0, w, h });
  }
  const blob = (await pptx.write({ outputType: "blob" })) as Blob;
  return [{ name: `${baseName(file.name)}.pptx`, blob }];
}

async function loadPdfLib(file: File) {
  const lib = await import("pdf-lib");
  const doc = await lib.PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  return { lib, doc };
}

async function savePdf(doc: { save: () => Promise<Uint8Array> }, name: string): Promise<OutFile> {
  const bytes = await doc.save();
  return { name, blob: new Blob([bytes as BlobPart], { type: PDF_MIME }) };
}

async function mergePdf(files: File[]): Promise<OutFile[]> {
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return [await savePdf(out, "merged.pdf")];
}

async function splitPdf(file: File): Promise<OutFile[]> {
  const { lib, doc } = await loadPdfLib(file);
  const base = baseName(file.name);
  const out: OutFile[] = [];
  for (const i of doc.getPageIndices()) {
    const single = await lib.PDFDocument.create();
    const [page] = await single.copyPages(doc, [i]);
    if (page) single.addPage(page);
    out.push(await savePdf(single, `${base}-page-${i + 1}.pdf`));
  }
  return out;
}

async function selectPages(file: File, pagesText: string, mode: "keep" | "remove"): Promise<OutFile[]> {
  const { lib, doc } = await loadPdfLib(file);
  const total = doc.getPageCount();
  const chosen = parsePageRanges(pagesText, total);
  if (!chosen) throw new ToolError("pages");
  const keep = mode === "keep" ? chosen : doc.getPageIndices().filter((i) => !chosen.includes(i));
  if (keep.length === 0) throw new ToolError("pages");
  const out = await lib.PDFDocument.create();
  const copied = await out.copyPages(doc, keep);
  copied.forEach((p) => out.addPage(p));
  return [await savePdf(out, `${baseName(file.name)}-${mode === "keep" ? "extracted" : "edited"}.pdf`)];
}

async function rotatePdf(file: File, angle: number): Promise<OutFile[]> {
  const { lib, doc } = await loadPdfLib(file);
  for (const page of doc.getPages()) {
    page.setRotation(lib.degrees((page.getRotation().angle + angle) % 360));
  }
  return [await savePdf(doc, `${baseName(file.name)}-rotated.pdf`)];
}

async function addPageNumbers(file: File): Promise<OutFile[]> {
  const { lib, doc } = await loadPdfLib(file);
  const font = await doc.embedFont(lib.StandardFonts.Helvetica);
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const label = `${i + 1} / ${pages.length}`;
    const size = 10;
    const width = font.widthOfTextAtSize(label, size);
    page.drawText(label, {
      x: (page.getWidth() - width) / 2,
      y: 22,
      size,
      font,
      color: lib.rgb(0.35, 0.38, 0.45),
    });
  });
  return [await savePdf(doc, `${baseName(file.name)}-numbered.pdf`)];
}

/** Draws watermark text into a PNG so any language renders with the browser's fonts. */
async function watermarkPng(text: string): Promise<Uint8Array> {
  const fontSize = 120;
  const font = `700 ${fontSize}px "Vazirmatn","Noto Sans","Noto Sans SC",Arial,sans-serif`;
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) throw new Error("Canvas not available");
  probe.font = font;
  const width = Math.ceil(probe.measureText(text).width) + 40;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.ceil(fontSize * 1.5);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.font = font;
  ctx.fillStyle = "rgba(214, 69, 54, 1)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const blob = await canvasToBlob(canvas, "image/png");
  return new Uint8Array(await blob.arrayBuffer());
}

async function addWatermark(file: File, text: string): Promise<OutFile[]> {
  const label = text.trim() || "CONFIDENTIAL";
  const { lib, doc } = await loadPdfLib(file);
  const img = await doc.embedPng(await watermarkPng(label));
  const theta = Math.PI / 4;
  for (const page of doc.getPages()) {
    const pw = page.getWidth();
    const ph = page.getHeight();
    const w = Math.min(pw, ph) * 0.95;
    const h = (w * img.height) / img.width;
    const cx = pw / 2;
    const cy = ph / 2;
    page.drawImage(img, {
      x: cx - (w * Math.cos(theta) - h * Math.sin(theta)) / 2,
      y: cy - (w * Math.sin(theta) + h * Math.cos(theta)) / 2,
      width: w,
      height: h,
      rotate: lib.degrees(45),
      opacity: 0.22,
    });
  }
  return [await savePdf(doc, `${baseName(file.name)}-watermark.pdf`)];
}

const COMPRESSION: Record<Quality, { scale: number; q: number }> = {
  low: { scale: 1, q: 0.5 },
  med: { scale: 1.4, q: 0.65 },
  high: { scale: 1.8, q: 0.8 },
};

async function compressPdf(file: File, quality: Quality): Promise<OutFile[]> {
  const { scale, q } = COMPRESSION[quality];
  const [pages, { PDFDocument }] = await Promise.all([
    renderPdfPages(file, scale, "image/jpeg", q),
    import("pdf-lib"),
  ]);
  const out = await PDFDocument.create();
  for (const p of pages) {
    const img = await out.embedJpg(await p.blob.arrayBuffer());
    const page = out.addPage([p.widthPt, p.heightPt]);
    page.drawImage(img, { x: 0, y: 0, width: p.widthPt, height: p.heightPt });
  }
  const result = await savePdf(out, `${baseName(file.name)}-compressed.pdf`);
  // Never hand back a bigger file than the original.
  if (result.blob.size >= file.size) return [{ name: result.name, blob: file }];
  return [result];
}

export async function runTool(slug: string, files: File[], opts: RunOptions): Promise<OutFile[]> {
  const first = files[0];
  const needsFile = !(slug === "text-to-pdf" || slug === "html-to-pdf");
  if (needsFile && !first) throw new ToolError("nofile");
  const f = first as File;

  switch (slug) {
    case "word-to-pdf":
      return wordToPdf(f);
    case "excel-to-pdf":
      return excelToPdf(f);
    case "jpg-to-pdf":
    case "png-to-pdf":
      return imagesToPdf(files);
    case "text-to-pdf":
      return textToPdf(files, opts.pasted);
    case "html-to-pdf":
      return htmlFileToPdf(files, opts.pasted);
    case "pdf-to-word":
      return pdfToWord(f);
    case "pdf-to-excel":
      return pdfToExcel(f);
    case "pdf-to-powerpoint":
      return pdfToPowerPoint(f);
    case "pdf-to-jpg":
      return pdfToImages(f, "image/jpeg", "jpg");
    case "pdf-to-png":
      return pdfToImages(f, "image/png", "png");
    case "pdf-to-text":
      return pdfToText(f);
    case "merge-pdf":
      return mergePdf(files);
    case "split-pdf":
      return splitPdf(f);
    case "compress-pdf":
      return compressPdf(f, opts.quality);
    case "rotate-pdf":
      return rotatePdf(f, opts.angle);
    case "add-page-numbers":
      return addPageNumbers(f);
    case "add-watermark":
      return addWatermark(f, opts.watermark);
    case "delete-pages":
      return selectPages(f, opts.pages, "remove");
    case "extract-pages":
      return selectPages(f, opts.pages, "keep");
    case "image-to-jpg":
      return Promise.all(files.map((file) => convertImage(file, "image/jpeg", "jpg")));
    case "image-to-png":
      return Promise.all(files.map((file) => convertImage(file, "image/png", "png")));
    case "image-to-webp":
      return Promise.all(files.map((file) => convertImage(file, "image/webp", "webp")));
    default:
      throw new ToolError("generic");
  }
}

export async function zipFiles(files: OutFile[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.blob);
  return zip.generateAsync({ type: "blob" });
}
