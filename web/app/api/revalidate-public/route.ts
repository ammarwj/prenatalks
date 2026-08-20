import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { API_URL } from "@/lib/server/auth-cookie";
import {
  PUBLIC_SETTINGS_TAG,
  STATS_TAG,
  TESTIMONIALS_TAG,
  type PublicCacheTag,
} from "@/lib/public-cache";

/**
 * Buang cache halaman publik setelah datanya disunting dari panel admin.
 *
 * Tanpa ini, halaman publik menahan hasil `GET /settings`, `/testimonials`,
 * dan `/stats` selama masa ISR-nya (5 menit sampai 1 jam) — admin yang baru
 * menyimpan lalu menekan "Lihat halaman publik" akan melihat data lama dan
 * menyimpulkan simpannya gagal. Jebakan itu yang dihapus di sini.
 *
 * Diverifikasi ke backend, bukan sekadar "ada header Authorization":
 * membatalkan cache adalah operasi yang memaksa render ulang seluruh situs,
 * jadi endpoint terbuka akan jadi cara murah membebani server. Peran minimum
 * per tag dibuat sejajar dengan siapa yang boleh mengubah datanya di Laravel —
 * `Setting::SUPER_ADMIN_GROUPS` untuk pengaturan & statistik, `role:admin,
 * super_admin` untuk testimoni.
 */
const ALLOWED_ROLES: Record<PublicCacheTag, string[]> = {
  [PUBLIC_SETTINGS_TAG]: ["super_admin"],
  [STATS_TAG]: ["super_admin"],
  [TESTIMONIALS_TAG]: ["admin", "super_admin"],
};

function isKnownTag(tag: unknown): tag is PublicCacheTag {
  return typeof tag === "string" && tag in ALLOWED_ROLES;
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json({ success: false, message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tags: PublicCacheTag[] = Array.isArray(body?.tags) ? body.tags.filter(isKnownTag) : [];

  if (tags.length === 0) {
    return NextResponse.json(
      { success: false, message: "Tidak ada tag cache yang dikenal." },
      { status: 422 }
    );
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
  const role = payload?.data?.user?.role;

  if (!tags.every((tag) => ALLOWED_ROLES[tag].includes(role))) {
    return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
  }

  // Next.js 16 mewajibkan argumen kedua: lebar jendela "sajikan yang basi
  // sambil menyegarkan di latar". Di sini nol — inti fiturnya justru supaya
  // admin melihat hasil suntingannya sendiri seketika, bukan versi lama sekali
  // lagi. `updateTag` yang memang untuk read-your-own-writes hanya boleh
  // dipanggil dari Server Action, bukan Route Handler seperti ini.
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }

  return NextResponse.json({ success: true, message: "Cache diperbarui", data: null });
}
