"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Baby, CheckSquare, Loader2, ShieldCheck } from "lucide-react";

import { CalculatorForm } from "@/components/calculator/calculator-form";
import { RiskDisclaimer } from "@/components/shared/risk-disclaimer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { Pregnancy } from "@/lib/types";

const CROSS_LINKS = [
  { href: "/dashboard/kehamilan", label: "Data Kehamilan", Icon: Baby },
  { href: "/dashboard/cek-risiko", label: "Cek Risiko", Icon: ShieldCheck },
  { href: "/dashboard/persiapan", label: "Persiapan Melahirkan", Icon: CheckSquare },
];

export default function DashboardKalkulatorPage() {
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Kalkulator Kehamilan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hasil dapat disimpan sebagai HPHT pada profil kehamilan Anda.
          </p>
        </div>
        {/* shrink-0 supaya grup ini turun utuh ke baris baru saat sempit,
            bukan terjepit sampai pill-nya membungkus satu per satu. */}
        <div className="flex shrink-0 flex-wrap gap-2">
          {CROSS_LINKS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {activePregnancy === undefined ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : (
        <CalculatorForm
          mode="dashboard"
          initialLmpDate={activePregnancy?.lmp_date.slice(0, 10)}
          activePregnancyId={activePregnancy?.id}
          activePregnancyEddOverridden={activePregnancy?.edd_overridden}
          activePregnancyEddDate={activePregnancy?.edd_date}
          onSaved={setActivePregnancy}
        />
      )}

      <RiskDisclaimer />
    </div>
  );
}
