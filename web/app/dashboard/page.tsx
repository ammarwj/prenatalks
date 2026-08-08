"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, Loader2 } from "lucide-react";

import { ChecklistSummaryCard } from "@/components/dashboard/checklist-summary-card";
import { PendingFormsCard } from "@/components/dashboard/pending-forms-card";
import { PregnancySummaryCard } from "@/components/dashboard/pregnancy-summary-card";
import { RecommendedArticlesCard } from "@/components/dashboard/recommended-articles-card";
import { RiskSummaryCard } from "@/components/dashboard/risk-summary-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { DashboardOverview } from "@/lib/types";

/**
 * Ringkasan dashboard pengguna — PRD §9 F-13, sitemap §8 (`/dashboard`).
 *
 * Kelima kartu datang dari satu `GET /dashboard`, bukan lima permintaan
 * terpisah — lihat alasannya di `DashboardService` sisi backend.
 */
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setOverview(await apiGet<DashboardOverview>("/dashboard"));
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat ringkasan.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            {firstName ? `Halo, ${firstName}` : "Halo"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ini ringkasan kehamilan dan persiapan Anda hari ini.
          </p>
        </div>
        <Link
          href="/dashboard/kalkulator"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
        >
          <Calculator className="size-4" />
          Kalkulator
        </Link>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {overview === null ? (
        !loadError && (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Memuat ringkasan...
          </div>
        )
      ) : (
        <>
          <PregnancySummaryCard pregnancy={overview.pregnancy} />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <RiskSummaryCard assessment={overview.latest_assessment} />
            <ChecklistSummaryCard checklist={overview.checklist} />
            <PendingFormsCard forms={overview.pending_forms} />
          </div>

          <RecommendedArticlesCard
            articles={overview.recommended_articles}
            pregnancy={overview.pregnancy}
          />
        </>
      )}
    </div>
  );
}
