"use client";

import { Suspense } from "react";
import { api } from "../../../lib/api";
import { SetPasswordForm } from "../../../components/SetPasswordForm";

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <SetPasswordForm
        title="Redefinir senha"
        submitLabel="Salvar nova senha"
        onSubmit={(body) => api.post("/auth/reset-password", body, { auth: false })}
      />
    </Suspense>
  );
}
