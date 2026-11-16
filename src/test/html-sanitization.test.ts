import { describe, expect, it } from "vitest";

import { sanitizeHtml } from "@/lib/converters/render-html";

describe("sanitizeHtml", () => {
  it("removes active elements, external resources, and event handlers", () => {
    const result = sanitizeHtml(
      '<script>alert(1)</script><img src="https://tracker.example/pixel" onerror="alert(1)"><a href="javascript:alert(1)">link</a><style>@import url(https://tracker.example/a.css)</style>',
    );
    expect(result).not.toContain("script");
    expect(result).not.toContain("tracker.example");
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("javascript:");
    expect(result).toContain("link");
  });

  it("keeps embedded image data", () => {
    expect(sanitizeHtml('<img src="data:image/png;base64,abc">')).toContain("data:image/png");
  });
});
