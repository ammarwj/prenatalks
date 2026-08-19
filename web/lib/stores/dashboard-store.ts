import { create } from "zustand";

import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { DashboardOverview } from "@/lib/types";

/**
 * Cache satu hasil `GET /dashboard` untuk seluruh area ibu hamil.
 *
 * Alasannya kerangka navigasi: chip usia kehamilan di sidebar dan top bar
 * butuh data ini di **setiap** halaman, dan proyek ini tidak memakai
 * react-query. Tanpa cache, tiap halaman harus menembak `/dashboard` sendiri
 * hanya demi satu baris teks.
 *
 * Beranda ikut membaca dari sini alih-alih fetch sendiri, jadi jumlah
 * request-nya tidak bertambah — hanya berpindah pemiliknya ke layout.
 *
 * Halaman yang mengubah data kehamilan (`PregnancyForm`, simpan hasil
 * kalkulator sebagai HPHT) wajib memanggil `refresh()` supaya chip tidak
 * memajang angka basi.
 */
type DashboardState = {
  overview: DashboardOverview | null;
  error: string | null;
  /** `true` selama permintaan pertama; permintaan berikutnya tidak menyalakannya. */
  isLoading: boolean;
  /** Muat sekali saja — aman dipanggil dari efek yang berjalan tiap mount. */
  load: () => Promise<void>;
  /** Paksa muat ulang setelah mutasi. */
  refresh: () => Promise<void>;
  clear: () => void;
};

/**
 * Disimpan di module scope, bukan di state, supaya dua komponen yang
 * memanggil `load()` pada mount yang sama (sidebar dan halaman) berbagi satu
 * request — pola yang sama dipakai `use-session-rehydrate.ts`.
 */
let inFlight: Promise<void> | null = null;

async function fetchOverview(set: (partial: Partial<DashboardState>) => void): Promise<void> {
  try {
    set({ overview: await apiGet<DashboardOverview>("/dashboard"), error: null });
  } catch (err) {
    set({
      error: err instanceof ApiRequestError ? err.message : "Gagal memuat ringkasan.",
    });
  } finally {
    set({ isLoading: false });
  }
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  overview: null,
  error: null,
  isLoading: true,

  load: () => {
    if (get().overview !== null || inFlight) {
      return inFlight ?? Promise.resolve();
    }

    inFlight = fetchOverview(set).finally(() => {
      inFlight = null;
    });

    return inFlight;
  },

  refresh: () => {
    inFlight = fetchOverview(set).finally(() => {
      inFlight = null;
    });

    return inFlight;
  },

  clear: () => {
    inFlight = null;
    set({ overview: null, error: null, isLoading: true });
  },
}));
