"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { formatCurrency } from "../../../lib/format";
import { StatCard } from "../../../components/ui/StatCard";

interface DashboardSummary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  invoicesOverdue: number;
  invoicesDueSoon: number;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.get<DashboardSummary>("/dashboard/summary"),
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold">Dashboard</h1>

      {isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando...</p>}
      {isError && <p className="text-sm text-red-600">Não foi possível carregar o resumo.</p>}

      {data && (
        <div className="flex gap-4 flex-wrap">
          <StatCard label="Saldo total" value={formatCurrency(data.totalBalance)} />
          <StatCard label="Gastos do mês" value={formatCurrency(data.monthExpense)} />
          <StatCard label="Entradas do mês" value={formatCurrency(data.monthIncome)} />
          <StatCard
            label="Faturas atrasadas / próx. vencimento"
            value={String(data.invoicesOverdue + data.invoicesDueSoon)}
            danger={data.invoicesOverdue + data.invoicesDueSoon > 0}
          />
        </div>
      )}
    </div>
  );
}
