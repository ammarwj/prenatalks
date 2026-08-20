"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MailWarning } from "lucide-react";

import { DashboardBottomNav } from "@/components/dashboard/dashboard-bottom-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { GestationalChip } from "@/components/dashboard/gestational-chip";
import { FullPageLoader } from "@/components/shared/loading-state";
import { Logo } from "@/components/shared/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authLogout } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth-routes";
import { useSessionRehydrate } from "@/lib/hooks/use-session-rehydrate";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDashboardStore } from "@/lib/stores/dashboard-store";

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
  const pathname = usePathname();
  const { isHydrating } = useSessionRehydrate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const loadOverview = useDashboardStore((state) => state.load);
  const clearOverview = useDashboardStore((state) => state.clear);

  const isManager = isAdminRole(user?.role);

  useEffect(() => {
    if (isHydrating) {
      return;
    }
    if (!accessToken) {
      // Tujuan asal ikut dibawa supaya tamu yang mengklik pintasan di landing
      // page (mis. kartu "Cek Risiko") kembali ke fitur itu setelah masuk,
      // bukan dibuang ke beranda dashboard.
      router.replace(`/masuk?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isManager) {
      router.replace("/admin");
    }
  }, [isHydrating, accessToken, isManager, pathname, router]);

  /**
   * Ringkasan dimuat sekali di sini, bukan di tiap halaman: chip usia
   * kehamilan di kerangka navigasi membutuhkannya di mana-mana, dan beranda
   * membaca dari cache yang sama alih-alih menembak `/dashboard` lagi.
   */
  useEffect(() => {
    if (!isHydrating && accessToken && !isManager) {
      loadOverview();
    }
  }, [isHydrating, accessToken, isManager, loadOverview]);

  async function handleLogout() {
    await authLogout(accessToken);
    clearSession();
    clearOverview();
    router.replace("/masuk");
  }

  if (isHydrating) {
    return (
      <FullPageLoader label="Memuat sesi" />
    );
  }

  // `isManager` ikut menahan render supaya konten ibu hamil tidak sempat
  // berkedip sebelum redirect ke /admin berjalan.
  if (!accessToken || isManager) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/40 lg:flex">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-border lg:block">
        <DashboardSidebar onLogout={handleLogout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header sempit tidak lagi memuat tombol navigasi apa pun — semuanya
            turun ke bilah bawah yang terjangkau ibu jari. Yang tersisa cuma
            identitas dan usia kehamilan. */}
        <header className="sticky top-0 z-40 border-b border-border bg-white lg:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <Logo withTagline={false} href="/dashboard" />
            <GestationalChip variant="inline" />
          </div>
        </header>

        {/* pb-28 memberi ruang untuk bilah bawah yang `fixed`; tanpa itu
            konten terakhir setiap halaman tertutup olehnya. */}
        <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-28 sm:px-6 lg:pb-8">
          {user && !user.email_verified_at && (
            <Alert className="mb-6 rounded-xl border-warning/30 bg-feature-amber-soft">
              <MailWarning className="size-4 text-warning" />
              <AlertDescription className="text-warning">
                Email Anda belum terverifikasi. Cek tautan verifikasi yang kami kirim ke{" "}
                <strong>{user.email}</strong> — hasil cek risiko belum bisa disimpan sebelum email
                diverifikasi.
              </AlertDescription>
            </Alert>
          )}

          {children}
        </main>
      </div>

      <DashboardBottomNav onLogout={handleLogout} />
    </div>
  );
}
