// Renders HTML into an A4 PDF using the browser's own fonts, so every script
// (Pashto, Arabic, Hindi, Chinese, ...) is drawn correctly.
// Colors here are fixed on purpose: they describe the printed document, not the site theme.

const PAGE_WIDTH_PX = 794; // A4 width at 96 dpi

const DOC_CSS = `
.pk-doc{font-family:"Vazirmatn","Noto Sans","Noto Sans Devanagari","Noto Sans SC","Segoe UI",Arial,sans-serif;font-size:14px;line-height:1.65;color:#1b1f2a;}
.pk-doc h1{font-size:26px;font-weight:700;margin:0 0 14px}
.pk-doc h2{font-size:21px;font-weight:700;margin:18px 0 10px}
.pk-doc h3{font-size:17px;font-weight:700;margin:14px 0 8px}
.pk-doc p{margin:0 0 10px}
.pk-doc ul{list-style:disc;padding-inline-start:24px;margin:0 0 10px}
.pk-doc ol{list-style:decimal;padding-inline-start:24px;margin:0 0 10px}
.pk-doc img{max-width:100%;height:auto}
.pk-doc table{border-collapse:collapse;width:100%;margin:0 0 16px;font-size:11px}
.pk-doc td,.pk-doc th{border:1px solid #cfd4dc;padding:4px 6px;vertical-align:top;word-break:break-word}
.pk-doc a{color:#2456c7;text-decoration:underline}
.pk-doc pre{white-space:pre-wrap}
`;

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

const SAFE_DATA_IMG = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i;
const URL_ATTRS = ["src", "href", "srcset", "action", "formaction", "poster", "background", "xlink:href", "data", "ping", "lowsrc", "longdesc", "manifest", "cite"];

/** Drops url(...) and @import from CSS so no remote file can load. */
export function stripCssUrls(css: string): string {
  return css
    .replace(/@import[^;]*;?/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/expression\s*\(/gi, "(")
    .replace(/image-set\s*\([^)]*\)/gi, "none");
}

/**
 * Removes scripts, event handlers and every remote resource from user HTML.
 * Only inline base64 PNG/JPEG/GIF/WEBP images survive, so nothing is fetched from the network.
 */
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script, noscript, iframe, frame, frameset, object, embed, applet, link, meta, base, svg, math, video, audio, source, track, picture, form, template, portal")
    .forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) el.removeAttribute(attr.name);
      else if (name === "style") el.setAttribute("style", stripCssUrls(attr.value));
      else if (URL_ATTRS.includes(name)) {
        const keep = el.tagName === "IMG" && name === "src" && SAFE_DATA_IMG.test(attr.value.trim());
        const anchor = el.tagName === "A" && name === "href" && /^\s*(https?:|mailto:|#)/i.test(attr.value);
        if (!keep && !anchor) el.removeAttribute(attr.name);
      }
    }
  });
  doc.querySelectorAll("img:not([src])").forEach((el) => el.remove());
  const styles = Array.from(doc.querySelectorAll("style"))
    .map((s) => { const css = stripCssUrls(s.textContent ?? ""); s.remove(); return `<style>${css.replace(/<\/style/gi, "")}</style>`; })
    .join("");
  return styles + doc.body.innerHTML;
}

export async function htmlToPdf(html: string): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: `${PAGE_WIDTH_PX}px`,
    zIndex: "-9999",
    pointerEvents: "none",
  });
  const page = document.createElement("div");
  page.className = "pk-doc";
  page.setAttribute("dir", "auto");
  Object.assign(page.style, {
    width: `${PAGE_WIDTH_PX}px`,
    padding: "56px",
    boxSizing: "border-box",
    background: "#ffffff",
  });
  page.innerHTML = `<style>${DOC_CSS}</style>${html}`;
  host.appendChild(page);
  document.body.appendChild(host);

  try {
    await document.fonts?.ready;
    await Promise.all(
      Array.from(page.querySelectorAll("img")).map((img) =>
        img.complete
          ? null
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }),
      ),
    );

    const canvas = await html2canvas(page, { scale: 2, backgroundColor: "#ffffff", useCORS: false });
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const sliceHeight = Math.floor((canvas.width * ph) / pw);

    let y = 0;
    let first = true;
    while (y < canvas.height) {
      const h = Math.min(sliceHeight, canvas.height - y);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = h;
      const ctx = slice.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, h);
      ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      if (!first) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw, (h * pw) / canvas.width);
      first = false;
      y += h;
    }
    return pdf.output("blob");
  } finally {
    host.remove();
  }
}

export function textToHtml(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `<p dir="auto">${escapeHtml(line)}</p>` : "<p>&nbsp;</p>"))
    .join("");
}
