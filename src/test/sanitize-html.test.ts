import { describe, expect, it } from "vitest";
import { sanitizeHtml, stripCssUrls } from "@/lib/converters/render-html";

describe("sanitizeHtml", () => {
  it("removes scripts", () => expect(sanitizeHtml("<p>a</p><script>alert(1)</script>")).not.toMatch(/script/i));
  it("removes event handlers", () => expect(sanitizeHtml('<p onclick="x()">a</p>')).not.toMatch(/onclick/i));
  it("removes remote image", () => expect(sanitizeHtml('<img src="https://evil.test/a.png">')).not.toMatch(/evil/));
  it("removes srcset", () => expect(sanitizeHtml('<img src="data:image/png;base64,AAAA" srcset="https://evil.test/b.png 2x">')).not.toMatch(/evil/));
  it("keeps inline base64 png", () => expect(sanitizeHtml('<img src="data:image/png;base64,AAAA">')).toContain("data:image/png;base64,AAAA"));
  it("removes svg data image", () => expect(sanitizeHtml('<img src="data:image/svg+xml;base64,AAAA">')).not.toMatch(/svg/));
  it("removes javascript links", () => expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toMatch(/javascript/i));
  it("removes link, iframe, svg", () => expect(sanitizeHtml('<link rel="stylesheet" href="https://e.test/a.css"><iframe src="https://e.test"></iframe><svg><image href="https://e.test/x"/></svg><p>ok</p>')).toBe("<p>ok</p>"));
  it("strips CSS url and @import", () => {
    const out = sanitizeHtml('<style>@import "https://e.test/a.css"; p{background:url(https://e.test/x.png)}</style><p style="background:url(https://e.test/y)">t</p>');
    expect(out).not.toMatch(/e\.test/);
    expect(out).toContain("<p");
  });
  it("keeps simple markup", () => expect(sanitizeHtml("<h1>Title</h1><p><b>bold</b> سلام</p>")).toBe("<h1>Title</h1><p><b>bold</b> سلام</p>"));
  it("stripCssUrls keeps plain css", () => expect(stripCssUrls("p{color:red}")).toBe("p{color:red}"));
});
