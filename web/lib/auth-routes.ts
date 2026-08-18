import type { UserRole } from "@/lib/types";

/**
 * Role pengelola — cocok dengan Gate `access-admin` di backend
 * (api/app/Providers/AppServiceProvider.php) dan middleware
 * `role:admin,super_admin` yang menjaga prefix rute `admin`.
 */
export const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];

export const isAdminRole = (role?: UserRole): boolean => !!role && ADMIN_ROLES.includes(role);

/** Peran F-15 — penerima izin akses hasil cek risiko (PRD §9 F-15). */
export const isHealthWorkerRole = (role?: UserRole): boolean => role === "health_worker";

/**
 * Titik masuk sesuai role: pengelola ke panel admin, tenaga kesehatan ke
 * area akses pasien (F-15), sisanya ke area pengguna (PRD §8). Dipakai halaman /masuk maupun guard kedua layout
 * supaya keduanya tidak bisa berbeda pendapat soal "rumah" tiap role.
 */
export const landingPathForRole = (role?: UserRole): string => {
  if (isAdminRole(role)) {
    return "/admin";
  }
  if (isHealthWorkerRole(role)) {
    return "/nakes";
  }
  return "/dashboard";
};
