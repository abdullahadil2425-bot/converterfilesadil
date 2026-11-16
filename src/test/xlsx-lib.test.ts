import { expect, it } from "vitest";
import * as XLSX from "xlsx";

it("uses patched SheetJS 0.20.3 and round-trips a sheet", () => {
  expect(XLSX.version).toBe("0.20.3");
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["a", "b"], [1, 2]]), "S");
  const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const back = XLSX.read(bytes, { type: "array" });
  expect(XLSX.utils.sheet_to_csv(back.Sheets.S!)).toBe("a,b\n1,2");
});
