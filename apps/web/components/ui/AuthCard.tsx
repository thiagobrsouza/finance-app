import type { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[380px] p-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-4">
      {children}
    </div>
  );
}
