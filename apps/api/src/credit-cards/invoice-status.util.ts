import { Invoice, InvoiceStatus } from "@prisma/client";

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Deriva o status de exibição a partir das datas — não depende de um job agendado. */
export function withDerivedStatus<T extends Invoice>(invoice: T): T {
  if (invoice.paidAt) {
    return { ...invoice, status: InvoiceStatus.PAID };
  }
  const today = startOfToday();
  if (today > invoice.dueDate) {
    return { ...invoice, status: InvoiceStatus.OVERDUE };
  }
  if (today > invoice.closingDate) {
    return { ...invoice, status: InvoiceStatus.CLOSED };
  }
  return { ...invoice, status: InvoiceStatus.OPEN };
}
