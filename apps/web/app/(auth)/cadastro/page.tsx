"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../lib/api";
import { AuthCard } from "../../../components/ui/AuthCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export default function CadastroPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/signup", { firstName, lastName, email }, { auth: false });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível concluir o cadastro");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
            <div className="w-5 h-3.5 border-2 border-primary rounded-sm" />
          </div>
          <h1 className="text-lg font-bold">E-mail enviado</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Foi enviado um e-mail de validação para <b>{email}</b>. Abra o link recebido para definir sua senha e concluir o cadastro.
          </p>
        </div>
        <Link href="/login">
          <Button className="w-full">OK</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 className="text-xl font-bold">Criar conta</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <Input label="Sobrenome" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Enviando..." : "Enviar link de cadastro"}
        </Button>
      </form>

      <div className="text-xs text-center text-[var(--text-muted)]">
        Já tem conta? <Link href="/login" className="text-primary">Entrar</Link>
      </div>
    </AuthCard>
  );
}
