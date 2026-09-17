import { findKey, normalizeAmount, normalizeDate, ParseResult } from "./types";

const DATE_CANDIDATES = ["data", "date", "dt"];
const DESCRIPTION_CANDIDATES = ["descricao", "descrição", "description", "histórico", "historico", "memo"];
const AMOUNT_CANDIDATES = ["valor", "amount", "value"];

/** Converte linhas já tabuladas (objetos por coluna, vindas de CSV ou XLSX) para o formato comum de preview. */
export function rowsToParsedResult(rows: Record<string, unknown>[]): ParseResult {
  const warnings: string[] = [];
  const parsedRows: ParseResult["rows"] = [];

  if (rows.length === 0) {
    return { rows: [], warnings: ["Arquivo não contém linhas de dados"] };
  }

  const dateKey = findKey(rows[0], DATE_CANDIDATES);
  const descriptionKey = findKey(rows[0], DESCRIPTION_CANDIDATES);
  const amountKey = findKey(rows[0], AMOUNT_CANDIDATES);

  if (!dateKey || !descriptionKey || !amountKey) {
    warnings.push(
      `Não foi possível identificar as colunas esperadas (data/descrição/valor). Colunas encontradas: ${Object.keys(rows[0]).join(", ")}`,
    );
    return { rows: [], warnings };
  }

  rows.forEach((row, index) => {
    const lineNumber = index + 2; // +1 cabeçalho, +1 base 1
    const rawDate = row[dateKey];
    const rawAmount = row[amountKey];
    const rawDescription = row[descriptionKey];

    const date = typeof rawDate === "string" ? normalizeDate(rawDate) : null;
    const amount = typeof rawAmount === "number" || typeof rawAmount === "string" ? normalizeAmount(rawAmount) : null;

    if (!date || amount === null || amount === 0 || !rawDescription) {
      warnings.push(`Linha ${lineNumber}: dados incompletos ou inválidos, ignorada`);
      return;
    }

    parsedRows.push({
      date,
      description: String(rawDescription).trim(),
      amount: Math.abs(amount),
      type: amount < 0 ? "EXPENSE" : "INCOME",
    });
  });

  return { rows: parsedRows, warnings };
}
