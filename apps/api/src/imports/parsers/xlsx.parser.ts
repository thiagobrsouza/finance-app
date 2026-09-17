import * as XLSX from "xlsx";
import { ParseResult } from "./types";
import { rowsToParsedResult } from "./tabular.util";

export function parseXlsx(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { rows: [], warnings: ["Planilha não contém abas"] };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: true });

  return rowsToParsedResult(rows);
}
