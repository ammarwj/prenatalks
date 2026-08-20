/**
 * Nomor telepon di `settings` ditulis apa adanya oleh super admin
 * ("0812-3456-7890"), sedangkan `tel:` dan wa.me menuntut bentuk yang berbeda.
 * Kedua pengubahnya ditaruh di sini supaya footer dan halaman `/kontak` tidak
 * bisa berbeda pendapat soal nomor yang sama.
 */

/** `tel:` menerima spasi/tanda hubung, tapi membuangnya lebih aman di ponsel. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * wa.me hanya menerima digit dalam format internasional tanpa `+`. Nomor
 * Indonesia hampir selalu ditulis dengan awalan `0`, jadi awalan itu ditukar
 * ke kode negara 62; nomor yang sudah diawali `62` atau `+62` dibiarkan.
 *
 * Mengembalikan `null` untuk masukan yang tidak menyisakan digit sama sekali,
 * supaya pemanggilnya menyembunyikan tombol alih-alih menautkan ke wa.me kosong.
 */
export function whatsappHref(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  }

  return digits ? `https://wa.me/${digits}` : null;
}
