import { describe, expect, it } from "vitest";

import { HANDLERS } from "@/lib/converters";
import { encodeBmp, encodeIco } from "@/lib/converters/shared";
import { TOOLS } from "@/lib/tools";

describe("tools", () => {
  it("every tool on the site has a working converter behind it", () => {
    const missing = TOOLS.filter((t) => !HANDLERS[t.slug]).map((t) => t.slug);
    expect(missing).toEqual([]);
  });

  it("PDF converts to other formats and other formats convert without PDF", () => {
    const fromPdf = TOOLS.filter((t) => t.from === "pdf" && t.to !== "pdf").map((t) => t.to);
    expect(fromPdf).toEqual(expect.arrayContaining(["word", "excel", "ppt", "jpg", "png", "webp", "text", "html"]));
    const nonPdf = TOOLS.filter((t) => t.from !== "pdf" && t.to !== "pdf").map((t) => t.slug);
    expect(nonPdf).toEqual(expect.arrayContaining(["word-to-text", "excel-to-csv", "csv-to-excel", "json-to-excel", "image-to-bmp"]));
  });

  it("writes a valid BMP header for a 2×1 image", () => {
    const bmp = encodeBmp(2, 1, new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]));
    const view = new DataView(bmp.buffer);
    expect(String.fromCharCode(bmp[0] ?? 0, bmp[1] ?? 0)).toBe("BM");
    expect(view.getUint32(2, true)).toBe(54 + 8);
    expect(view.getInt32(18, true)).toBe(2);
    // first pixel red is stored as B,G,R
    expect([bmp[54], bmp[55], bmp[56]]).toEqual([0, 0, 255]);
  });

  it("wraps a PNG into an ICO with 256px stored as 0", () => {
    const ico = encodeIco(new Uint8Array([1, 2, 3]), 256, 256);
    expect(ico[6]).toBe(0);
    expect(new DataView(ico.buffer).getUint32(14, true)).toBe(3);
    expect(ico.length).toBe(25);
  });
});
