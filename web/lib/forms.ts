import type { DashboardPendingForm } from "@/lib/types";

/**
 * Tampilan form & survei yang dipakai bersama oleh kartu ringkasan di
 * beranda (`components/dashboard/pending-forms-card.tsx`) dan halaman
 * `/dashboard/form`. Keduanya harus menyebut hal yang sama dengan kata yang
 * sama — "Survei" di satu tempat dan "Kuesioner" di tempat lain membuat
 * pengguna mengira itu dua benda berbeda.
 */

/** "12 Desember" — tenggat sengaja tanpa tahun; semuanya jatuh tahun ini. */
export function formatFormDeadline(value: string | null): string | null {
  if (!value) return null;

  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long" });
}

export function formTypeLabel(type: DashboardPendingForm["type"]): string {
  return type === "survey" ? "Survei" : "Formulir";
}

/** Baris keterangan di bawah judul: "Survei · ditutup 12 Desember". */
export function formMetaText(form: DashboardPendingForm): string {
  const deadline = formatFormDeadline(form.closes_at);

  return deadline ? `${formTypeLabel(form.type)} · ditutup ${deadline}` : formTypeLabel(form.type);
}
