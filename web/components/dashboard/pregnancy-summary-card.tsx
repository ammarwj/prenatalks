import Link from "next/link";
import { Baby } from "lucide-react";

import { DueDateSummary, GestationalRing } from "@/components/shared/gestational-result";
import type { DashboardPregnancy } from "@/lib/types";

/**
 * Kartu utama dashboard: usia kehamilan & HPL (PRD §9 F-13).
 *
 * Cincin dan baris HPL berasal dari components/shared/gestational-result.tsx
 * supaya seragam dengan kartu hasil kalkulator.
 */
export function PregnancySummaryCard({ pregnancy }: { pregnancy: DashboardPregnancy | null }) {
  if (!pregnancy) {
    return (
      <section className="rounded-3xl border border-dashed border-border bg-white p-6 text-center shadow-soft sm:p-8">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-purple-soft text-brand-purple">
          <Baby className="size-6" />
        </span>
        <h2 className="mt-4 font-display text-lg font-bold text-foreground">
          Yuk, lengkapi data kehamilan Anda
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Isi tanggal HPHT (hari pertama haid terakhir) supaya kami bisa menghitung usia kehamilan,
          HPL, dan menyesuaikan rekomendasi artikel dengan trimester Anda.
        </p>
        <Link
          href="/dashboard/kehamilan"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#EC4899]"
        >
          Isi Data Kehamilan
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-primary-soft p-6 sm:flex-row sm:p-8">
      <GestationalRing
        trimester={pregnancy.trimester}
        progressPercent={pregnancy.progress_percent}
        weeks={pregnancy.gestational_age.weeks}
        display="weeks"
        size={140}
        strokeWidth={11}
      />

      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold text-muted-foreground">Usia Kehamilan</p>
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          {pregnancy.gestational_age.text}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trimester {pregnancy.trimester} · {pregnancy.progress_percent}% menuju HPL
        </p>

        <DueDateSummary
          eddDate={pregnancy.edd_date}
          daysRemaining={pregnancy.days_remaining}
          daysPastDue={pregnancy.days_past_due}
          eddOverridden={pregnancy.edd_overridden}
          className="mt-4 rounded-2xl bg-white px-4 py-3 shadow-soft"
        />
      </div>
    </section>
  );
}
