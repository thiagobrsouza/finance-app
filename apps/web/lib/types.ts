export interface Institution {
  id: string;
  name: string;
  domain: string | null;
  iconUrl: string | null;
  isSeeded: boolean;
}

export type AccountType = "CORRENTE" | "POUPANCA" | "CARTEIRA";

export interface Account {
  id: string;
  name: string;
  institutionId: string;
  type: AccountType;
  initialBalance: string;
  currentBalance: string;
  archivedAt: string | null;
  createdAt: string;
  institution: Institution;
}

export interface AccountBalanceSnapshot {
  id: string;
  accountId: string;
  balance: string;
  snapshotDate: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  date: string;
  description: string | null;
  createdAt: string;
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  CORRENTE: "Conta Corrente",
  POUPANCA: "Poupança",
  CARTEIRA: "Carteira",
};

export interface CreditCard {
  id: string;
  name: string;
  institutionId: string;
  limit: string;
  closingDay: number;
  dueDay: number;
  archivedAt: string | null;
  institution: Institution;
}

export type InvoiceStatus = "OPEN" | "CLOSED" | "PAID" | "OVERDUE";

export interface Invoice {
  id: string;
  creditCardId: string;
  referenceMonth: string;
  closingDate: string;
  dueDate: string;
  status: InvoiceStatus;
  totalAmount: string;
  paidAmount: string;
  paidAt: string | null;
  paidFromAccountId: string | null;
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  OPEN: "Em aberto",
  CLOSED: "Fechada",
  PAID: "Paga",
  OVERDUE: "Atrasada",
};

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  children?: Category[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  requiresCreditCard: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string | null;
  creditCardId: string | null;
  invoiceId: string | null;
  categoryId: string;
  paymentMethodId: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: string;
  date: string;
  isRecurring: boolean;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  ignoreInReports: boolean;
  category?: Category;
  paymentMethod?: PaymentMethod;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface PeriodTotals {
  month: string;
  income: number;
  expense: number;
}

export interface ComparisonReport {
  current: PeriodTotals;
  previous: PeriodTotals;
}
