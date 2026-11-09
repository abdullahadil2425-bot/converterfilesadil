/**
 * Parses a page selection like "1,3,5-7" into sorted, unique zero-based page indexes.
 * Returns null when the text is empty, malformed, or points outside 1..total.
 */
export function parsePageRanges(input: string, total: number): number[] | null {
  const parts = input
    .replace(/[،؛;]/g, ",")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const pages = new Set<number>();
  for (const part of parts) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!match) return null;
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < start || end > total) return null;
    for (let p = start; p <= end; p++) pages.add(p - 1);
  }
  return [...pages].sort((a, b) => a - b);
}
