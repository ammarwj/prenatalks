/**
 * Tag cache untuk `GET /settings` yang dibaca root layout. Dipakai bersama
 * oleh pembacanya (`app/layout.tsx`) dan pembatalnya
 * (`app/api/revalidate-brand/route.ts`) supaya keduanya tidak bisa berbeda
 * pendapat soal ejaan tag — salah ketik di salah satunya akan membuat
 * pembatalan cache diam-diam tidak berefek apa pun.
 */
export const BRAND_CACHE_TAG = "brand-settings";

/**
 * Minta halaman publik memuat ulang aset merek. Dipanggil panel admin
 * setelah unggah/reset berhasil; kegagalannya tidak fatal — cache tetap
 * kedaluwarsa sendiri dalam beberapa menit.
 */
export async function revalidateBrandCache(accessToken: string | null): Promise<void> {
  if (!accessToken) return;

  try {
    await fetch("/api/revalidate-brand", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Sengaja dibiarkan: aset sudah tersimpan, ini hanya mempercepat tampilnya.
  }
}
