import { create } from "zustand";

import type { User } from "@/lib/types";

/**
 * Access token disimpan di memory saja, tidak pernah di localStorage
 * (PRD §6.1). Sesi bertahan melewati refresh halaman lewat cookie httpOnly
 * `pt_refresh`: `useSessionRehydrate()` menukarnya jadi access_token baru
 * saat layout terproteksi dimuat (lihat lib/hooks/use-session-rehydrate.ts).
 *
 * `isHydrating` menandai bahwa penukaran itu masih berjalan — guard di
 * layout wajib menunggunya selesai sebelum memutuskan redirect, kalau tidak
 * setiap refresh akan terlempar ke /masuk padahal sesinya masih sah.
 */
type AuthState = {
  accessToken: string | null;
  user: User | null;
  isHydrating: boolean;
  setSession: (accessToken: string, user: User) => void;
  clearSession: () => void;
  finishHydration: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isHydrating: true,
  setSession: (accessToken, user) => set({ accessToken, user, isHydrating: false }),
  clearSession: () => set({ accessToken: null, user: null }),
  finishHydration: () => set({ isHydrating: false }),
}));
