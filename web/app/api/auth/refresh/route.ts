import { NextRequest, NextResponse } from "next/server";

import { API_URL, REFRESH_COOKIE_MAX_AGE, REFRESH_COOKIE_NAME, refreshCookieOptions } from "@/lib/server/auth-cookie";

/**
 * Baca refresh_token dari cookie httpOnly (bukan dari body — client tidak
 * pernah menyentuhnya), tukar dengan access_token baru, lalu rotasi cookie
 * dengan refresh_token baru (PRD §6.1 langkah 4).
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ success: false, message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  let laravelResponse: Response;
  try {
    laravelResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Tidak dapat terhubung ke server." },
      { status: 502 }
    );
  }

  const payload = await laravelResponse.json().catch(() => null);

  if (!laravelResponse.ok || !payload?.success) {
    const response = NextResponse.json(
      payload ?? { success: false, message: `Permintaan gagal (${laravelResponse.status})` },
      { status: laravelResponse.status }
    );
    // refresh_token yang ditolak backend (invalid/revoked/kedaluwarsa) tidak berguna lagi.
    response.cookies.delete(REFRESH_COOKIE_NAME);
    return response;
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
