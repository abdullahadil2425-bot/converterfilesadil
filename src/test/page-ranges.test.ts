import { describe, expect, it } from "vitest";

import { parsePageRanges } from "@/lib/page-ranges";

describe("parsePageRanges", () => {
  it("turns '1,3,5-7' into zero-based pages", () => {
    expect(parsePageRanges("1,3,5-7", 10)).toEqual([0, 2, 4, 5, 6]);
  });

  it("rejects a page beyond the document length", () => {
    expect(parsePageRanges("2-12", 10)).toBeNull();
  });

  it("rejects page zero and malformed text", () => {
    expect(parsePageRanges("0", 5)).toBeNull();
    expect(parsePageRanges("abc", 5)).toBeNull();
  });
});
