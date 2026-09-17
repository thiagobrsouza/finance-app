"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "../lib/api";
import { AuthCard } from "./ui/AuthCard";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

interface SetPasswordFormProps {
  title: string;
  submitLabel: string;
  onSubmit: (params: { token: string; password: string; passwordConfirmation: string }) => Promise<unknown>;
}

export function SetPasswordForm({ title, submitLabel, onSubmit }: SetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError("As senhas não conferem");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ token, password, passwordConfirmation });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível concluir");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthCard>
        <p className="text-sm text-red-600">Link inválido — verifique se copiou o link completo recebido por e-mail.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 className="text-xl font-bold">{title}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nova senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <Input
          label="Confirmar senha"
          type="password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          minLength={8}
          required
        />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Enviando..." : submitLabel}
        </Button>
      </form>
    </AuthCard>
  );
}
