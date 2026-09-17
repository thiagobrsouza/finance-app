"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../lib/api";
import { AuthCard } from "../../../components/ui/AuthCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email }, { auth: false });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar o e-mail");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-lg font-bold">Verifique seu e-mail</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Se <b>{email}</b> estiver cadastrado, enviamos um link para redefinir sua senha.
          </p>
        </div>
        <Link href="/login">
          <Button className="w-full">Voltar para o login</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 className="text-xl font-bold">Esqueci a senha</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Enviando..." : "Enviar link"}
        </Button>
      </form>
      <Link href="/login" className="text-xs text-center text-primary">
        Voltar para o login
      </Link>
    </AuthCard>
  );
}
