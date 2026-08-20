"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileClock, Loader2 } from "lucide-react";

import { CommunitySettingsForm } from "@/components/admin/community-settings-form";
import { ContactSettingsForm } from "@/components/admin/contact-settings-form";
import { SocialSettingsForm } from "@/components/admin/social-settings-form";
import { StatsSettingsForm } from "@/components/admin/stats-settings-form";
import { SuperAdminRestricted, useSuperAdminGuard } from "@/components/admin/super-admin-guard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type {
  CommunitySettings,
  ContactSettings,
  SocialSettings,
  StatsSettings,
} from "@/lib/types";

/**
 * Satu panggilan `GET /admin/settings` mengembalikan seluruh kelompok, jadi
 * halaman ini memuat semuanya sekaligus alih-alih satu request per form.
 */
type AllSettings = CommunitySettings & ContactSettings & SocialSettings & StatsSettings;

/**
 * Pengaturan situs — PRD §8 (`/admin/pengaturan`).
 *
 * Komunitas (F-12) terbuka untuk admin konten; kontak, sosial media, dan
 * statistik landing page (F-01) dikunci super_admin. Pembatasan itu ditegakkan
 * backend lewat `Setting::SUPER_ADMIN_GROUPS` — yang di sini hanya menjelaskan
 * alasannya kepada admin biasa alih-alih memunculkan form yang pasti ditolak.
 */
export default function PengaturanAdminPage() {
  const { isSuperAdmin } = useSuperAdminGuard();
  const [settings, setSettings] = useState<AllSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setSettings(await apiGet<AllSettings>("/admin/settings"));
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat pengaturan.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Pengaturan</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Teks & tautan komunitas, kontak dan sosial media di footer, serta keterangan kartu
            statistik landing page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Sitemap PRD §8 menempatkan audit log di halaman pengaturan; isinya
              dipisah ke halaman sendiri (tabel berpaginasi butuh ruang), jadi
              tautan ini yang menjaga jalur navigasinya tetap sesuai. */}
          {isSuperAdmin && (
            <Link
              href="/admin/audit-log"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
            >
              <FileClock className="size-4" />
              Audit Log
            </Link>
          )}
          <Link
            href="/komunitas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <ExternalLink className="size-4" />
            Lihat halaman publik
          </Link>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {settings === null ? (
        !loadError && (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Memuat pengaturan...
          </div>
        )
      ) : (
        <div className="space-y-6">
          <CommunitySettingsForm initialData={settings} />

          {isSuperAdmin ? (
            <>
              <ContactSettingsForm initialData={settings} />
              <SocialSettingsForm initialData={settings} />
              <StatsSettingsForm initialData={settings} />
            </>
          ) : (
            <SuperAdminRestricted description="Kontak, sosial media, dan statistik landing page hanya bisa diubah oleh peran Super Admin — ketiganya adalah identitas resmi situs. Hubungi Super Admin bila perlu diperbarui." />
          )}
        </div>
      )}
    </div>
  );
}
