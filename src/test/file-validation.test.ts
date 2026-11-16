import { describe, expect, it } from "vitest";

import { validateFiles } from "@/lib/converters/validate";
import { ToolError } from "@/lib/converters/shared";

describe("validateFiles resource limits", () => {
  it("rejects a batch that exceeds the aggregate byte limit before reading files", async () => {
    const first = new File(["a"], "first.png", { type: "image/png" });
    const second = new File(["b"], "second.png", { type: "image/png" });
    Object.defineProperty(first, "size", { value: 60 * 1024 * 1024 });
    Object.defineProperty(second, "size", { value: 60 * 1024 * 1024 });
    await expect(validateFiles("image", [first, second])).rejects.toMatchObject({ code: "toolarge" });
  });

  it("rejects batches with too many files", async () => {
    const files = Array.from({ length: 21 }, (_, i) => new File(["a"], `${i}.png`, { type: "image/png" }));
    await expect(validateFiles("image", files)).rejects.toBeInstanceOf(ToolError);
  });
});
