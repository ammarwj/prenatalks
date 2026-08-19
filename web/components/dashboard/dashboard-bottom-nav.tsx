"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Home, Menu, ShieldCheck, type LucideIcon } from "lucide-react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { activeDashboardNavHref } from "@/components/dashboard/dashboard-nav-items";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Empat tujuan yang paling sering dituju sehari-hari. Sisanya — dan
 * seluruh daftar lengkapnya — ada di balik tab "Menu".
 *
 * Kalkulator sengaja tidak di sini meski terasa penting: ia dipakai sekali
 * di awal lalu jarang disentuh lagi, sementara checklist persiapan dibuka
 * berulang kali sepanjang kehamilan.
 */
const PRIMARY_TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/dashboard/cek-risiko", label: "Cek Risiko", icon: ShieldCheck },
  { href: "/dashboard/persiapan", label: "Persiapan", icon: CheckSquare },
];

const TAB_CLASS =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition-colors";

/**
 * Navigasi utama di layar sempit (PRD §4 — persona P1 memakai ponsel).
 *
 * Diletakkan di dasar layar, bukan di balik hamburger di puncaknya: area
 * ini dipakai sambil hamil, sering satu tangan, dan puncak layar ponsel
 * modern adalah bagian yang paling sulit dijangkau ibu jari.
 */
export function DashboardBottomNav({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeHref = activeDashboardNavHref(pathname);

  // Tujuan di luar keempat tab (mis. Data Kehamilan) menyalakan "Menu" —
  // supaya tidak pernah ada halaman yang membuat seluruh bilah terlihat mati.
  const isMenuActive =
    menuOpen || !PRIMARY_TABS.some((tab) => tab.href === activeHref);

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="flex items-stretch">
        {PRIMARY_TABS.map(({ href, label, icon: Icon }) => {
          const isActive = href === activeHref;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                TAB_CLASS,
                isActive ? "text-primary-text" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            className={cn(
              TAB_CLASS,
              isMenuActive ? "text-primary-text" : "text-muted-foreground"
            )}
            aria-label="Buka menu lengkap"
          >
            <Menu className={cn("size-5", isMenuActive && "stroke-[2.5]")} />
            Menu
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigasi dashboard</SheetTitle>
            <DashboardSidebar onNavigate={() => setMenuOpen(false)} onLogout={onLogout} />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
