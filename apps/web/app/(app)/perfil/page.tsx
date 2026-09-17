"use client";

import { useState } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { api, ApiError } from "../../../lib/api";
import { Button } from "../../../components/ui/Button";

export default function PerfilPage() {
  const user = useAuthStore((s) => s.user);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleChangePassword() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post<{ message: string }>("/auth/change-password");
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Não foi possível enviar o e-mail");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-md">
      <h1 className="text-lg font-bold">Meu perfil</h1>

      {user && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-2 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">Nome: </span>
            {user.firstName} {user.lastName}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">E-mail: </span>
            {user.email}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={handleChangePassword} disabled={loading}>
          {loading ? "Enviando..." : "Alterar senha"}
        </Button>
        {message && <p className="text-xs text-[var(--text-muted)]">{message}</p>}
      </div>
    </div>
  );
}
