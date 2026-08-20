"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Users } from "lucide-react";

import { FullPageLoader } from "@/components/shared/loading-state";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { authLogout } from "@/lib/auth";
import { isHealthWorkerRole, landingPathForRole } from "@/lib/auth-routes";
import { useSessionRehydrate } from "@/lib/hooks/use-session-rehydrate";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Guard `/nakes/*` — area tenaga kesehatan (PRD §9 F-15).
 *
 * Peran lain diarahkan ke "rumah"-nya masing-masing lewat
 * `landingPathForRole`, bukan ditolak dengan halaman galat: pengguna biasa
 * yang mengklik tautan akses milik orang lain sedang tersesat, bukan sedang
 * menyerang. Penjagaan yang sesungguhnya tetap di backend — middleware
 * `role:health_worker` plus pemeriksaan pemilik izin per baris.
 *
 * Alur penundaan redirect sampai `useSessionRehydrate()` selesai sama persis
 * dengan layout dashboard; lihat alasannya di sana.
 */
export default function NakesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isHydrating } = useSessionRehydrate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const isHealthWorker = isHealthWorkerRole(user?.role);

  useEffect(() => {
    if (isHydrating) {
      return;
    }
    if (!accessToken) {
      router.replace("/masuk");
      return;
    }
    if (user && !isHealthWorker) {
      router.replace(landingPathForRole(user.role));
    }
  }, [isHydrating, accessToken, isHealthWorker, user, router]);

  async function handleLogout() {
    await authLogout(accessToken);
    clearSession();
    router.replace("/masuk");
  }

  if (isHydrating) {
    return (
      <FullPageLoader label="Memuat sesi" />
    );
  }

  if (!accessToken || !isHealthWorker) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo withTagline={false} href="/nakes" />
          <div className="flex items-center gap-4">
            <Button asChild type="button" variant="ghost" size="sm" className="gap-1.5">
              <Link href="/nakes">
                <Users className="size-4" />
                Daftar Pasien
              </Link>
            </Button>
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
