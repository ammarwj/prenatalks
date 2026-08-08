import type { UserRole } from "@/lib/types";

/**
 * Label peran sesuai tabel RBAC PRD §5. Nilai kuncinya persis enum `role`
 * di kolom `users.role`, jadi bisa dipakai langsung sebagai payload.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Ibu Hamil",
  health_worker: "Tenaga Kesehatan",
  admin: "Admin",
  super_admin: "Super Admin",
};

/** Ringkasan hak akses tiap peran — ditampilkan saat admin memilih peran. */
export const ROLE_HINTS: Record<UserRole, string> = {
  user: "Mengisi data kehamilan, cek risiko, checklist, dan form.",
  health_worker: "Melihat hasil assessment pengguna yang memberi persetujuan (F-15).",
  admin: "Mengelola artikel, video, FAQ, form & survei, dan checklist persiapan.",
  super_admin: "Semua hak admin, ditambah kelola pengguna, kuesioner risiko, dan audit log.",
};
