import {
  Baby,
  Calculator,
  CheckSquare,
  ClipboardList,
  HelpCircle,
  History,
  Home,
  Lock,
  MessagesSquare,
  Newspaper,
  ShieldCheck,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * Menuju halaman publik di luar kerangka dashboard. Ditandai panah kecil
   * saat dirender — pengguna berhak tahu kapan ia meninggalkan area ini.
   * Jalan pulangnya ada: `AuthNavButton` di `PublicHeader` menampilkan
   * tombol "Dashboard" selama sesinya masih hidup.
   */
  external?: boolean;
};

export type DashboardNavGroup = {
  /** `null` untuk kelompok pembuka yang tidak perlu judul. */
  title: string | null;
  items: DashboardNavItem[];
};

/**
 * Navigasi area ibu hamil — mengikuti sitemap PRD §8 (`/dashboard/*`).
 * Satu-satunya sumber kebenaran daftar menu; dipakai bersama oleh sidebar
 * (layar lebar & drawer) dan bottom nav.
 *
 * Sebelumnya hanya dua tujuan yang muncul di header (`/dashboard` dan
 * `/dashboard/privasi`); sisanya cuma bisa ditemukan lewat kartu di beranda
 * — yang baru tampil setelah `GET /dashboard` selesai — atau lewat baris
 * pill yang ditulis ulang berbeda-beda di tiap halaman.
 *
 * Judul kelompok memetakan pembagian nyata dari fitur: data tentang
 * kehamilan, pemeriksaan klinis, hal yang perlu disiapkan, bacaan, akun.
 */
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    title: null,
    items: [{ href: "/dashboard", label: "Beranda", icon: Home }],
  },
  {
    title: "Kehamilan",
    items: [
      { href: "/dashboard/kehamilan", label: "Data Kehamilan", icon: Baby },
      { href: "/dashboard/kalkulator", label: "Kalkulator", icon: Calculator },
    ],
  },
  {
    title: "Kesehatan",
    items: [
      { href: "/dashboard/cek-risiko", label: "Cek Risiko", icon: ShieldCheck },
      { href: "/dashboard/cek-risiko/riwayat", label: "Riwayat Cek Risiko", icon: History },
    ],
  },
  {
    title: "Persiapan",
    items: [
      { href: "/dashboard/persiapan", label: "Checklist Melahirkan", icon: CheckSquare },
      { href: "/dashboard/form", label: "Form & Survei", icon: ClipboardList },
    ],
  },
  {
    title: "Belajar",
    items: [
      { href: "/artikel", label: "Artikel", icon: Newspaper, external: true },
      { href: "/video", label: "Video", icon: Video, external: true },
      { href: "/faq", label: "FAQ", icon: HelpCircle, external: true },
      { href: "/komunitas", label: "Komunitas", icon: MessagesSquare, external: true },
    ],
  },
  {
    title: "Akun",
    items: [
      { href: "/dashboard/profil", label: "Profil Saya", icon: UserRound },
      { href: "/dashboard/privasi", label: "Privasi & Akses", icon: Lock },
    ],
  },
];

/** Semua href yang dikenal navigasi, dipakai `activeDashboardNavHref`. */
const ALL_HREFS: string[] = DASHBOARD_NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => item.href)
);

function matches(href: string, pathname: string): boolean {
  // `/dashboard` adalah prefix dari setiap rute lain di area ini, jadi ia
  // hanya boleh cocok persis — kalau tidak, "Beranda" ikut menyala di mana-mana.
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Href yang sedang aktif: **prefix terpanjang yang menang**.
 *
 * Aturan `startsWith` saja tidak cukup di sini seperti halnya di panel admin,
 * karena `/dashboard/cek-risiko` adalah prefix dari
 * `/dashboard/cek-risiko/riwayat` — keduanya akan menyala bersamaan dan
 * pengguna tidak tahu lagi di mana posisinya. Dengan prefix terpanjang:
 *
 * - `/dashboard/cek-risiko/riwayat` → Riwayat Cek Risiko
 * - `/dashboard/cek-risiko/hasil/5` → Cek Risiko (Riwayat tidak cocok)
 */
export function activeDashboardNavHref(pathname: string): string | null {
  let active: string | null = null;

  for (const href of ALL_HREFS) {
    if (matches(href, pathname) && (active === null || href.length > active.length)) {
      active = href;
    }
  }

  return active;
}
