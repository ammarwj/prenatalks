"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { AdminStatCards } from "@/components/admin/admin-stat-cards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { AdminStats } from "@/lib/types";

/**
 * Statistik ringkas panel admin — PRD §9 F-14, sitemap §8 (`/admin`).
 * Pintasan ke tiap modul sekarang tinggal di sidebar
 * (`components/admin/admin-nav-items.ts`), jadi halaman ini murni angka.
 */
export default function AdminHomePage() {
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
          Ringkasan angka PrenaTalks. Seluruh modul pengelolaan ada di menu samping.
        </p>
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
