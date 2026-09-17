"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { formatCurrency } from "../../../lib/format";
import type { Transaction } from "../../../lib/types";
import { TransactionForm } from "../../../components/TransactionForm";
import { Select } from "../../../components/ui/Select";

type TypeFilter = "" | "EXPENSE" | "INCOME";

export default function TransacoesPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "table">("list");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const transactionsQuery = useQuery({
    queryKey: ["transactions", { type: typeFilter }],
    queryFn: () => api.get<Transaction[]>(`/transactions${typeFilter ? `?type=${typeFilter}` : ""}`),
  });

  const toggleIgnore = useMutation({
    mutationFn: ({ id, ignore }: { id: string; ignore: boolean }) => api.patch(`/transactions/${id}/ignore`, { ignore }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      setConfirmingDeleteId(null);
    },
  });

  const transactions = transactionsQuery.data ?? [];

  return (
    <div className="flex gap-5">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Transações</h1>

          <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`px-3.5 py-1.5 text-xs ${view === "list" ? "bg-[var(--navbar)] text-white" : "text-[var(--text-muted)]"}`}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`px-3.5 py-1.5 text-xs ${view === "table" ? "bg-[var(--navbar)] text-white" : "text-[var(--text-muted)]"}`}
            >
              Tabela
            </button>
          </div>

          <div className="flex-1" />

          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className="w-[160px]">
            <option value="">Todos os tipos</option>
            <option value="EXPENSE">Despesas</option>
            <option value="INCOME">Receitas</option>
          </Select>
        </div>

        {transactionsQuery.isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando...</p>}

        {view === "table" ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="flex px-4 py-2.5 bg-black/5 text-xs font-semibold text-[var(--text-muted)]">
              <span className="w-[90px]">Data</span>
              <span className="flex-1">Descrição</span>
              <span className="w-[140px]">Categoria</span>
              <span className="w-[120px]">Forma pgto</span>
              <span className="w-[100px] text-right">Valor</span>
              <span className="w-[110px]" />
            </div>
            {transactions.map((t) => (
              <TransactionRow key={t.id} t={t} onToggleIgnore={toggleIgnore.mutate} confirmingDeleteId={confirmingDeleteId} setConfirmingDeleteId={setConfirmingDeleteId} onDelete={remove.mutate} table />
            ))}
            {!transactionsQuery.isLoading && transactions.length === 0 && (
              <p className="p-4 text-sm text-[var(--text-muted)]">Nenhuma transação ainda.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((t) => (
              <TransactionRow key={t.id} t={t} onToggleIgnore={toggleIgnore.mutate} confirmingDeleteId={confirmingDeleteId} setConfirmingDeleteId={setConfirmingDeleteId} onDelete={remove.mutate} />
            ))}
            {!transactionsQuery.isLoading && transactions.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">Nenhuma transação ainda.</p>
            )}
          </div>
        )}
      </div>

      <div className="w-[340px] flex-shrink-0">
        <TransactionForm />
      </div>
    </div>
  );
}

function TransactionRow({
  t,
  table,
  onToggleIgnore,
  onDelete,
  confirmingDeleteId,
  setConfirmingDeleteId,
}: {
  t: Transaction;
  table?: boolean;
  onToggleIgnore: (args: { id: string; ignore: boolean }) => void;
  onDelete: (id: string) => void;
  confirmingDeleteId: string | null;
  setConfirmingDeleteId: (id: string | null) => void;
}) {
  const confirming = confirmingDeleteId === t.id;
  const badge = t.isRecurring ? "recorrente" : t.installmentNumber ? "parcelado" : null;

  const content = (
    <>
      <span className="w-[90px] text-[var(--text-muted)]">{t.date.slice(0, 10)}</span>
      <span className={`flex-1 ${t.ignoreInReports ? "opacity-50" : ""}`}>
        {t.description}
        {badge && <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">({badge})</span>}
        {t.ignoreInReports && <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">(ignorada)</span>}
      </span>
      <span className="w-[140px] text-[var(--text-muted)]">{t.category?.name ?? "-"}</span>
      <span className="w-[120px] text-[var(--text-muted)]">{t.paymentMethod?.name ?? "-"}</span>
      <span className={`w-[100px] text-right font-medium ${t.type === "EXPENSE" ? "text-red-600" : "text-green-600"}`}>
        {t.type === "EXPENSE" ? "- " : "+ "}
        {formatCurrency(Number(t.amount))}
      </span>
    </>
  );

  if (!confirming) {
    return (
      <div className={`flex items-center px-4 py-2.5 text-xs gap-2 ${table ? "border-t border-[var(--border)]" : "rounded-lg border border-[var(--border)] bg-[var(--surface)]"}`}>
        {content}
        <div className="w-[110px] flex justify-end gap-1">
          <button
            type="button"
            onClick={() => onToggleIgnore({ id: t.id, ignore: !t.ignoreInReports })}
            className="text-[11px] text-[var(--text-muted)] hover:text-primary"
          >
            {t.ignoreInReports ? "Incluir" : "Ignorar"}
          </button>
          <button type="button" onClick={() => setConfirmingDeleteId(t.id)} className="text-[11px] text-red-600 hover:underline">
            Excluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center px-4 py-2.5 text-xs gap-2 bg-red-50 ${table ? "border-t border-[var(--border)]" : "rounded-lg border border-red-300"}`}>
      <span className="flex-1 text-red-700">Excluir &quot;{t.description}&quot;?</span>
      <button type="button" onClick={() => setConfirmingDeleteId(null)} className="text-[11px] text-[var(--text-muted)]">
        Cancelar
      </button>
      <button type="button" onClick={() => onDelete(t.id)} className="text-[11px] font-semibold text-red-700">
        Confirmar
      </button>
    </div>
  );
}
