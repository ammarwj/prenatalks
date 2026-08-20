import {
  BookOpen,
  CheckSquare,
  ClipboardList,
  FileClock,
  HelpCircle,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  ListChecks,
  Newspaper,
  Quote,
  ScrollText,
  Settings,
  UsersRound,
  Video,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Disaring di sidebar; backend tetap menegakkannya lewat `role:super_admin`. */
  superAdminOnly?: boolean;
};

export type AdminNavGroup = {
  /** `null` untuk kelompok pembuka yang tidak perlu judul. */
  title: string | null;
  items: AdminNavItem[];
};

/**
 * Navigasi panel admin — mengikuti sitemap PRD §8 (`/admin/*`), dikelompokkan
 * supaya sepuluh modul tetap terbaca. Satu-satunya sumber kebenaran daftar
 * menu admin; sebelumnya hidup sebagai deretan pill di dalam `app/admin/page.tsx`.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: null,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Konten",
    items: [
      { href: "/admin/artikel", label: "Artikel", icon: Newspaper },
      { href: "/admin/video", label: "Video", icon: Video },
      { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
    ],
  },
  {
    title: "Program",
    items: [
      { href: "/admin/kuesioner", label: "Checklist Risiko", icon: ListChecks, superAdminOnly: true },
      { href: "/admin/checklist", label: "Checklist Persiapan", icon: CheckSquare },
      { href: "/admin/form", label: "Form & Survei", icon: ClipboardList },
    ],
  },
  {
    title: "Situs",
    items: [
      { href: "/admin/tentang", label: "Halaman Tentang", icon: Info },
      { href: "/admin/testimoni", label: "Testimoni", icon: Quote },
      { href: "/admin/brand", label: "Identitas Situs", icon: ImageIcon, superAdminOnly: true },
      { href: "/admin/panduan", label: "Panduan Penggunaan", icon: BookOpen, superAdminOnly: true },
      { href: "/admin/legal", label: "Halaman Legal", icon: ScrollText, superAdminOnly: true },
      { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/pengguna", label: "Pengguna", icon: UsersRound, superAdminOnly: true },
      { href: "/admin/audit-log", label: "Audit Log", icon: FileClock, superAdminOnly: true },
    ],
  },
];

/**
 * `/admin` hanya cocok persis; menu lain ikut menyala untuk rute anaknya
 * (mis. `/admin/artikel/baru`, `/admin/form/12/respon`) supaya pengguna tahu
 * posisinya saat berada di halaman form/detail.
 */
export function isAdminNavItemActive(href: string, pathname: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
