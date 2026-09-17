import { ParseResult } from "./types";

const TRANSACTION_BLOCK = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
const TAG = (name: string) => new RegExp(`<${name}>\\s*([^<\\r\\n]+)`, "i");

export function parseOfx(buffer: Buffer): ParseResult {
  const text = buffer.toString("utf-8");
  const warnings: string[] = [];
  const rows: ParseResult["rows"] = [];

  const blocks = [...text.matchAll(TRANSACTION_BLOCK)];
  if (blocks.length === 0) {
    return { rows: [], warnings: ["Nenhuma transação (<STMTTRN>) encontrada no arquivo OFX"] };
  }

  blocks.forEach((match, index) => {
    const block = match[1];
    const dateMatch = TAG("DTPOSTED").exec(block);
    const amountMatch = TAG("TRNAMT").exec(block);
    const memoMatch = TAG("MEMO").exec(block) ?? TAG("NAME").exec(block);

    if (!dateMatch || !amountMatch) {
      warnings.push(`Transação ${index + 1}: sem data ou valor, ignorada`);
      return;
    }

    const rawDate = dateMatch[1].trim(); // YYYYMMDDHHMMSS[...]
    const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const amount = Number(amountMatch[1].trim());

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(amount) || amount === 0) {
      warnings.push(`Transação ${index + 1}: data ou valor inválido, ignorada`);
      return;
    }

    rows.push({
      date,
      description: memoMatch ? memoMatch[1].trim() : "Transação importada",
      amount: Math.abs(amount),
      type: amount < 0 ? "EXPENSE" : "INCOME",
    });
  });

  return { rows, warnings };
}
