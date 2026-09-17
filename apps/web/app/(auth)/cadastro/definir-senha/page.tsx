"use client";

import { Suspense } from "react";
import { api } from "../../../../lib/api";
import { SetPasswordForm } from "../../../../components/SetPasswordForm";

export default function DefinirSenhaPage() {
  return (
    <Suspense>
      <SetPasswordForm
        title="Definir senha"
        submitLabel="Concluir cadastro"
        onSubmit={(body) => api.post("/auth/signup/complete", body, { auth: false })}
      />
    </Suspense>
  );
}
