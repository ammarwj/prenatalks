"use client";

import { Loader2 } from "lucide-react";

import { ChecklistSummaryCard } from "@/components/dashboard/checklist-summary-card";
import { PendingFormsCard } from "@/components/dashboard/pending-forms-card";
import { PregnancySummaryCard } from "@/components/dashboard/pregnancy-summary-card";
import { RecommendedArticlesCard } from "@/components/dashboard/recommended-articles-card";
import { RiskSummaryCard } from "@/components/dashboard/risk-summary-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDashboardStore } from "@/lib/stores/dashboard-store";

/**
 * Ringkasan dashboard pengguna — PRD §9 F-13, sitemap §8 (`/dashboard`).
 *
 * Kelima kartu datang dari satu `GET /dashboard`, bukan lima permintaan
 * terpisah — lihat alasannya di `DashboardService` sisi backend. Permintaan
 * itu sendiri dijalankan `app/dashboard/layout.tsx` dan disimpan di
 * `useDashboardStore`, karena kerangka navigasi juga memakainya untuk chip
 * usia kehamilan; halaman ini cukup membacanya.
 */
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const overview = useDashboardStore((state) => state.overview);
  const loadError = useDashboardStore((state) => state.error);

  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          {firstName ? `Halo, ${firstName}` : "Halo"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ini ringkasan kehamilan dan persiapan Anda hari ini.
        </p>
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
