"use client";

import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Rute manajemen kuesioner (F-05) dibatasi super_admin lewat middleware
 * `role:super_admin` di backend (403 untuk admin biasa). Layout `/admin/*`
 * (app/admin/layout.tsx) sudah meloloskan role admin & super_admin untuk
 * fitur admin lain, jadi guard tambahan ini khusus dipakai halaman-halaman
 * di bawah /admin/kuesioner — tidak mengubah guard layout itu sendiri.
 */
export function useSuperAdminGuard() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";

  return { user, isSuperAdmin };
}

/** Pesan blokir eksplisit — sengaja tidak redirect diam-diam supaya admin biasa paham kenapa ditolak. */
export function SuperAdminRestricted() {
  return (
    <Alert variant="destructive" className="rounded-xl">
      <ShieldAlert className="size-4" />
      <AlertTitle>Akses terbatas untuk Super Admin</AlertTitle>
      <AlertDescription>
        Manajemen kuesioner cek risiko hanya bisa diakses oleh peran Super Admin. Hubungi Super
        Admin bila Anda perlu mengubah kuesioner ini.
      </AlertDescription>
    </Alert>
  );
}
