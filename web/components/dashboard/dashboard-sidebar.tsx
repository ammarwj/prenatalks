"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, LogOut } from "lucide-react";

import {
  DASHBOARD_NAV_GROUPS,
  activeDashboardNavHref,
} from "@/components/dashboard/dashboard-nav-items";
import { GestationalChip } from "@/components/dashboard/gestational-chip";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

/**
 * Navigasi persisten area ibu hamil. Dipakai dua kali oleh
 * `app/dashboard/layout.tsx`: kolom tetap di layar lebar, dan isi drawer
 * `Sheet` di layar sempit — karena itu ia tidak memasang posisi/lebar
 * sendiri.
 *
 * Kerangkanya sengaja sama persis dengan `components/admin/admin-sidebar.tsx`
 * supaya dua area terbaca sebagai satu produk; yang membedakan cuma warna
 * penanda aktif — merah muda di sini, ungu di panel admin.
 */
export function DashboardSidebar({
  onNavigate,
  onLogout,
}: {
  /** Dipanggil setiap item diklik supaya drawer mobile bisa menutup diri. */
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const activeHref = activeDashboardNavHref(pathname);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <Logo withTagline={false} href="/dashboard" />
      </div>

      <div className="shrink-0 px-3 pt-4">
        <GestationalChip variant="card" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {DASHBOARD_NAV_GROUPS.map((group) => (
          <div key={group.title ?? "utama"} className="mb-5 last:mb-0">
            {group.title && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, external }) => {
                const isActive = href === activeHref;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-primary-soft text-primary-text"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {label}
                      {external && (
                        <ArrowUpRight className="ml-auto size-3.5 shrink-0 opacity-50" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        {user && (
          <div className="px-2 pb-2">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start gap-2.5 px-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}
