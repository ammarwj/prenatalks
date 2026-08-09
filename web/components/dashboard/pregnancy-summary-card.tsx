import Link from "next/link";
import { Baby, CalendarHeart } from "lucide-react";

import { CircularProgress } from "@/components/shared/circular-progress";
import { formatLongDate } from "@/lib/date-utils";
import type { DashboardPregnancy } from "@/lib/types";

function formatDate(isoDate: string | null): string {
  if (!isoDate) return "—";

  return formatLongDate(isoDate.slice(0, 10));
}

/**
 * Kartu utama dashboard: usia kehamilan & HPL (PRD §9 F-13).
 *
 * Progres melingkar memakai ungu merek — motif lingkaran turunan logo yang
 * memang ditugaskan untuk indikator progres kalkulator kehamilan (PRD §1.3).
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
      <CircularProgress
        percent={pregnancy.progress_percent}
        color="var(--brand-purple)"
        size={140}
        strokeWidth={11}
      >
        <div className="text-center">
          <span className="block font-display text-2xl font-extrabold tabular-nums text-brand-purple">
            {pregnancy.gestational_age.weeks}
          </span>
          <span className="block text-xs font-semibold text-muted-foreground">minggu</span>
        </div>
      </CircularProgress>

      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold text-muted-foreground">Usia Kehamilan</p>
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          {pregnancy.gestational_age.text}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trimester {pregnancy.trimester} · {pregnancy.progress_percent}% menuju HPL
        </p>

        <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl bg-white px-4 py-3 text-sm shadow-soft sm:justify-start">
          <CalendarHeart className="size-4 shrink-0 text-brand-teal-text" />
          <span className="font-semibold text-foreground">HPL {formatDate(pregnancy.edd_date)}</span>
          <span className="text-muted-foreground">
            · {pregnancy.days_remaining} hari lagi
            {pregnancy.edd_overridden && " (disesuaikan manual)"}
          </span>
        </div>
      </div>
    </section>
  );
}
