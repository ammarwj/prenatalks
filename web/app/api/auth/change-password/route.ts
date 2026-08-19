import { NextRequest, NextResponse } from "next/server";

import {
  API_URL,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_COOKIE_NAME,
  SESSION_HINT_COOKIE_NAME,
  refreshCookieOptions,
  sessionHintCookieOptions,
} from "@/lib/server/auth-cookie";

/**
 * Proxy ke POST /auth/change-password Laravel.
 *
 * Harus lewat sini, bukan lewat `apiPost` biasa: backend mencabut **semua**
 * refresh token milik pengguna saat kata sandi diganti — termasuk yang ada
 * di cookie httpOnly perangkat ini — lalu menerbitkan sepasang yang baru.
 * Cookie itu hanya bisa ditulis dari server, jadi kalau permintaannya
 * ditembakkan langsung dari browser, token baru hilang dan pengguna
 * terlempar ke /masuk pada pemuatan halaman berikutnya justru karena ia
 * mengamankan akunnya.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json({ success: false, message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi." },
      { status: 502 }
    );
  }

  const payload = await laravelResponse.json().catch(() => null);

  if (!laravelResponse.ok || !payload?.success) {
    return NextResponse.json(
      payload ?? { success: false, message: `Permintaan gagal (${laravelResponse.status})` },
      { status: laravelResponse.status }
    );
  }

  // refresh_token tidak pernah diteruskan ke client (PRD §6.1 langkah 2).
  const response = NextResponse.json({
    success: true,
    message: payload.message,
    data: {
      access_token: payload.data.access_token,
      user: payload.data.user,
    },
  });

  response.cookies.set(REFRESH_COOKIE_NAME, payload.data.refresh_token, {
    ...refreshCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });

  response.cookies.set(SESSION_HINT_COOKIE_NAME, payload.data.user.role, {
    ...sessionHintCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });

  return response;
}
