"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";

import { CommunitySettingsForm } from "@/components/admin/community-settings-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { CommunitySettings } from "@/lib/types";

/**
 * Pengaturan situs — PRD §8 (`/admin/pengaturan`).
 *
 * Saat ini hanya memuat pengaturan komunitas (F-12). Pengaturan situs lain
 * dan audit log menyusul di F-14.
 */
export default function PengaturanAdminPage() {
  const [settings, setSettings] = useState<CommunitySettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setSettings(await apiGet<CommunitySettings>("/admin/settings"));
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
            Teks dan tautan halaman komunitas. Perubahan tampil di halaman publik dalam beberapa
            menit — halaman itu di-cache untuk menghemat beban server.
          </p>
        </div>
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
        <CommunitySettingsForm initialData={settings} />
      )}
    </div>
  );
}
