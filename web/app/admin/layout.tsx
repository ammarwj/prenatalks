"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Menu } from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authLogout } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth-routes";
import { useSessionRehydrate } from "@/lib/hooks/use-session-rehydrate";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Kerangka panel admin: guard RBAC + sidebar navigasi persisten (PRD §5, §8).
 *
 * Guard mengarahkan ke /masuk bila tidak ada sesi, atau ke /dashboard bila
 * sesi ada tapi role bukan admin/super_admin — tidak berisiko loop dengan
 * guard kebalikannya di app/dashboard/layout.tsx karena kedua himpunan role
 * saling lepas. Keputusan redirect ditunda sampai `useSessionRehydrate()`
 * selesai menukar cookie httpOnly, kalau tidak setiap refresh halaman akan
 * terlempar ke /masuk.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isHydrating } = useSessionRehydrate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAuthorized = isAdminRole(user?.role);

  useEffect(() => {
    if (isHydrating) {
      return;
    }
    if (!accessToken) {
      router.replace("/masuk");
      return;
    }
    if (user && !isAuthorized) {
      router.replace("/dashboard");
    }
  }, [isHydrating, accessToken, user, isAuthorized, router]);

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

  if (!accessToken || !isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/40 lg:flex">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-border lg:block">
        <AdminSidebar onLogout={handleLogout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-white lg:hidden">
          <div className="flex h-16 items-center gap-3 px-4">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="ghost" size="sm" aria-label="Buka menu admin">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigasi panel admin</SheetTitle>
                <AdminSidebar
                  onNavigate={() => setMobileNavOpen(false)}
                  onLogout={handleLogout}
                />
              </SheetContent>
            </Sheet>
            <span className="truncate text-sm font-semibold text-foreground">Panel Admin</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
