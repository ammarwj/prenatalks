"use client";

import { useCallback, useEffect, useState } from "react";

import { CalculatorForm } from "@/components/calculator/calculator-form";
import { FormSkeleton } from "@/components/shared/loading-state";
import { RiskDisclaimer } from "@/components/shared/risk-disclaimer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import type { Pregnancy } from "@/lib/types";

export default function DashboardKalkulatorPage() {
  const refreshOverview = useDashboardStore((state) => state.refresh);
  const [activePregnancy, setActivePregnancy] = useState<Pregnancy | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadActivePregnancy = useCallback(async () => {
    setLoadError(null);
    try {
      const pregnancies = await apiGet<Pregnancy[]>("/pregnancies");
      setActivePregnancy(pregnancies.find((p) => p.status === "active") ?? null);
    } catch (err) {
      setLoadError(
        err instanceof ApiRequestError ? err.message : "Gagal memuat data kehamilan."
      );
      setActivePregnancy(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActivePregnancy();
  }, [loadActivePregnancy]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          Kalkulator Kehamilan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hasil dapat disimpan sebagai HPHT pada profil kehamilan Anda.
        </p>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {activePregnancy === undefined ? (
        <FormSkeleton fields={3} />
      ) : (
        <CalculatorForm
          mode="dashboard"
          initialLmpDate={activePregnancy?.lmp_date.slice(0, 10)}
          activePregnancyId={activePregnancy?.id}
          activePregnancyEddOverridden={activePregnancy?.edd_overridden}
          activePregnancyEddDate={activePregnancy?.edd_date}
          onSaved={(pregnancy) => {
            setActivePregnancy(pregnancy);
            // Menyimpan hasil sebagai HPHT mengubah usia kehamilan di
            // seluruh dashboard (PRD §9 F-03) — termasuk chip di navigasi.
            refreshOverview();
          }}
        />
      )}

      <RiskDisclaimer />
    </div>
  );
}
