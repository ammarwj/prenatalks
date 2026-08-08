"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { landingPathForRole } from "@/lib/auth-routes";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const SESSION_HINT_COOKIE = "pt_role";
const KNOWN_ROLES: UserRole[] = ["user", "health_worker", "admin", "super_admin"];

/**
 * Baca cookie petunjuk sesi (lib/server/auth-cookie.ts) — isinya hanya
 * peran, bukan token. Nilai di luar daftar peran yang dikenal diabaikan
 * supaya cookie yang diutak-atik tidak bisa menyetir tujuan tombol.
 */
function readRoleHint(): UserRole | null {
  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SESSION_HINT_COOKIE}=`))
    ?.slice(SESSION_HINT_COOKIE.length + 1);

  if (!raw) return null;
  const role = decodeURIComponent(raw) as UserRole;
  return KNOWN_ROLES.includes(role) ? role : null;
}

/**
 * Cookie tidak memancarkan event perubahan, jadi tidak ada yang perlu
 * dilanggan — nilainya cuma dibaca sekali saat komponen terpasang.
 */
const subscribeToNothing = () => () => {};

/** `undefined` menandai "cookie belum terbaca" (render server & hidrasi). */
const readRoleHintOnServer = (): UserRole | null | undefined => undefined;

/**
 * Tombol sesi di header publik: "Masuk" untuk tamu, "Dashboard" untuk yang
 * sudah punya sesi — mengarah ke `/admin` bila rolenya pengelola, memakai
 * pemetaan yang sama dengan redirect setelah login (lib/auth-routes.ts).
 *
 * Sengaja **tidak** memanggil `/api/auth/refresh`: backend merotasi refresh
 * token setiap kali dipakai, jadi menembaknya di tiap pemuatan halaman
 * publik membuat dua tab yang dibuka bersamaan saling mencabut token dan
 * salah satunya keluar sendiri. Cookie petunjuk sudah cukup karena tombol
 * ini hanya perlu tahu "ada sesi atau tidak, perannya apa" — bukan token
 * yang sah. Sesi sungguhannya tetap dipulihkan guard layout saat tujuannya
 * dibuka.
 *
 * Cookie hanya bisa dibaca setelah komponen terpasang di browser, jadi
 * render pertama (juga hasil SSR) menampilkan ruang kosong seukuran tombol
 * — mencegah "Masuk" berkedip sesaat bagi pengguna yang sudah masuk.
 */
export function AuthNavButton({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const hintedRole = useSyncExternalStore(
    subscribeToNothing,
    readRoleHint,
    readRoleHintOnServer
  );

  if (hintedRole === undefined && !user) {
    return <div aria-hidden className={cn("h-9 w-24", className)} />;
  }

  // Sesi di memory (mis. baru saja login di tab ini) lebih tepercaya
  // daripada cookie petunjuk yang bisa tertinggal basi.
  const role = user?.role ?? hintedRole ?? null;

  return (
    <Button
      asChild
      size="sm"
      className={cn("h-9 gap-1.5 rounded-full px-4 shadow-soft", className)}
    >
      <Link href={role ? landingPathForRole(role) : "/masuk"} onClick={onNavigate}>
        {role ? <LayoutDashboard className="size-4" /> : <LogIn className="size-4" />}
        {role ? "Dashboard" : "Masuk"}
      </Link>
    </Button>
  );
}
