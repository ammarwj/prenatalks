"use client";

import { useCallback, useEffect, useState } from "react";

import { PregnancyForm } from "@/components/dashboard/pregnancy-form";
import { PregnancyHistoryList } from "@/components/dashboard/pregnancy-history-list";
import { FormSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import type { Pregnancy } from "@/lib/types";

export default function DataKehamilanPage() {
  const refreshOverview = useDashboardStore((state) => state.refresh);
  const [pregnancies, setPregnancies] = useState<Pregnancy[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPregnancies = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiGet<Pregnancy[]>("/pregnancies");
      setPregnancies(data);
    } catch (err) {
      setLoadError(
        err instanceof ApiRequestError ? err.message : "Gagal memuat data kehamilan."
      );
      setPregnancies([]);
    }
  }, []);

  useEffect(() => {
    // Fetch saat mount — setState terjadi setelah await, di luar eksekusi
    // sinkron efek ini, bukan pola derived-state yang diincar aturan lint ini.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPregnancies();
  }, [loadPregnancies]);

  function handleSaved(saved: Pregnancy) {
    setPregnancies((prev) => {
      const others = (prev ?? []).filter((p) => p.id !== saved.id);
      return [saved, ...others];
    });

    // HPHT berubah artinya usia kehamilan berubah — chip di kerangka
    // navigasi ikut disegarkan supaya tidak memajang angka yang sudah basi.
    refreshOverview();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Data Kehamilan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lengkapi data ini agar kalkulator dan cek risiko lebih akurat untuk Anda.
        </p>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {pregnancies === null ? (
        <FormSkeleton fields={3} />
      ) : (
        <>
          <PregnancyForm
            pregnancy={pregnancies.find((p) => p.status === "active")}
            onSaved={handleSaved}
          />
          <PregnancyHistoryList
            pregnancies={pregnancies.filter((p) => p.status !== "active")}
          />
        </>
      )}
    </div>
  );
}
