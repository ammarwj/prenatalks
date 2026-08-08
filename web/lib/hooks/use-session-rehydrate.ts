"use client";

import { useEffect } from "react";

import { authRefresh } from "@/lib/auth";
import { useAuthStore } from "@/lib/stores/auth-store";

/**
 * Satu percobaan pemulihan per pemuatan halaman. Disimpan di module scope
 * (bukan state/ref) supaya dua layout yang sama-sama memanggil hook ini, atau
 * mount ganda React StrictMode di dev, tetap berbagi satu request.
 */
let attempt: Promise<void> | null = null;

async function rehydrate(): Promise<void> {
  const { setSession, clearSession, finishHydration } = useAuthStore.getState();
  try {
    const session = await authRefresh();
    setSession(session.access_token, session.user);
  } catch {
    // 401 di sini artinya cookie pt_refresh tidak ada / sudah dicabut —
    // bukan error yang perlu ditampilkan, cukup dianggap belum masuk.
    clearSession();
  } finally {
    finishHydration();
  }
}

/**
 * Tukar cookie httpOnly `pt_refresh` dengan access_token baru saat layout
 * terproteksi dimuat (PRD §6.1 langkah 4), supaya refresh halaman di
 * `/dashboard/*` atau `/admin/*` tidak mengeluarkan pengguna dari sesinya.
 *
 * Sengaja dipanggil dari layout terproteksi saja, bukan dari root layout,
 * supaya halaman publik tidak ikut menembak `/api/auth/refresh`.
 *
 * Mengembalikan `isHydrating` — guard pemanggil harus menunda keputusan
 * redirect selama nilainya masih `true`.
 */
export function useSessionRehydrate(): { isHydrating: boolean } {
  const isHydrating = useAuthStore((state) => state.isHydrating);

  useEffect(() => {
    if (useAuthStore.getState().accessToken) {
      useAuthStore.getState().finishHydration();
      return;
    }
    attempt ??= rehydrate();
  }, []);

  return { isHydrating };
}
