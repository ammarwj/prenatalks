/**
 * Konfigurasi cookie refresh_token — dipakai oleh Route Handler
 * app/api/auth/* saja (server-side). Nama cookie mengikuti PRD Lampiran B
 * (`AUTH_COOKIE_NAME`). TTL mengikuti PRD §6.1 (refresh_token 14 hari).
 */
export const REFRESH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "pt_refresh";
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
