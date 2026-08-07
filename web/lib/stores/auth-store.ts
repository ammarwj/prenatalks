import { create } from "zustand";

import type { User } from "@/lib/types";

/**
 * Access token disimpan di memory saja, tidak pernah di localStorage
 * (PRD §6.1). Berarti sesi hilang saat halaman di-refresh — ini
 * disengaja untuk sekarang; alur "refresh via httpOnly cookie saat
 * memuat halaman" belum dibangun (lihat IMPLEMENTATION_CHECKLIST.md,
 * F-02 · Frontend: Route Handler + interceptor).
 */
type AuthState = {
  accessToken: string | null;
  user: User | null;
  setSession: (accessToken: string, user: User) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: null, user: null }),
}));
