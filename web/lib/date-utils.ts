/**
 * Util tanggal bersama. Semua tanggal di aplikasi disimpan sebagai string ISO
 * `YYYY-MM-DD` (tanpa zona waktu) karena itulah format yang dipakai API Laravel.
 */

/** Semua nilai tanggal di app berbentuk `YYYY-MM-DD`. */
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse `YYYY-MM-DD` sebagai tengah malam waktu LOKAL.
 *
 * `new Date("2026-08-13")` diperlakukan sebagai UTC oleh spesifikasi, sehingga di
 * WIB akan tampil sebagai 13 Agustus pukul 07:00 — dan di zona barat Greenwich
 * malah mundur ke tanggal 12. Sufiks `T00:00:00` memaksa interpretasi lokal.
 */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value || !ISO_DATE_PATTERN.test(value)) return null;

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Serialisasi Date ke `YYYY-MM-DD` memakai komponen waktu LOKAL.
 *
 * Sengaja tidak memakai `toISOString().slice(0, 10)` — itu mengonversi ke UTC
 * lebih dulu dan menggeser tanggal satu hari untuk sebagian besar jam di WIB.
 */
export function toIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** "13 Agustus 2026" — format tanggal panjang standar di seluruh aplikasi. */
export function formatLongDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function today(): Date {
  return startOfDay(new Date());
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

/**
 * Tambah bulan dengan pembatasan hari (clamping): 31 Maret − 1 bulan = 28/29
 * Februari, bukan 2/3 Maret seperti perilaku overflow bawaan `setMonth`.
 */
export function addMonths(date: Date, amount: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + amount;
  const lastDay = new Date(year, month + 1, 0).getDate();

  return new Date(year, month, Math.min(date.getDate(), lastDay));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Selisih hari kalender penuh antara dua tanggal (b − a), mengabaikan jam. */
export function differenceInDays(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

function buildMonthNames(): string[] {
  const formatter = new Intl.DateTimeFormat("id-ID", { month: "long" });

  return Array.from({ length: 12 }, (_, month) =>
    formatter.format(new Date(2024, month, 1))
  );
}

function buildWeekdayNames(style: "short" | "long"): string[] {
  const formatter = new Intl.DateTimeFormat("id-ID", { weekday: style });

  // 2024-01-07 adalah hari Minggu — minggu di kalender dimulai dari Minggu.
  return Array.from({ length: 7 }, (_, offset) =>
    formatter.format(new Date(2024, 0, 7 + offset))
  );
}

/** "Januari" … "Desember" */
export const MONTH_NAMES_ID = buildMonthNames();

/** "Min", "Sen", … "Sab" — indeks 0 = Minggu, sejajar dengan `Date.getDay()`. */
export const WEEKDAY_SHORT_ID = buildWeekdayNames("short");

/** "Minggu", "Senin", … "Sabtu" — indeks sejajar dengan `WEEKDAY_SHORT_ID`. */
export const WEEKDAY_LONG_ID = buildWeekdayNames("long");

/**
 * Estimasi usia kehamilan dari HPHT untuk pratinjau di UI, mis. "12 minggu 3 hari".
 *
 * Perhitungan resmi (HPL, trimester, persentase) tetap milik backend
 * `PregnancyCalculator.php`; ini hanya umpan balik cepat sebelum submit.
 */
export function gestationalAgeText(lmpIsoDate: string): string | null {
  const lmp = parseIsoDate(lmpIsoDate);
  if (!lmp) return null;

  const totalDays = differenceInDays(lmp, new Date());
  if (totalDays < 0) return null;

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  if (weeks === 0) return `${days} hari`;
  if (days === 0) return `${weeks} minggu`;

  return `${weeks} minggu ${days} hari`;
}
