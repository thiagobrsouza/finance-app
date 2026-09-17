"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../../lib/api";
import { formatCurrency } from "../../../lib/format";
import type { Account, CreditCard, Institution, Invoice, Transaction } from "../../../lib/types";
import { INVOICE_STATUS_LABEL } from "../../../lib/types";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Badge } from "../../../components/ui/Badge";

export default function CartoesPage() {
  const queryClient = useQueryClient();

  const cardsQuery = useQuery({ queryKey: ["credit-cards"], queryFn: () => api.get<CreditCard[]>("/credit-cards") });
  const institutionsQuery = useQuery({ queryKey: ["institutions"], queryFn: () => api.get<Institution[]>("/institutions") });
  const accountsQuery = useQuery({ queryKey: ["accounts"], queryFn: () => api.get<Account[]>("/accounts") });

  const cards = cardsQuery.data ?? [];
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCardId && cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  const invoiceQuery = useQuery({
    queryKey: ["credit-cards", selectedCardId, "invoices", "current"],
    queryFn: () => api.get<Invoice>(`/credit-cards/${selectedCardId}/invoices/current`),
    enabled: !!selectedCardId,
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions", "credit-card", selectedCardId],
    queryFn: () => api.get<Transaction[]>(`/transactions?creditCardId=${selectedCardId}`),
    enabled: !!selectedCardId,
  });

  const invoiceTransactions = (transactionsQuery.data ?? []).filter((t) => t.invoiceId === invoiceQuery.data?.id);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("20");
  const [dueDay, setDueDay] = useState("27");
  const [error, setError] = useState<string | null>(null);

  const createCard = useMutation({
    mutationFn: () =>
      api.post<CreditCard>("/credit-cards", {
        name,
        institutionId,
        limit: Number(limit),
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      setShowForm(false);
      setName("");
      setLimit("");
      setSelectedCardId(created.id);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível criar o cartão"),
  });

  function handleCreateCard(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!institutionId) {
      setError("Selecione uma instituição");
      return;
    }
    createCard.mutate();
  }

  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const archiveCard = useMutation({
    mutationFn: () => api.delete(`/credit-cards/${selectedCardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      setSelectedCardId(null);
      setConfirmingArchive(false);
    },
  });

  const [payAccountId, setPayAccountId] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const payInvoice = useMutation({
    mutationFn: () =>
      api.post(`/invoices/${invoiceQuery.data?.id}/pay`, { method: "ACCOUNT_BALANCE", accountId: payAccountId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards", selectedCardId, "invoices", "current"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setPayAccountId("");
    },
    onError: (err) => setPayError(err instanceof ApiError ? err.message : "Não foi possível liquidar a fatura"),
  });

  function handlePay(event: FormEvent) {
    event.preventDefault();
    setPayError(null);
    if (!payAccountId) {
      setPayError("Selecione a conta");
      return;
    }
    payInvoice.mutate();
  }

  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;

  return (
    <div className="flex gap-5">
      <div className="w-[320px] flex flex-col gap-3.5 flex-shrink-0">
        <div className="flex items-center">
          <h1 className="text-lg font-bold">Cartões</h1>
          <div className="flex-1" />
        </div>

        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              setSelectedCardId(card.id);
              setConfirmingArchive(false);
            }}
            className={`text-left p-4 rounded-lg flex flex-col gap-1.5 ${
              card.id === selectedCardId ? "bg-[var(--navbar)] text-white" : "bg-[var(--surface)] border border-[var(--border)]"
            }`}
          >
            <div className="text-sm font-semibold">{card.name}</div>
            <div className={`text-xs ${card.id === selectedCardId ? "text-[var(--navbar-muted)]" : "text-[var(--text-muted)]"}`}>
              Fecha dia {card.closingDay} · Vence dia {card.dueDay}
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="p-3.5 rounded-lg border border-dashed border-[var(--border)] text-center text-sm text-[var(--text-muted)]"
        >
          {showForm ? "Cancelar" : "+ Adicionar cartão"}
        </button>

        {showForm && (
          <form onSubmit={handleCreateCard} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-3">
            <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
            <Select label="Instituição" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
              <option value="">Selecione...</option>
              {(institutionsQuery.data ?? []).map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </Select>
            <Input label="Limite" type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} required />
            <div className="flex gap-2">
              <Input label="Dia fechamento" type="number" min={1} max={31} value={closingDay} onChange={(e) => setClosingDay(e.target.value)} required />
              <Input label="Dia vencimento" type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} required />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" disabled={createCard.isPending}>
              {createCard.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        )}
      </div>

      <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-4">
        {!selectedCard ? (
          <p className="text-sm text-[var(--text-muted)]">Nenhum cartão cadastrado ainda.</p>
        ) : (
          <>
            <div className="flex items-center">
              <div>
                <div className="text-base font-bold">Fatura atual — {selectedCard.name}</div>
                {invoiceQuery.data && (
                  <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2">
                    Vence em {invoiceQuery.data.dueDate.slice(0, 10)}
                    <Badge tone={invoiceQuery.data.status}>{INVOICE_STATUS_LABEL[invoiceQuery.data.status]}</Badge>
                  </div>
                )}
              </div>
              <div className="flex-1" />
              {invoiceQuery.data && (
                <div className="text-right">
                  <div className="text-xs text-[var(--text-muted)]">Total da fatura</div>
                  <div className="text-xl font-bold">{formatCurrency(Number(invoiceQuery.data.totalAmount))}</div>
                </div>
              )}
            </div>

            {invoiceQuery.data && invoiceQuery.data.status !== "PAID" && (
              <form onSubmit={handlePay} className="flex items-end gap-2 rounded-md border border-[var(--border)] p-3">
                <Select label="Liquidar usando a conta" value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)} className="flex-1">
                  <option value="">Selecione...</option>
                  {(accountsQuery.data ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
                <Button type="submit" disabled={payInvoice.isPending}>
                  {payInvoice.isPending ? "Liquidando..." : "Liquidar fatura"}
                </Button>
              </form>
            )}
            {payError && <p className="text-xs text-red-600">{payError}</p>}

            <div className="rounded-md border border-[var(--border)] overflow-hidden">
              <div className="flex px-3.5 py-2.5 bg-black/5 text-xs font-semibold text-[var(--text-muted)]">
                <span className="w-[90px]">Data</span>
                <span className="flex-1">Descrição</span>
                <span className="w-[140px]">Categoria</span>
                <span className="w-[100px] text-right">Valor</span>
              </div>
              {invoiceTransactions.length === 0 ? (
                <p className="p-4 text-sm text-[var(--text-muted)]">Nenhuma transação nesta fatura ainda.</p>
              ) : (
                invoiceTransactions.map((t) => (
                  <div key={t.id} className="flex px-3.5 py-2.5 text-xs border-t border-[var(--border)]">
                    <span className="w-[90px] text-[var(--text-muted)]">{t.date.slice(0, 10)}</span>
                    <span className="flex-1">{t.description}</span>
                    <span className="w-[140px] text-[var(--text-muted)]">{t.category?.name ?? "-"}</span>
                    <span className="w-[100px] text-right">{formatCurrency(Number(t.amount))}</span>
                  </div>
                ))
              )}
            </div>

            {!confirmingArchive ? (
              <Button variant="secondary" className="self-start" onClick={() => setConfirmingArchive(true)}>
                Arquivar cartão
              </Button>
            ) : (
              <div className="flex items-center gap-3 rounded-md border border-red-300 bg-red-50 px-4 py-3">
                <span className="text-sm text-red-700 flex-1">Arquivar &quot;{selectedCard.name}&quot;?</span>
                <Button variant="secondary" onClick={() => setConfirmingArchive(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => archiveCard.mutate()} disabled={archiveCard.isPending}>
                  {archiveCard.isPending ? "Arquivando..." : "Confirmar"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
