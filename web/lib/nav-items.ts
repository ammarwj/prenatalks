/**
 * Menu publik — mengikuti sitemap PRD §8 (halaman publik tanpa login).
 *
 * Sebelumnya daftar ini berisi anchor seksi landing page (`#belajar`,
 * `#cek-risiko`, …) yang seksinya tidak pernah dibuat: hanya `#beranda` yang
 * benar-benar ada, jadi enam menu sisanya tidak melakukan apa pun saat
 * diklik. Diganti rute sungguhan supaya `/video` dan saudara-saudaranya
 * bisa ditemukan tanpa mengetik URL.
 *
 * Dipakai bersama oleh navbar landing, header halaman publik, dan footer.
 */
export const NAV_ITEMS = [
  { label: "Beranda", href: "/" },
  { label: "Artikel", href: "/artikel" },
  { label: "Video", href: "/video" },
  { label: "FAQ", href: "/faq" },
  { label: "Kalkulator", href: "/kalkulator" },
  { label: "Komunitas", href: "/komunitas" },
  { label: "Tentang", href: "/tentang" },
] as const;

/**
 * `/` hanya cocok persis; menu lain ikut menyala untuk halaman detailnya
 * (`/artikel/[slug]`, `/video/[slug]`) supaya pembaca tahu posisinya.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
