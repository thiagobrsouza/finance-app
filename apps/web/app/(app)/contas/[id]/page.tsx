"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../../../lib/api";
import { formatCurrency } from "../../../../lib/format";
import { ACCOUNT_TYPE_LABEL, type Account, type AccountBalanceSnapshot, type AccountType, type Institution } from "../../../../lib/types";
import { InstitutionLogo } from "../../../../components/InstitutionLogo";
import { BalanceChart } from "../../../../components/BalanceChart";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const accountQuery = useQuery({ queryKey: ["accounts", id], queryFn: () => api.get<Account>(`/accounts/${id}`) });
  const historyQuery = useQuery({
    queryKey: ["accounts", id, "balance-history"],
    queryFn: () => api.get<AccountBalanceSnapshot[]>(`/accounts/${id}/balance-history`),
  });
  const institutionsQuery = useQuery({ queryKey: ["institutions"], queryFn: () => api.get<Institution[]>("/institutions") });

  const [editing, setEditing] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [name, setName] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [type, setType] = useState<AccountType>("CORRENTE");
  const [error, setError] = useState<string | null>(null);

  const account = accountQuery.data;

  function startEditing() {
    if (!account) return;
    setName(account.name);
    setInstitutionId(account.institutionId);
    setType(account.type);
    setEditing(true);
  }

  const update = useMutation({
    mutationFn: () => api.patch<Account>(`/accounts/${id}`, { name, institutionId, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setEditing(false);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível salvar"),
  });

  const archive = useMutation({
    mutationFn: () => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      router.push("/contas");
    },
  });

  function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    update.mutate();
  }

  if (accountQuery.isLoading || !account) {
    return <p className="text-sm text-[var(--text-muted)]">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/contas" className="text-sm text-primary">
          ← Contas
        </Link>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-4">
        {!editing ? (
          <>
            <div className="flex items-center gap-3">
              <InstitutionLogo name={account.institution.name} domain={account.institution.domain} iconUrl={account.institution.iconUrl} size={40} />
              <div>
                <div className="text-lg font-bold">{account.name}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  {account.institution.name} · {ACCOUNT_TYPE_LABEL[account.type]}
                </div>
              </div>
              <div className="flex-1" />
              <div className="text-xl font-bold">{formatCurrency(Number(account.currentBalance))}</div>
            </div>

            {!confirmingArchive ? (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={startEditing}>
                  Editar
                </Button>
                <Button variant="secondary" onClick={() => setConfirmingArchive(true)}>
                  Arquivar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-md border border-red-300 bg-red-50 px-4 py-3">
                <span className="text-sm text-red-700 flex-1">Arquivar &quot;{account.name}&quot;? O histórico é preservado.</span>
                <Button variant="secondary" onClick={() => setConfirmingArchive(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => archive.mutate()} disabled={archive.isPending}>
                  {archive.isPending ? "Arquivando..." : "Confirmar"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
            <Select label="Instituição financeira" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
              {(institutionsQuery.data ?? []).map((inst) => (
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
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Histórico de saldo</h2>
        {historyQuery.isLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Carregando...</p>
        ) : (
          <BalanceChart snapshots={historyQuery.data ?? []} />
        )}
      </div>
    </div>
  );
}
