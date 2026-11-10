import { DICTS, TOOL_TEXTS, type EditToolSlug } from "./i18n/dict";
import type { Lang } from "./i18n/languages";

export type Fmt = "pdf" | "word" | "excel" | "ppt" | "jpg" | "png" | "webp" | "bmp" | "ico" | "image" | "text" | "html" | "csv" | "json";
export type ToolCategory = "to_pdf" | "from_pdf" | "edit" | "docs" | "image";
export type ToolOption = "quality" | "angle" | "pages" | "watermark";
export type EditIcon = "merge" | "split" | "compress" | "rotate" | "numbers" | "watermark" | "delete" | "extract";

export type ToolDef = {
  slug: string;
  category: ToolCategory;
  from: Fmt;
  to: Fmt;
  accept: string;
  multiple: boolean;
  /** Allows typing/pasting content instead of choosing a file. */
  paste?: boolean;
  option?: ToolOption;
  /** Present on edit tools; their names come from TOOL_TEXTS instead of the "{a} to {b}" template. */
  edit?: { key: EditToolSlug; icon: EditIcon };
};

export const FORMATS: Record<Fmt, { label: string | null; badge: string; colorVar: string }> = {
  pdf: { label: "PDF", badge: "PDF", colorVar: "--fmt-pdf" },
  word: { label: "Word", badge: "DOC", colorVar: "--fmt-word" },
  excel: { label: "Excel", badge: "XLS", colorVar: "--fmt-excel" },
  ppt: { label: "PowerPoint", badge: "PPT", colorVar: "--fmt-ppt" },
  jpg: { label: "JPG", badge: "JPG", colorVar: "--fmt-image" },
  png: { label: "PNG", badge: "PNG", colorVar: "--fmt-image" },
  webp: { label: "WEBP", badge: "WEBP", colorVar: "--fmt-image" },
  bmp: { label: "BMP", badge: "BMP", colorVar: "--fmt-image" },
  ico: { label: "ICO", badge: "ICO", colorVar: "--fmt-image" },
  image: { label: null, badge: "IMG", colorVar: "--fmt-image" },
  text: { label: null, badge: "TXT", colorVar: "--fmt-text" },
  html: { label: "HTML", badge: "HTML", colorVar: "--fmt-html" },
  csv: { label: "CSV", badge: "CSV", colorVar: "--fmt-excel" },
  json: { label: "JSON", badge: "JSON", colorVar: "--fmt-html" },
};

const PDF = ".pdf,application/pdf";
const WORD = ".docx";
const EXCEL = ".xlsx,.xls,.csv,.ods";
const PPT = ".pptx";
const TEXT = ".txt,text/plain";
const HTML = ".html,.htm,text/html";

export const TOOLS: ToolDef[] = [
  { slug: "word-to-pdf", category: "to_pdf", from: "word", to: "pdf", accept: WORD, multiple: false },
  { slug: "excel-to-pdf", category: "to_pdf", from: "excel", to: "pdf", accept: EXCEL, multiple: false },
  { slug: "powerpoint-to-pdf", category: "to_pdf", from: "ppt", to: "pdf", accept: PPT, multiple: false },
  { slug: "jpg-to-pdf", category: "to_pdf", from: "jpg", to: "pdf", accept: "image/*", multiple: true },
  { slug: "png-to-pdf", category: "to_pdf", from: "png", to: "pdf", accept: "image/*", multiple: true },
  { slug: "image-to-pdf", category: "to_pdf", from: "image", to: "pdf", accept: "image/*", multiple: true },
  { slug: "text-to-pdf", category: "to_pdf", from: "text", to: "pdf", accept: TEXT, multiple: false, paste: true },
  { slug: "html-to-pdf", category: "to_pdf", from: "html", to: "pdf", accept: HTML, multiple: false, paste: true },
  { slug: "pdf-to-word", category: "from_pdf", from: "pdf", to: "word", accept: PDF, multiple: false },
  { slug: "pdf-to-excel", category: "from_pdf", from: "pdf", to: "excel", accept: PDF, multiple: false },
  { slug: "pdf-to-powerpoint", category: "from_pdf", from: "pdf", to: "ppt", accept: PDF, multiple: false },
  { slug: "pdf-to-jpg", category: "from_pdf", from: "pdf", to: "jpg", accept: PDF, multiple: false },
  { slug: "pdf-to-png", category: "from_pdf", from: "pdf", to: "png", accept: PDF, multiple: false },
  { slug: "pdf-to-webp", category: "from_pdf", from: "pdf", to: "webp", accept: PDF, multiple: false },
  { slug: "pdf-to-text", category: "from_pdf", from: "pdf", to: "text", accept: PDF, multiple: false },
  { slug: "pdf-to-html", category: "from_pdf", from: "pdf", to: "html", accept: PDF, multiple: false },
  { slug: "merge-pdf", category: "edit", from: "pdf", to: "pdf", accept: PDF, multiple: true, edit: { key: "merge-pdf", icon: "merge" } },
  { slug: "split-pdf", category: "edit", from: "pdf", to: "pdf", accept: PDF, multiple: false, edit: { key: "split-pdf", icon: "split" } },
  { slug: "compress-pdf", category: "edit", from: "pdf", to: "pdf", accept: PDF, multiple: false, option: "quality", edit: { key: "compress-pdf", icon: "compress" } },
  { slug: "rotate-pdf", category: "edit", from: "pdf", to: "pdf", accept: PDF, multiple: false, option: "angle", edit: { key: "rotate-pdf", icon: "rotate" } },
  { slug: "add-page-numbers", category: "edit", from: "pdf", to: "pdf", accept: PDF, multiple: false, edit: { key: "add-page-numbers", icon: "numbers" } },
  { slug: "add-watermark", category: "edit", from: "pdf", to: "pdf", accept: PDF, multiple: false, option: "watermark", edit: { key: "add-watermark", icon: "watermark" } },
  { slug: "delete-pages", category: "edit", from: "pdf", to: "pdf", accept: PDF, multiple: false, option: "pages", edit: { key: "delete-pages", icon: "delete" } },
  { slug: "extract-pages", category: "edit", from: "pdf", to: "pdf", accept: PDF, multiple: false, option: "pages", edit: { key: "extract-pages", icon: "extract" } },
  { slug: "word-to-text", category: "docs", from: "word", to: "text", accept: WORD, multiple: false },
  { slug: "word-to-html", category: "docs", from: "word", to: "html", accept: WORD, multiple: false },
  { slug: "text-to-word", category: "docs", from: "text", to: "word", accept: TEXT, multiple: false, paste: true },
  { slug: "html-to-word", category: "docs", from: "html", to: "word", accept: HTML, multiple: false, paste: true },
  { slug: "powerpoint-to-word", category: "docs", from: "ppt", to: "word", accept: PPT, multiple: false },
  { slug: "powerpoint-to-text", category: "docs", from: "ppt", to: "text", accept: PPT, multiple: false },
  { slug: "excel-to-csv", category: "docs", from: "excel", to: "csv", accept: EXCEL, multiple: false },
  { slug: "csv-to-excel", category: "docs", from: "csv", to: "excel", accept: ".csv,text/csv,.txt", multiple: false, paste: true },
  { slug: "excel-to-json", category: "docs", from: "excel", to: "json", accept: EXCEL, multiple: false },
  { slug: "json-to-excel", category: "docs", from: "json", to: "excel", accept: ".json,application/json", multiple: false, paste: true },
  { slug: "excel-to-html", category: "docs", from: "excel", to: "html", accept: EXCEL, multiple: false },
  { slug: "html-to-text", category: "docs", from: "html", to: "text", accept: HTML, multiple: false, paste: true },
  { slug: "text-to-html", category: "docs", from: "text", to: "html", accept: TEXT, multiple: false, paste: true },
  { slug: "image-to-jpg", category: "image", from: "image", to: "jpg", accept: "image/*", multiple: true },
  { slug: "image-to-png", category: "image", from: "image", to: "png", accept: "image/*", multiple: true },
  { slug: "image-to-webp", category: "image", from: "image", to: "webp", accept: "image/*", multiple: true },
  { slug: "image-to-bmp", category: "image", from: "image", to: "bmp", accept: "image/*", multiple: true },
  { slug: "image-to-ico", category: "image", from: "image", to: "ico", accept: "image/*", multiple: true },
];

export const CATEGORIES: ToolCategory[] = ["to_pdf", "from_pdf", "edit", "docs", "image"];

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function formatLabel(fmt: Fmt, lang: Lang): string {
  const fixed = FORMATS[fmt].label;
  if (fixed) return fixed;
  return fmt === "image" ? DICTS[lang].fmt_image : DICTS[lang].fmt_text;
}

export function toolText(tool: ToolDef, lang: Lang): { name: string; description: string } {
  if (tool.edit) {
    const [name, description] = TOOL_TEXTS[lang][tool.edit.key];
    return { name, description };
  }
  const a = formatLabel(tool.from, lang);
  const b = formatLabel(tool.to, lang);
  const d = DICTS[lang];
  return {
    name: d.conv.replace("{a}", a).replace("{b}", b),
    description: d.conv_desc.replace("{a}", a).replace("{b}", b),
  };
}
