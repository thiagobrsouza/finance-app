"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { formatCurrency } from "../../../lib/format";
import type { CategoryTotal, ComparisonReport, PeriodTotals } from "../../../lib/types";
import { CategoryPieChart } from "../../../components/CategoryPieChart";
import { EvolutionChart } from "../../../components/EvolutionChart";

type Tab = "categorias" | "comparacao" | "evolucao";

const TABS: { id: Tab; label: string }[] = [
  { id: "categorias", label: "Categorias" },
  { id: "comparacao", label: "Comparação" },
  { id: "evolucao", label: "Evolução de gastos" },
];

export default function RelatoriosPage() {
  const [tab, setTab] = useState<Tab>("categorias");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              tab === t.id ? "bg-[var(--navbar)] text-white" : "border border-[var(--border)] text-[var(--text-muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "categorias" && <CategoriasTab type={type} setType={setType} />}
      {tab === "comparacao" && <ComparacaoTab />}
      {tab === "evolucao" && <EvolucaoTab />}
    </div>
  );
}

function CategoriasTab({ type, setType }: { type: "EXPENSE" | "INCOME"; setType: (t: "EXPENSE" | "INCOME") => void }) {
  const query = useQuery({
    queryKey: ["reports", "by-category", type],
    queryFn: () => api.get<CategoryTotal[]>(`/reports/by-category?type=${type}`),
  });

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-4">
      <div className="flex items-center">
        <h2 className="text-sm font-semibold">Gastos por categoria</h2>
        <div className="flex-1" />
        <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`px-3 py-1.5 text-xs ${type === "EXPENSE" ? "bg-red-100 text-red-700" : "text-[var(--text-muted)]"}`}
          >
            Despesas
          </button>
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`px-3 py-1.5 text-xs ${type === "INCOME" ? "bg-green-100 text-green-700" : "text-[var(--text-muted)]"}`}
          >
            Receitas
          </button>
        </div>
      </div>

      {query.isLoading ? <p className="text-sm text-[var(--text-muted)]">Carregando...</p> : <CategoryPieChart data={query.data ?? []} />}
    </div>
  );
}

function ComparacaoTab() {
  const query = useQuery({ queryKey: ["reports", "comparison"], queryFn: () => api.get<ComparisonReport>("/reports/comparison") });

  if (query.isLoading || !query.data) {
    return <p className="text-sm text-[var(--text-muted)]">Carregando...</p>;
  }

  const { current, previous } = query.data;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-5">
      <h2 className="text-sm font-semibold">Mês atual vs. mês anterior</h2>

      <div className="grid grid-cols-2 gap-4">
        <PeriodCard label={monthLabel(previous.month)} data={previous} />
        <PeriodCard label={monthLabel(current.month)} data={current} highlight />
      </div>

      <ComparisonRow label="Despesas" current={current.expense} previous={previous.expense} tone="expense" />
      <ComparisonRow label="Receitas" current={current.income} previous={previous.income} tone="income" />
    </div>
  );
}

function PeriodCard({ label, data, highlight }: { label: string; data: PeriodTotals; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-md border ${highlight ? "border-primary bg-primary-light" : "border-[var(--border)]"}`}>
      <div className="text-xs text-[var(--text-muted)] mb-2">{label}</div>
      <div className="flex justify-between text-sm">
        <span>Despesas</span>
        <span className="font-semibold text-red-600">{formatCurrency(data.expense)}</span>
      </div>
      <div className="flex justify-between text-sm mt-1">
        <span>Receitas</span>
        <span className="font-semibold text-green-600">{formatCurrency(data.income)}</span>
      </div>
    </div>
  );
}

function ComparisonRow({ label, current, previous, tone }: { label: string; current: number; previous: number; tone: "expense" | "income" }) {
  const delta = current - previous;
  const pct = previous === 0 ? null : (delta / previous) * 100;
  const worse = tone === "expense" ? delta > 0 : delta < 0;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-[70px] text-[var(--text-muted)]">{label}</span>
      <span className={`font-medium ${worse ? "text-red-600" : "text-green-600"}`}>
        {delta >= 0 ? "+" : ""}
        {formatCurrency(delta)}
      </span>
      {pct !== null && (
        <span className="text-xs text-[var(--text-muted)]">
          ({pct >= 0 ? "+" : ""}
          {pct.toFixed(1)}%)
        </span>
      )}
    </div>
  );
}

function EvolucaoTab() {
  const query = useQuery({
    queryKey: ["reports", "evolution"],
    queryFn: () => api.get<PeriodTotals[]>("/reports/evolution?months=6"),
  });

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-4">
      <h2 className="text-sm font-semibold">Evolução (últimos 6 meses)</h2>
      {query.isLoading ? <p className="text-sm text-[var(--text-muted)]">Carregando...</p> : <EvolutionChart data={query.data ?? []} />}
    </div>
  );
}

function monthLabel(month: string): string {
  const [year, monthNum] = month.split("-");
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${names[Number(monthNum) - 1]}/${year}`;
}
