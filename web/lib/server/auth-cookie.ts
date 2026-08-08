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

/**
 * Petunjuk sesi yang boleh dibaca JavaScript — isinya hanya peran pengguna
 * (`user` | `health_worker` | `admin` | `super_admin`), **bukan token**.
 * Dipakai header publik untuk memutuskan menampilkan "Masuk" atau
 * "Dashboard" tanpa memanggil `/api/auth/refresh`.
 *
 * Kenapa tidak menukar refresh token saja seperti layout terproteksi:
 * backend merotasi refresh token setiap kali dipakai (`AuthController::refresh`
 * mencabut yang lama), jadi memanggilnya di tiap pemuatan halaman publik
 * membuat dua tab yang dibuka bersamaan saling mencabut token — satu tab
 * kebagian 401 dan pengguna keluar sendiri tanpa sebab yang jelas.
 *
 * Aman diekspos: tanpa access token maupun refresh token, cookie ini tidak
 * memberi akses apa pun. Paling jauh ia bisa basi (refresh token sudah
 * kedaluwarsa tapi petunjuknya belum) — dampaknya cuma tombol "Dashboard"
 * yang saat diklik berujung di /masuk, dan guard layout yang meluruskannya.
 */
export const SESSION_HINT_COOKIE_NAME = "pt_role";

export const sessionHintCookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
