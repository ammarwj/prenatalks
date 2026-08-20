/**
 * Tujuan tiap kartu pada grid fitur landing page (PRD §9 F-01 no. 4).
 *
 * Hidup di berkas sendiri karena dipakai **dua** komponen: `FeatureGrid` untuk
 * kartunya, dan `Hero` untuk dua tombol CTA-nya. Kalau hero menyalin href-nya
 * sendiri, keduanya akan menyimpang diam-diam — kegagalan yang sudah pernah
 * terjadi pada `nav-items.ts`, yang sempat berisi anchor ke seksi landing yang
 * tidak pernah dibuat.
 *
 * Empat dari enam nama kartu (Belajar, Siap Lahiran, Tanda Bahaya, Tanya Bidan)
 * tidak punya halaman sendiri, jadi tujuannya adalah rute terdekat yang
 * benar-benar ada. `tanda-bahaya` memakai filter kategori yang sudah didukung
 * `/artikel` (slug `tanda-bahaya` berasal dari `CategorySeeder`).
 */
export const FEATURE_LINKS = {
  belajar: "/video",
  "cek-risiko": "/dashboard/cek-risiko",
  "siap-lahiran": "/dashboard/persiapan",
  "tanda-bahaya": "/artikel?category=tanda-bahaya",
  "tanya-bidan": "/komunitas",
  artikel: "/artikel",
} as const;

export type FeatureId = keyof typeof FEATURE_LINKS;
