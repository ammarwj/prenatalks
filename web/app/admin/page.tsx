"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  ClipboardList,
  FileClock,
  HelpCircle,
  Info,
  ListChecks,
  Loader2,
  Newspaper,
  Settings,
  UsersRound,
  Video,
} from "lucide-react";

import { AdminStatCards } from "@/components/admin/admin-stat-cards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { AdminStats } from "@/lib/types";

const LINKS = [
  { href: "/admin/artikel", label: "Artikel", icon: Newspaper },
  { href: "/admin/video", label: "Video", icon: Video },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/kuesioner", label: "Checklist Risiko", icon: ListChecks, superAdminOnly: true },
  { href: "/admin/checklist", label: "Checklist Persiapan", icon: CheckSquare },
  { href: "/admin/form", label: "Form & Survei", icon: ClipboardList },
  { href: "/admin/tentang", label: "Halaman Tentang", icon: Info },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
  { href: "/admin/pengguna", label: "Pengguna", icon: UsersRound, superAdminOnly: true },
  { href: "/admin/audit-log", label: "Audit Log", icon: FileClock, superAdminOnly: true },
];

/** Statistik ringkas panel admin — PRD §9 F-14, sitemap §8 (`/admin`). */
export default function AdminHomePage() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setStats(await apiGet<AdminStats>("/admin/dashboard"));
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat statistik.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Panel Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan angka PrenaTalks dan pintasan ke seluruh modul pengelolaan.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LINKS.filter((link) => !link.superAdminOnly || isSuperAdmin).map(
          ({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        )}
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {stats === null
        ? !loadError && (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Memuat statistik...
            </div>
          )
        : <AdminStatCards stats={stats} />}
    </div>
  );
}
