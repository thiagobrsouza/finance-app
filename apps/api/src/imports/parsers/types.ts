export interface ParsedRow {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // sempre positivo — o sinal vira `type`
  type: "INCOME" | "EXPENSE";
}

export interface ParseResult {
  rows: ParsedRow[];
  warnings: string[];
}

const DATE_ISO = /^(\d{4})-(\d{2})-(\d{2})/;
const DATE_BR = /^(\d{2})\/(\d{2})\/(\d{4})/;

/** Aceita `YYYY-MM-DD` ou `DD/MM/YYYY`; retorna null se não reconhecer. */
export function normalizeDate(raw: string): string | null {
  const isoMatch = DATE_ISO.exec(raw);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  const brMatch = DATE_BR.exec(raw);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }
  return null;
}

export function normalizeAmount(raw: string | number): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }
  // Aceita "1.234,56" (formato BR) ou "1234.56" (formato US)
  const cleaned = raw.trim().replace(/\s/g, "");
  const value = cleaned.includes(",")
    ? Number(cleaned.replace(/\./g, "").replace(",", "."))
    : Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** Procura, entre as chaves de um objeto (case-insensitive), a primeira que bater com algum candidato. */
export function findKey(row: Record<string, unknown>, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const found = keys.find((k) => k.trim().toLowerCase() === candidate);
    if (found) return found;
  }
  return undefined;
}
