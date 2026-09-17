"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../../lib/api";
import { formatCurrency } from "../../../lib/format";
import { ACCOUNT_TYPE_LABEL, type Account, type AccountType, type Institution, type Transfer } from "../../../lib/types";
import { InstitutionLogo } from "../../../components/InstitutionLogo";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";

export default function ContasPage() {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({ queryKey: ["accounts"], queryFn: () => api.get<Account[]>("/accounts") });
  const institutionsQuery = useQuery({ queryKey: ["institutions"], queryFn: () => api.get<Institution[]>("/institutions") });
  const transfersQuery = useQuery({ queryKey: ["transfers"], queryFn: () => api.get<Transfer[]>("/transfers") });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [type, setType] = useState<AccountType>("CORRENTE");
  const [initialBalance, setInitialBalance] = useState("0");
  const [error, setError] = useState<string | null>(null);

  const [showTransfer, setShowTransfer] = useState(false);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [transferError, setTransferError] = useState<string | null>(null);

  const createAccount = useMutation({
    mutationFn: () =>
      api.post<Account>("/accounts", { name, institutionId, type, initialBalance: Number(initialBalance) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowForm(false);
      setName("");
      setInitialBalance("0");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível criar a conta"),
  });

  const createTransfer = useMutation({
    mutationFn: () =>
      api.post("/transfers", {
        fromAccountId,
        toAccountId,
        amount: Number(transferAmount),
        date: transferDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      setShowTransfer(false);
      setTransferAmount("");
    },
    onError: (err) => setTransferError(err instanceof ApiError ? err.message : "Não foi possível transferir"),
  });

  function handleCreateAccount(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!institutionId) {
      setError("Selecione uma instituição");
      return;
    }
    createAccount.mutate();
  }

  function handleTransfer(event: FormEvent) {
    event.preventDefault();
    setTransferError(null);
    if (!fromAccountId || !toAccountId) {
      setTransferError("Selecione as duas contas");
      return;
    }
    createTransfer.mutate();
  }

  const accounts = accountsQuery.data ?? [];
  const institutions = institutionsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <h1 className="text-lg font-bold">Contas bancárias</h1>
        <div className="flex-1" />
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancelar" : "+ Nova conta"}</Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateAccount}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-4 max-w-md"
        >
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select label="Instituição financeira" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
            <option value="">Selecione...</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </Select>
          <Select label="Tipo de conta" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Saldo inicial (opcional)"
            type="number"
            step="0.01"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={createAccount.isPending}>
            {createAccount.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      )}

      {accountsQuery.isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando...</p>}

      <div className="flex gap-4 flex-wrap">
        {accounts.map((account) => (
          <Link
            key={account.id}
            href={`/contas/${account.id}`}
            className="w-[320px] p-[18px] rounded-lg border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-2 hover:border-primary transition-colors"
          >
            <InstitutionLogo name={account.institution.name} domain={account.institution.domain} iconUrl={account.institution.iconUrl} />
            <div className="text-sm font-semibold">{account.name}</div>
            <div className="text-xs text-[var(--text-muted)]">
              {account.institution.name} · {ACCOUNT_TYPE_LABEL[account.type]}
            </div>
            <div className="text-lg font-bold mt-1.5">{formatCurrency(Number(account.currentBalance))}</div>
          </Link>
        ))}

        {!accountsQuery.isLoading && accounts.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">Nenhuma conta cadastrada ainda.</p>
        )}
      </div>

      <div className="flex flex-col gap-3 max-w-lg">
        <div className="flex items-center">
          <h2 className="text-sm font-semibold">Transferências</h2>
          <div className="flex-1" />
          <Button variant="secondary" onClick={() => setShowTransfer((v) => !v)}>
            {showTransfer ? "Cancelar" : "Transferir entre contas"}
          </Button>
        </div>

        {showTransfer && (
          <form
            onSubmit={handleTransfer}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-4"
          >
            <Select label="Conta de origem" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
              <option value="">Selecione...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Select label="Conta de destino" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">Selecione...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Input
              label="Valor"
              type="number"
              step="0.01"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              required
            />
            <Input label="Data" type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required />
            {transferError && <p className="text-xs text-red-600">{transferError}</p>}
            <Button type="submit" disabled={createTransfer.isPending}>
              {createTransfer.isPending ? "Transferindo..." : "Transferir"}
            </Button>
          </form>
        )}

        {(transfersQuery.data ?? []).length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {(transfersQuery.data ?? []).map((transfer) => {
              const from = accounts.find((a) => a.id === transfer.fromAccountId);
              const to = accounts.find((a) => a.id === transfer.toAccountId);
              return (
                <div key={transfer.id} className="flex items-center px-4 py-2.5 text-xs border-b border-[var(--border)] last:border-b-0">
                  <span className="text-[var(--text-muted)] w-[90px]">{transfer.date.slice(0, 10)}</span>
                  <span className="flex-1">
                    {from?.name ?? "?"} → {to?.name ?? "?"}
                  </span>
                  <span className="font-medium">{formatCurrency(Number(transfer.amount))}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
