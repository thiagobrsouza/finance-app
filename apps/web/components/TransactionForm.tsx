"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { flattenCategories } from "../lib/categories";
import type { Account, Category, CreditCard, PaymentMethod } from "../lib/types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

type AdvancedMode = "none" | "recurring" | "installment";

interface TransactionFormProps {
  onCreated?: () => void;
}

export function TransactionForm({ onCreated }: TransactionFormProps) {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: () => api.get<Category[]>("/categories") });
  const paymentMethodsQuery = useQuery({ queryKey: ["payment-methods"], queryFn: () => api.get<PaymentMethod[]>("/payment-methods") });
  const accountsQuery = useQuery({ queryKey: ["accounts"], queryFn: () => api.get<Account[]>("/accounts") });
  const cardsQuery = useQuery({ queryKey: ["credit-cards"], queryFn: () => api.get<CreditCard[]>("/credit-cards") });

  const categoryOptions = useMemo(() => flattenCategories(categoriesQuery.data ?? []), [categoriesQuery.data]);
  const paymentMethods = paymentMethodsQuery.data ?? [];

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedMode, setAdvancedMode] = useState<AdvancedMode>("none");
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState("1");
  const [installmentCount, setInstallmentCount] = useState("2");
  const [ignoreInReports, setIgnoreInReports] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const selectedPaymentMethod = paymentMethods.find((p) => p.id === paymentMethodId);
  const requiresCard = selectedPaymentMethod?.requiresCreditCard ?? false;

  const create = useMutation({
    mutationFn: () =>
      api.post("/transactions", {
        amount: Number(amount),
        description,
        date,
        categoryId,
        paymentMethodId,
        accountId: requiresCard ? undefined : accountId,
        creditCardId: requiresCard ? creditCardId : undefined,
        type,
        advanced: {
          ...(advancedMode === "recurring" ? { recurring: { dayOfMonth: Number(recurringDayOfMonth) } } : {}),
          ...(advancedMode === "installment" ? { installment: { count: Number(installmentCount) } } : {}),
          ignoreInReports,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      setAmount("");
      setDescription("");
      setAdvancedOpen(false);
      setAdvancedMode("none");
      setIgnoreInReports(false);
      onCreated?.();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível salvar a transação"),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!categoryId || !paymentMethodId) {
      setError("Selecione categoria e forma de pagamento");
      return;
    }
    if (requiresCard && !creditCardId) {
      setError("Selecione o cartão de crédito");
      return;
    }
    if (!requiresCard && !accountId) {
      setError("Selecione a conta");
      return;
    }

    create.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3.5">
      <h2 className="text-sm font-semibold">Nova transação</h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={`flex-1 h-9 rounded-md text-sm font-medium ${type === "EXPENSE" ? "bg-red-100 text-red-700" : "border border-[var(--border)] text-[var(--text-muted)]"}`}
        >
          Despesa
        </button>
        <button
          type="button"
          onClick={() => setType("INCOME")}
          className={`flex-1 h-9 rounded-md text-sm font-medium ${type === "INCOME" ? "bg-green-100 text-green-700" : "border border-[var(--border)] text-[var(--text-muted)]"}`}
        >
          Receita
        </button>
      </div>

      <Input label="Valor" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

      <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Selecione...</option>
        {categoryOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>

      <Select label="Forma de pagamento" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
        <option value="">Selecione...</option>
        {paymentMethods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>

      {requiresCard ? (
        <Select label="Cartão" value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)}>
          <option value="">Selecione...</option>
          {(cardsQuery.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      ) : (
        <Select label="Conta" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">Selecione...</option>
          {(accountsQuery.data ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      )}

      <button type="button" onClick={() => setAdvancedOpen((v) => !v)} className="text-xs text-primary text-left">
        {advancedOpen ? "Ocultar avançado" : "Avançado"}
      </button>

      {advancedOpen && (
        <div className="rounded-md border border-dashed border-[var(--border)] p-3 flex flex-col gap-3">
          <div className="flex gap-2 text-xs">
            {(["none", "recurring", "installment"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAdvancedMode(mode)}
                className={`px-2.5 py-1 rounded ${advancedMode === mode ? "bg-primary text-white" : "border border-[var(--border)] text-[var(--text-muted)]"}`}
              >
                {mode === "none" ? "Única" : mode === "recurring" ? "Recorrente" : "Parcelado"}
              </button>
            ))}
          </div>

          {advancedMode === "recurring" && (
            <Input
              label="Repete todo dia (1-31)"
              type="number"
              min={1}
              max={31}
              value={recurringDayOfMonth}
              onChange={(e) => setRecurringDayOfMonth(e.target.value)}
            />
          )}

          {advancedMode === "installment" && (
            <Input
              label="Número de parcelas"
              type="number"
              min={2}
              max={60}
              value={installmentCount}
              onChange={(e) => setInstallmentCount(e.target.value)}
            />
          )}

          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <input type="checkbox" checked={ignoreInReports} onChange={(e) => setIgnoreInReports(e.target.checked)} />
            Ignorar transação (não entra nos relatórios)
          </label>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
