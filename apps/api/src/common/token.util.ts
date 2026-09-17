import { randomBytes, randomInt, createHash } from "crypto";

/** Código numérico de 6 dígitos para MFA. */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Token opaco (cadastro, reset de senha, refresh token) — enviado ao usuário, nunca persistido em texto puro. */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hash determinístico usado para comparar tokens/códigos sem guardá-los em texto puro. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
