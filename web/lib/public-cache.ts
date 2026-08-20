/**
 * Tag cache untuk data publik yang dibaca Server Component dengan ISR.
 *
 * Dipakai bersama oleh pembacanya (`app/layout.tsx`, `app/page.tsx`,
 * `components/shared/footer.tsx`) dan pembatalnya
 * (`app/api/revalidate-public/route.ts`) supaya keduanya tidak bisa berbeda
 * pendapat soal ejaan tag — salah ketik di salah satunya akan membuat
 * pembatalan cache diam-diam tidak berefek apa pun.
 */

/**
 * `GET /settings`. Satu tag untuk seluruh isinya: fetch-nya memang satu, dan
 * dibaca root layout (aset merek) maupun footer (kontak & sosial media).
 */
export const PUBLIC_SETTINGS_TAG = "public-settings";

/** `GET /testimonials` — testimoni landing page. */
export const TESTIMONIALS_TAG = "testimonials";

/** `GET /stats` — angka landing page, ISR 1 jam sesuai PRD §9 F-01. */
export const STATS_TAG = "stats";

export type PublicCacheTag =
  | typeof PUBLIC_SETTINGS_TAG
  | typeof TESTIMONIALS_TAG
  | typeof STATS_TAG;

/**
 * Minta halaman publik memuat ulang data yang baru saja disunting. Dipanggil
 * panel admin setelah simpan berhasil; kegagalannya tidak fatal — cache tetap
 * kedaluwarsa sendiri (5 menit untuk settings & testimoni, 1 jam untuk stats).
 */
export async function revalidatePublicCache(
  tags: PublicCacheTag[],
  accessToken: string | null
): Promise<void> {
  if (!accessToken || tags.length === 0) return;

  try {
    await fetch("/api/revalidate-public", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags }),
    });
  } catch {
    // Sengaja dibiarkan: perubahannya sudah tersimpan, ini hanya mempercepat
    // tampilnya di halaman publik.
  }
}
