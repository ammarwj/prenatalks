import { NextRequest, NextResponse } from "next/server";

import { API_URL, REFRESH_COOKIE_MAX_AGE, REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/server/auth-cookie";

/**
 * Proxy ke POST /auth/login Laravel. refresh_token TIDAK PERNAH diteruskan
 * ke client — disimpan sebagai cookie httpOnly di sini (PRD §6.1 langkah 2).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  return response;
}
