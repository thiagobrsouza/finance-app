function daysInMonth(year: number, month: number): number {
  // month é 0-based; dia 0 do mês seguinte = último dia deste mês.
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function dateWithClampedDay(year: number, month: number, day: number): Date {
  const clampedDay = Math.min(day, daysInMonth(year, month));
  return new Date(Date.UTC(year, month, clampedDay));
}

export interface InvoicePeriod {
  referenceMonth: string;
  closingDate: Date;
  dueDate: Date;
}

/**
 * Calcula o período (fechamento/vencimento) da fatura em aberto na data de referência,
 * a partir do dia de fechamento e vencimento do cartão.
 */
export function computeCurrentInvoicePeriod(
  closingDay: number,
  dueDay: number,
  referenceDate: Date = new Date(),
): InvoicePeriod {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  let closingDate = dateWithClampedDay(year, month, closingDay);
  if (referenceDate > closingDate) {
    closingDate = dateWithClampedDay(year, month + 1, closingDay);
  }

  const dueMonthOffset = dueDay >= closingDay ? 0 : 1;
  const dueDate = dateWithClampedDay(
    closingDate.getUTCFullYear(),
    closingDate.getUTCMonth() + dueMonthOffset,
    dueDay,
  );

  const referenceMonth = `${closingDate.getUTCFullYear()}-${String(closingDate.getUTCMonth() + 1).padStart(2, "0")}`;

  return { referenceMonth, closingDate, dueDate };
}
