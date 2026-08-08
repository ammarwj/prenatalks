"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, CheckSquare, Loader2, ShieldCheck } from "lucide-react";

import { PregnancyForm } from "@/components/dashboard/pregnancy-form";
import { PregnancyHistoryList } from "@/components/dashboard/pregnancy-history-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { Pregnancy } from "@/lib/types";

export default function DataKehamilanPage() {
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
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Data Kehamilan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lengkapi data ini agar kalkulator dan cek risiko lebih akurat untuk Anda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/kalkulator"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <Calculator className="size-4" />
            Buka Kalkulator
          </Link>
          <Link
            href="/dashboard/cek-risiko"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <ShieldCheck className="size-4" />
            Cek Risiko
          </Link>
          <Link
            href="/dashboard/persiapan"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <CheckSquare className="size-4" />
            Persiapan Melahirkan
          </Link>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {pregnancies === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
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
