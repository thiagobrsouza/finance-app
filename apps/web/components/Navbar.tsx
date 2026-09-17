"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "../store/auth-store";
import { api } from "../lib/api";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transacoes", label: "Transações" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/contas", label: "Contas" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/categorias", label: "Categorias" },
  { href: "/configuracoes/importar", label: "Configurações" },
];

export function Navbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() : "?";

  async function handleLogout() {
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken }, { auth: false }).catch(() => undefined);
    }
    clear();
    router.push("/login");
  }

  return (
    <nav className="h-14 flex items-center gap-6 px-7 bg-[var(--navbar)] text-white flex-shrink-0">
      <span className="font-bold text-[15px] mr-2">FinanceApp</span>
      {NAV_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="text-[13px] text-[var(--navbar-muted)] hover:text-white">
          {link.label}
        </Link>
      ))}

      <div className="ml-auto relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-[30px] h-[30px] rounded-full bg-primary text-white text-[11px] flex items-center justify-center"
        >
          {initials}
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-lg overflow-hidden">
            <Link href="/perfil" className="block px-4 py-2 text-sm hover:bg-black/5" onClick={() => setMenuOpen(false)}>
              Meu perfil
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-black/5"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
