import Papa from "papaparse";
import { ParseResult } from "./types";
import { rowsToParsedResult } from "./tabular.util";

export function parseCsv(buffer: Buffer): ParseResult {
  const text = buffer.toString("utf-8");
  const { data, errors } = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const result = rowsToParsedResult(data);
  const parseWarnings = errors.map((e) => `Linha ${e.row ?? "?"}: ${e.message}`);
  return { rows: result.rows, warnings: [...parseWarnings, ...result.warnings] };
}
