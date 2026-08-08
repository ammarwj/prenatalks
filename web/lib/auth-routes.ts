import type { UserRole } from "@/lib/types";

/**
 * Role pengelola — cocok dengan Gate `access-admin` di backend
 * (api/app/Providers/AppServiceProvider.php) dan middleware
 * `role:admin,super_admin` yang menjaga prefix rute `admin`.
 */
export const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];

export const isAdminRole = (role?: UserRole): boolean => !!role && ADMIN_ROLES.includes(role);

/**
 * Titik masuk sesuai role: pengelola ke panel admin, sisanya ke area
 * pengguna (PRD §8). Dipakai halaman /masuk maupun guard kedua layout
 * supaya keduanya tidak bisa berbeda pendapat soal "rumah" tiap role.
 */
export const landingPathForRole = (role?: UserRole): string =>
  isAdminRole(role) ? "/admin" : "/dashboard";
