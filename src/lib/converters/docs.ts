// Office and document conversions that do not involve PDF. Libraries load lazily.
import { escapeHtml, sanitizeHtml } from "./render-html";
import { baseName, isRtl, one, readInput, textBlob, wrapHtml, ToolError, type OutFile } from "./shared";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// ---------- Word ----------

export async function wordToText(files: File[]): Promise<OutFile[]> {
  const file = one(files);
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return [{ name: `${baseName(file.name)}.txt`, blob: textBlob(value, "text/plain") }];
}

export async function wordToHtml(files: File[]): Promise<OutFile[]> {
  const file = one(files);
  const mammoth = await import("mammoth");
  const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const name = baseName(file.name);
  return [{ name: `${name}.html`, blob: textBlob(wrapHtml(value, name), "text/html") }];
}

async function linesToDocx(lines: string[]): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const doc = new Document({
    sections: [
      {
        children: lines.map(
          (line) =>
            new Paragraph({
              bidirectional: isRtl(line),
              children: [new TextRun({ text: line, rightToLeft: isRtl(line) })],
            }),
        ),
      },
    ],
  });
  return Packer.toBlob(doc);
}

export async function textToWord(files: File[], pasted: string): Promise<OutFile[]> {
  const { text, name } = await readInput(files, pasted, "text");
  return [{ name: `${name}.docx`, blob: await linesToDocx(text.split(/\r?\n/)) }];
}

const BLOCKS = "p,div,h1,h2,h3,h4,h5,h6,li,tr,br,pre,blockquote,section,article,header,footer";

function htmlToLines(html: string): string[] {
  const doc = new DOMParser().parseFromString(sanitizeHtml(html), "text/html");
  doc.querySelectorAll("style").forEach((el) => el.remove());
  doc.querySelectorAll(BLOCKS).forEach((el) => el.append("\n"));
  doc.querySelectorAll("td,th").forEach((el) => el.append("\t"));
  return (doc.body.textContent ?? "")
    .split("\n")
    .map((l) => l.replace(/[ \u00a0]+/g, " ").trim())
    .filter((l, i, arr) => l || (i > 0 && arr[i - 1]));
}

export async function htmlToWord(files: File[], pasted: string): Promise<OutFile[]> {
  const { text, name } = await readInput(files, pasted, "page");
  return [{ name: `${name}.docx`, blob: await linesToDocx(htmlToLines(text)) }];
}

export async function htmlToText(files: File[], pasted: string): Promise<OutFile[]> {
  const { text, name } = await readInput(files, pasted, "page");
  return [{ name: `${name}.txt`, blob: textBlob(htmlToLines(text).join("\n"), "text/plain") }];
}

export async function textToHtml(files: File[], pasted: string): Promise<OutFile[]> {
  const { text, name } = await readInput(files, pasted, "text");
  const body = text
    .split(/\r?\n/)
    .map((l) => (l.trim() ? `<p dir="auto">${escapeHtml(l)}</p>` : ""))
    .join("\n");
  return [{ name: `${name}.html`, blob: textBlob(wrapHtml(body, name), "text/html") }];
}

// ---------- Excel / CSV / JSON ----------

async function readWorkbook(file: File) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  return { XLSX, wb };
}

function xlsxBlob(XLSX: typeof import("xlsx"), wb: import("xlsx").WorkBook): Blob {
  const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([bytes], { type: XLSX_MIME });
}

const safeSheetName = (s: string) => s.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Sheet";

export async function excelToCsv(files: File[]): Promise<OutFile[]> {
  const file = one(files);
  const { XLSX, wb } = await readWorkbook(file);
  const base = baseName(file.name);
  return wb.SheetNames.flatMap((sheetName) => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return [];
    // A byte-order mark lets Excel open non-Latin text (Pashto, Arabic, ...) correctly.
    const csv = "\ufeff" + XLSX.utils.sheet_to_csv(sheet);
    const name = wb.SheetNames.length > 1 ? `${base}-${sheetName}.csv` : `${base}.csv`;
    return [{ name, blob: textBlob(csv, "text/csv") }];
  });
}

export async function csvToExcel(files: File[], pasted: string): Promise<OutFile[]> {
  const { text, name } = await readInput(files, pasted, "table");
  const XLSX = await import("xlsx");
  const wb = XLSX.read(text.replace(/^\ufeff/, ""), { type: "string", raw: false });
  return [{ name: `${name}.xlsx`, blob: xlsxBlob(XLSX, wb) }];
}

export async function excelToJson(files: File[]): Promise<OutFile[]> {
  const file = one(files);
  const { XLSX, wb } = await readWorkbook(file);
  const sheets = Object.fromEntries(
    wb.SheetNames.map((n) => [n, wb.Sheets[n] ? XLSX.utils.sheet_to_json(wb.Sheets[n] as import("xlsx").WorkSheet) : []]),
  );
  const data = wb.SheetNames.length === 1 ? Object.values(sheets)[0] : sheets;
  return [{ name: `${baseName(file.name)}.json`, blob: textBlob(JSON.stringify(data, null, 2), "application/json") }];
}

export async function jsonToExcel(files: File[], pasted: string): Promise<OutFile[]> {
  const { text, name } = await readInput(files, pasted, "data");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ToolError("generic");
  }
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const toSheet = (value: unknown) => {
    const rows = Array.isArray(value) ? value : [value];
    if (rows.every((r) => Array.isArray(r))) return XLSX.utils.aoa_to_sheet(rows as unknown[][]);
    const objects = rows.map((r) => (r && typeof r === "object" ? flatten(r as Record<string, unknown>) : { value: r }));
    return XLSX.utils.json_to_sheet(objects);
  };
  const isSheetMap =
    data && typeof data === "object" && !Array.isArray(data) && Object.values(data).length > 0 && Object.values(data).every(Array.isArray);
  if (isSheetMap) {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      XLSX.utils.book_append_sheet(wb, toSheet(value), safeSheetName(key));
    }
  } else {
    XLSX.utils.book_append_sheet(wb, toSheet(data), "Sheet1");
  }
  return [{ name: `${name}.xlsx`, blob: xlsxBlob(XLSX, wb) }];
}

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v as Record<string, unknown>, key));
    else out[key] = Array.isArray(v) ? JSON.stringify(v) : v;
  }
  return out;
}

export async function excelToHtml(files: File[]): Promise<OutFile[]> {
  const file = one(files);
  const { XLSX, wb } = await readWorkbook(file);
  const body = wb.SheetNames.map((n) => {
    const sheet = wb.Sheets[n];
    if (!sheet) return "";
    const table = XLSX.utils.sheet_to_html(sheet, { header: "", footer: "" });
    return wb.SheetNames.length > 1 ? `<h2>${escapeHtml(n)}</h2>${table}` : table;
  }).join("\n");
  const name = baseName(file.name);
  return [{ name: `${name}.html`, blob: textBlob(wrapHtml(body, name), "text/html") }];
}

// ---------- PowerPoint ----------

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/** Reads the text of each slide, paragraph by paragraph. */
async function readSlides(file: File): Promise<string[][]> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
  if (slidePaths.length === 0) throw new ToolError("generic");
  const slides: string[][] = [];
  for (const path of slidePaths) {
    const xml = (await zip.file(path)?.async("string")) ?? "";
    const paragraphs = (xml.match(/<a:p>[\s\S]*?<\/a:p>|<a:p [\s\S]*?<\/a:p>/g) ?? [])
      .map((p) => decodeXml((p.match(/<a:t>([^<]*)<\/a:t>/g) ?? []).map((t) => t.slice(5, -6)).join("")).trim())
      .filter(Boolean);
    slides.push(paragraphs);
  }
  return slides;
}

export async function powerpointToText(files: File[]): Promise<OutFile[]> {
  const file = one(files);
  const slides = await readSlides(file);
  const text = slides.map((s, i) => `— ${i + 1} —\n${s.join("\n")}`).join("\n\n");
  return [{ name: `${baseName(file.name)}.txt`, blob: textBlob(text, "text/plain") }];
}

export async function powerpointToWord(files: File[]): Promise<OutFile[]> {
  const file = one(files);
  const slides = await readSlides(file);
  const lines = slides.flatMap((s, i) => [`${i + 1}.`, ...s, ""]);
  return [{ name: `${baseName(file.name)}.docx`, blob: await linesToDocx(lines) }];
}

export async function powerpointToPdf(files: File[]): Promise<OutFile[]> {
  const file = one(files);
  const slides = await readSlides(file);
  const { htmlToPdf } = await import("./render-html");
  const html = slides
    .map(
      (s, i) =>
        `<section style="border:1px solid #cfd4dc;border-radius:12px;padding:24px;margin:0 0 20px"><p style="color:#8a8f99;font-size:12px">${i + 1}</p>${s
          .map((p, j) => (j === 0 ? `<h2 dir="auto">${escapeHtml(p)}</h2>` : `<p dir="auto">${escapeHtml(p)}</p>`))
          .join("")}</section>`,
    )
    .join("");
  return [{ name: `${baseName(file.name)}.pdf`, blob: await htmlToPdf(html) }];
}
