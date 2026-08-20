import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { API_URL } from "@/lib/server/auth-cookie";
import { BRAND_CACHE_TAG } from "@/lib/brand-cache";

/**
 * Buang cache halaman publik setelah aset identitas situs diganti.
 *
 * Tanpa ini, root layout menahan hasil `GET /settings` selama `revalidate`
 * (5 menit) — super admin yang baru mengunggah logo lalu menekan "Lihat
 * halaman publik" akan melihat logo lama dan menyimpulkan unggahannya
 * gagal. Jebakan itu yang dihapus di sini.
 *
 * Diverifikasi ke backend, bukan sekadar "ada header Authorization":
 * membatalkan cache adalah operasi yang memaksa render ulang seluruh situs,
 * jadi endpoint terbuka akan jadi cara murah membebani server. Hanya peran
 * yang benar-benar boleh mengganti aset yang diterima di sini — kelompok
 * peran yang sama dengan `role:super_admin` di sisi Laravel.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json({ success: false, message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  let me: Response;
  try {
    me = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Tidak dapat terhubung ke server." },
      { status: 502 }
    );
  }

  if (!me.ok) {
    return NextResponse.json({ success: false, message: "Sesi tidak valid." }, { status: 401 });
  }

  const payload = await me.json().catch(() => null);

  if (payload?.data?.user?.role !== "super_admin") {
    return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
  }

  // Next.js 16 mewajibkan argumen kedua: lebar jendela "sajikan yang basi
  // sambil menyegarkan di latar". Di sini nol — inti fiturnya justru supaya
  // super admin melihat hasil unggahannya sendiri seketika, bukan versi lama
  // sekali lagi. `updateTag` yang memang untuk read-your-own-writes hanya
  // boleh dipanggil dari Server Action, bukan Route Handler seperti ini.
  revalidateTag(BRAND_CACHE_TAG, { expire: 0 });

  return NextResponse.json({ success: true, message: "Cache diperbarui", data: null });
}
