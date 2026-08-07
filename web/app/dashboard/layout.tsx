"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Guard `/dashboard/*` — arahkan ke /masuk bila tidak ada sesi (PRD F-02).
 * Sesi hanya hidup di memory (lihat auth-store.ts), jadi refresh halaman
 * akan selalu memicu redirect ini sampai alur refresh-via-cookie dibangun.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/masuk");
    }
  }, [accessToken, router]);

  async function handleLogout() {
    try {
      await apiPost("/auth/logout");
    } catch {
      // tetap keluar secara lokal walau API tidak terjangkau
    }
    clearSession();
    router.replace("/masuk");
  }

  if (!accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo withTagline={false} />
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                {user.name}
              </span>
            )}
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
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
