"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { ADMIN_NAV_GROUPS, isAdminNavItemActive } from "@/components/admin/admin-nav-items";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ROLE_LABELS } from "@/lib/validations/user";
import { cn } from "@/lib/utils";

/**
 * Navigasi persisten panel admin (PRD §8). Dipakai dua kali oleh
 * `app/admin/layout.tsx`: kolom tetap di layar lebar, dan isi drawer `Sheet`
 * di layar sempit — karena itu ia tidak memasang posisi/lebar sendiri.
 */
export function AdminSidebar({
  onNavigate,
  onLogout,
}: {
  /** Dipanggil setiap item diklik supaya drawer mobile bisa menutup diri. */
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <Logo withTagline={false} href="/admin" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.superAdminOnly || isSuperAdmin);
          if (items.length === 0) {
            return null;
          }

          return (
            <div key={group.title ?? "utama"} className="mb-5 last:mb-0">
              {group.title && (
                <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {group.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map(({ href, label, icon: Icon }) => {
                  const isActive = isAdminNavItemActive(href, pathname);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-brand-purple-soft text-brand-purple"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        {user && (
          <div className="px-2 pb-2">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
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
