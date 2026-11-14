// Renders one PDF page to a small image for on-screen previews (e.g. placing a signature).
import { pdfJsError } from "./pdf-open";

export async function renderPagePreview(file: File, pageNumber: number, width = 520): Promise<{ url: string; numPages: number }> {
  const [lib, worker] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]);
  lib.GlobalWorkerOptions.workerSrc = worker.default;
  let doc;
  try {
    doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (err) {
    throw pdfJsError(err);
  }
  const n = Math.min(Math.max(1, pageNumber), doc.numPages);
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: (width * (window.devicePixelRatio || 1)) / base.width });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  const numPages = doc.numPages;
  await doc.destroy();
  return { url: canvas.toDataURL("image/jpeg", 0.85), numPages };
}
