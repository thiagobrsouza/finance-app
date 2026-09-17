function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Soma meses a uma data, ajustando (clamp) o dia quando o mês de destino é mais curto. */
export function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getUTCDate();
  const targetMonthIndex = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const month = ((targetMonthIndex % 12) + 12) % 12;
  const clampedDay = Math.min(day, daysInMonth(year, month));
  return new Date(Date.UTC(year, month, clampedDay));
}

export function startOfDayUTC(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
