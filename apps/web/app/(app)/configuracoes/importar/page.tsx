"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../../../lib/api";
import { formatCurrency } from "../../../../lib/format";
import { flattenCategories } from "../../../../lib/categories";
import type { Account, Category, ImportPreview, PaymentMethod } from "../../../../lib/types";
import { Button } from "../../../../components/ui/Button";
import { Select } from "../../../../components/ui/Select";

export default function ImportarPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number } | null>(null);

  const accountsQuery = useQuery({ queryKey: ["accounts"], queryFn: () => api.get<Account[]>("/accounts") });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: () => api.get<Category[]>("/categories") });
  const paymentMethodsQuery = useQuery({ queryKey: ["payment-methods"], queryFn: () => api.get<PaymentMethod[]>("/payment-methods") });
  const categoryOptions = flattenCategories(categoriesQuery.data ?? []);

  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: (file: File) => api.upload<ImportPreview>("/imports", file),
    onSuccess: (data) => {
      setPreview(data);
      setSelected(new Set(data.transactions.map((t) => t.index)));
      setResult(null);
      setUploadError(null);
    },
    onError: (err) => setUploadError(err instanceof ApiError ? err.message : "Não foi possível ler o arquivo"),
  });

  const confirm = useMutation({
    mutationFn: () =>
      api.post<{ imported: number }>(`/imports/${preview!.previewId}/confirm`, {
        selectedIndexes: Array.from(selected),
        accountId,
        categoryId,
        paymentMethodId,
      }),
    onSuccess: (data) => {
      setResult(data);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (err) => setConfirmError(err instanceof ApiError ? err.message : "Não foi possível confirmar a importação"),
  });

  function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    upload.mutate(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    handleFile(event.dataTransfer.files[0]);
  }

  function toggleRow(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleConfirm(event: FormEvent) {
    event.preventDefault();
    setConfirmError(null);
    if (!accountId || !categoryId || !paymentMethodId) {
      setConfirmError("Selecione conta, categoria e forma de pagamento");
      return;
    }
    if (selected.size === 0) {
      setConfirmError("Selecione ao menos uma transação");
      return;
    }
    confirm.mutate();
  }

  function reset() {
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold">Importar dados</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Formatos suportados: OFX, XLSX, CSV</p>
      </div>

      {result && (
        <div className="rounded-md border border-green-300 bg-green-50 p-4 flex items-center justify-between">
          <span className="text-sm text-green-700">{result.imported} transação(ões) importada(s) com sucesso.</span>
          <Button variant="secondary" onClick={reset}>
            Importar outro arquivo
          </Button>
        </div>
      )}

      {!preview && !result && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`h-[180px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer text-sm text-[var(--text-muted)] ${
            dragOver ? "border-primary bg-primary-light" : "border-[var(--border)] bg-[var(--surface)]"
          }`}
        >
          <span>Arraste o arquivo aqui ou clique para selecionar</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.ofx"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {upload.isPending && <p className="text-sm text-[var(--text-muted)]">Lendo arquivo...</p>}
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

      {preview && (
        <form onSubmit={handleConfirm} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-4">
          <div className="flex items-center">
            <h2 className="text-sm font-semibold">Pré-visualização ({preview.fileName})</h2>
            <div className="flex-1" />
            <button type="button" onClick={reset} className="text-xs text-[var(--text-muted)]">
              Cancelar
            </button>
          </div>

          {preview.warnings.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 flex flex-col gap-1">
              {preview.warnings.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>
          )}

          <div className="rounded-md border border-[var(--border)] overflow-hidden max-h-[280px] overflow-y-auto">
            <div className="flex px-3 py-2 bg-black/5 text-xs font-semibold text-[var(--text-muted)] sticky top-0">
              <span className="w-[24px]" />
              <span className="w-[90px]">Data</span>
              <span className="flex-1">Descrição</span>
              <span className="w-[100px] text-right">Valor</span>
            </div>
            {preview.transactions.map((t) => (
              <label key={t.index} className="flex items-center px-3 py-2 text-xs border-t border-[var(--border)] cursor-pointer">
                <input type="checkbox" className="w-[24px]" checked={selected.has(t.index)} onChange={() => toggleRow(t.index)} />
                <span className="w-[90px] text-[var(--text-muted)]">{t.date}</span>
                <span className="flex-1">{t.description}</span>
                <span className={`w-[100px] text-right font-medium ${t.type === "EXPENSE" ? "text-red-600" : "text-green-600"}`}>
                  {t.type === "EXPENSE" ? "- " : "+ "}
                  {formatCurrency(t.amount)}
                </span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select label="Conta" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Selecione...</option>
              {(accountsQuery.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
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
              {(paymentMethodsQuery.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {confirmError && <p className="text-xs text-red-600">{confirmError}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={confirm.isPending} className="flex-1">
              {confirm.isPending ? "Importando..." : `Confirmar importação (${selected.size})`}
            </Button>
            <Button type="button" variant="secondary" onClick={reset}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
