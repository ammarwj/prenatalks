import { ApiRequestError } from "@/lib/api-error";
import type { User } from "@/lib/types";

type SessionResponse = {
  access_token: string;
  user: User;
};

async function callAuthRoute<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError("Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.", 0);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new ApiRequestError(
      payload?.message ?? `Permintaan gagal (${response.status})`,
      response.status,
      payload?.errors
    );
  }

  return payload.data as T;
}

/** Route Handler yang menyimpan refresh_token ke cookie httpOnly (PRD §6.1). */
export const authLogin = (email: string, password: string) =>
  callAuthRoute<SessionResponse>("/api/auth/login", { email, password });

/** Dipanggil oleh interceptor di api-client.ts saat access_token kedaluwarsa (401). */
export const authRefresh = () => callAuthRoute<SessionResponse>("/api/auth/refresh");

export async function authLogout(accessToken: string | null): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  } catch {
    // sesi lokal tetap dibersihkan oleh pemanggil walau ini gagal
  }
}
