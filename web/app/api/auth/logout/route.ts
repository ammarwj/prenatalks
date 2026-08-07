import { NextRequest, NextResponse } from "next/server";

import { API_URL, REFRESH_COOKIE_NAME } from "@/lib/server/auth-cookie";

/**
 * Blacklist access_token (Authorization diteruskan dari client) + revoke
 * refresh_token (dari cookie httpOnly), lalu hapus cookie-nya. Cookie tetap
 * dihapus meski Laravel tidak terjangkau — logout lokal harus selalu berhasil.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const authHeader = request.headers.get("authorization");

  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // diabaikan — cookie tetap dihapus di bawah
  }

  const response = NextResponse.json({ success: true, message: "Berhasil keluar", data: null });
  response.cookies.delete(REFRESH_COOKIE_NAME);
  return response;
}
