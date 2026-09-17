"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../../lib/api";
import type { Category } from "../../../lib/types";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";

const SWATCHES = ["#319085", "#21665c", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];

export default function CategoriasPage() {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: () => api.get<Category[]>("/categories") });
  const categories = categoriesQuery.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => api.post("/categories", { name, color, parentId: parentId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowForm(false);
      setName("");
      setParentId("");
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível criar a categoria"),
  });

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    create.mutate();
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center">
        <h1 className="text-lg font-bold">Categorias</h1>
        <div className="flex-1" />
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancelar" : "+ Nova categoria"}</Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-4">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-[var(--text-muted)]">Cor</span>
            <div className="flex gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-[var(--text)]" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <Select label="Categoria pai (opcional — deixe em branco para criar categoria principal)" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Nenhuma (categoria principal)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      )}

      {categoriesQuery.isLoading && <p className="text-sm text-[var(--text-muted)]">Carregando...</p>}

      <div className="flex flex-col gap-2">
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-2">
      <CategoryItem category={category} />
      {(category.children ?? []).length > 0 && (
        <div className="pl-6 flex flex-col gap-2 border-l border-[var(--border)] ml-2">
          {category.children!.map((child) => (
            <CategoryItem key={child.id} category={child} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryItem({ category }: { category: Category }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState(category.name);
  const [error, setError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: () => api.patch(`/categories/${category.id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditing(false);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível salvar"),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/categories/${category.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover");
      setConfirmingDelete(false);
    },
  });

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          update.mutate();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 flex-1 rounded border border-[var(--border)] bg-transparent px-2 text-sm"
          autoFocus
        />
        <button type="submit" className="text-xs text-primary">
          Salvar
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-[var(--text-muted)]">
          Cancelar
        </button>
      </form>
    );
  }

  if (confirmingDelete) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="flex-1 text-red-700">Excluir &quot;{category.name}&quot;?</span>
        <button type="button" onClick={() => setConfirmingDelete(false)} className="text-[var(--text-muted)]">
          Cancelar
        </button>
        <button type="button" onClick={() => remove.mutate()} className="font-semibold text-red-700">
          Confirmar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: category.color ?? "#94a3b8" }} />
      <span className="flex-1">{category.name}</span>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {!category.isSeeded && (
        <>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setEditing(true);
            }}
            className="text-xs text-[var(--text-muted)] hover:text-primary"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setConfirmingDelete(true);
            }}
            className="text-xs text-red-600 hover:underline"
          >
            Excluir
          </button>
        </>
      )}
      {category.isSeeded && <span className="text-[10px] text-[var(--text-muted)]">pré-cadastrada</span>}
    </div>
  );
}
