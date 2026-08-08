"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isNavItemActive } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

/**
 * Daftar menu publik dengan penanda halaman aktif. Dipakai tiga tempat
 * dengan tata letak berbeda: baris horizontal di navbar landing dan header
 * halaman publik (`variant="row"`), dan tumpukan vertikal di drawer mobile
 * (`variant="stack"`).
 */
export function PublicNav({
  variant = "row",
  onNavigate,
}: {
  variant?: "row" | "stack";
  /** Dipanggil tiap item diklik supaya drawer mobile bisa menutup diri. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isStack = variant === "stack";

  return (
    <nav className={cn(isStack ? "flex flex-col gap-1" : "flex items-center gap-7")}>
      {NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "text-sm font-semibold transition-colors",
              isStack
                ? "rounded-xl px-3 py-2.5"
                : "border-b-2 pb-1",
              isActive
                ? isStack
                  ? "bg-primary-soft text-primary-text"
                  : "border-primary text-foreground"
                : isStack
                  ? "text-muted-foreground hover:bg-muted"
                  : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
