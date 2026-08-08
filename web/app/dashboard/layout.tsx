"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Loader2, LogOut, MailWarning } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authLogout } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth-routes";
import { useSessionRehydrate } from "@/lib/hooks/use-session-rehydrate";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Guard `/dashboard/*` — arahkan ke /masuk bila tidak ada sesi (PRD F-02),
 * dan ke /admin bila yang masuk adalah role pengelola: area ini berisi data
 * kehamilan milik ibu hamil, bukan tempat kerja admin (PRD §5).
 *
 * Keputusan redirect ditunda sampai `useSessionRehydrate()` selesai menukar
 * cookie httpOnly `pt_refresh` jadi access_token, kalau tidak setiap refresh
 * halaman akan terlempar ke /masuk padahal sesinya masih sah.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isHydrating } = useSessionRehydrate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const isManager = isAdminRole(user?.role);

  useEffect(() => {
    if (isHydrating) {
      return;
    }
    if (!accessToken) {
      router.replace("/masuk");
      return;
    }
    if (isManager) {
      router.replace("/admin");
    }
  }, [isHydrating, accessToken, isManager, router]);

  async function handleLogout() {
    await authLogout(accessToken);
    clearSession();
    router.replace("/masuk");
  }

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Memuat sesi...
      </div>
    );
  }

  // `isManager` ikut menahan render supaya konten ibu hamil tidak sempat
  // berkedip sebelum redirect ke /admin berjalan.
  if (!accessToken || isManager) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo withTagline={false} href="/dashboard" />
          <div className="flex items-center gap-4">
            <Button asChild type="button" variant="ghost" size="sm" className="gap-1.5">
              <Link href="/dashboard">
                <Home className="size-4" />
                Dashboard
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

      {user && !user.email_verified_at && (
        <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
          <Alert className="rounded-xl border-warning/30 bg-feature-amber-soft">
            <MailWarning className="size-4 text-warning" />
            <AlertDescription className="text-warning">
              Email Anda belum terverifikasi. Cek tautan verifikasi yang kami kirim ke{" "}
              <strong>{user.email}</strong> — hasil cek risiko belum bisa disimpan sebelum email
              diverifikasi.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
