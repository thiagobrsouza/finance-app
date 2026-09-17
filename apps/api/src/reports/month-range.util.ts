export interface MonthRange {
  month: string; // YYYY-MM
  start: Date;
  end: Date;
}

/** Intervalo [primeiro dia, último dia] do mês informado (ou do mês atual, se omitido). `month` no formato YYYY-MM. */
export function monthRange(month?: string): MonthRange {
  const now = new Date();
  const [year, monthIndex] = month
    ? month.split("-").map((part) => Number(part))
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];

  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 0));

  return { month: `${year}-${String(monthIndex).padStart(2, "0")}`, start, end };
}

export function previousMonth(month: string): string {
  const [year, monthIndex] = month.split("-").map((part) => Number(part));
  const previousMonthIndex = monthIndex - 1;
  const targetYear = previousMonthIndex === 0 ? year - 1 : year;
  const targetMonth = previousMonthIndex === 0 ? 12 : previousMonthIndex;
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
}
