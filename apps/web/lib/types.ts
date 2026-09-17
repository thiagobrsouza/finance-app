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
