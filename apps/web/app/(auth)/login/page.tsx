"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "../../../lib/api";
import { useAuthStore } from "../../../store/auth-store";
import { AuthCard } from "../../../components/ui/AuthCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

type Step = "credentials" | "mfa";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mfaSessionId, setMfaSessionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentials(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<{ mfaRequired: boolean; mfaSessionId: string }>("/auth/login", { email, password }, { auth: false });
      setMfaSessionId(data.mfaSessionId);
      setStep("mfa");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyMfa(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string }>(
        "/auth/login/verify-mfa",
        { mfaSessionId, code },
        { auth: false },
      );
      setSession(data);
      const me = await api.get<{ id: string; firstName: string; lastName: string; email: string; themePreference: "LIGHT" | "DARK" | "SYSTEM" }>("/auth/me");
      useAuthStore.getState().setUser(me);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  if (step === "mfa") {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
            <div className="w-5 h-3.5 border-2 border-primary rounded-sm" />
          </div>
          <h1 className="text-lg font-bold">Verifique seu e-mail</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Enviamos um código de verificação para <b>{email}</b>. Digite o código abaixo para continuar.
          </p>
        </div>

        <form onSubmit={handleVerifyMfa} className="flex flex-col gap-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            inputMode="numeric"
            placeholder="000000"
            className="text-center tracking-[6px] text-lg"
            autoFocus
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
            {loading ? "Verificando..." : "Verificar"}
          </Button>
        </form>

        <button type="button" className="text-xs text-[var(--text-muted)]" onClick={() => setStep("credentials")}>
          Voltar
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div>
        <div className="text-xl font-bold">FinanceApp</div>
        <div className="text-sm text-[var(--text-muted)]">Controle financeiro pessoal</div>
      </div>

      <form onSubmit={handleCredentials} className="flex flex-col gap-4">
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <Link href="/esqueci-senha" className="text-xs text-right text-primary">
          Esqueci a senha
        </Link>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="text-xs text-center text-[var(--text-muted)]">
        Não tem conta? <Link href="/cadastro" className="text-primary">Cadastre-se</Link>
      </div>
    </AuthCard>
  );
}
