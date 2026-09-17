import type { ReactNode } from "react";
import { AuthGuard } from "../../components/AuthGuard";
import { Navbar } from "../../components/Navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-7">{children}</main>
      </div>
    </AuthGuard>
  );
}
