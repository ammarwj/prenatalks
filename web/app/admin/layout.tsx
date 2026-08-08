"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { authLogout } from "@/lib/auth";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Guard `/admin/*` — arahkan ke /masuk bila tidak ada sesi, atau ke
 * /dashboard bila sesi ada tapi role bukan admin/super_admin
 * (PRD §5 — RBAC). Belum ada halaman admin sungguhan (F-14); ini menyiapkan
 * pola guard-nya lebih dulu.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const isAuthorized = !!user && (user.role === "admin" || user.role === "super_admin");

  useEffect(() => {
    if (!accessToken) {
      router.replace("/masuk");
      return;
    }
    if (user && !isAuthorized) {
      router.replace("/dashboard");
    }
  }, [accessToken, user, isAuthorized, router]);

  async function handleLogout() {
    await authLogout(accessToken);
    clearSession();
    router.replace("/masuk");
  }

  if (!accessToken || !isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo withTagline={false} />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
              {user?.name} · Admin
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5"
            >
              <LogOut className="size-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
