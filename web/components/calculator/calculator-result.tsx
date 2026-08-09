"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Check, Link2, ShieldCheck, ListChecks, Share2 } from "lucide-react";
import { toast } from "sonner";

import { ArticleCard } from "@/components/articles/article-card";
import { DueDateSummary, GestationalRing, trimesterStyle } from "@/components/shared/gestational-result";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";
import { buildAllDayEventIcs, downloadIcs } from "@/lib/calendar-export";
import { formatLongDate } from "@/lib/date-utils";
import type { ArticleSummary, CalculatorResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const NEXT_STEPS = [
  { href: "/dashboard/cek-risiko", label: "Cek risiko kehamilan", Icon: ShieldCheck },
  { href: "/dashboard/persiapan", label: "Checklist persiapan melahirkan", Icon: ListChecks },
];

/** Lini masa tanggal penting — hasil PregnancyCalculator::milestones() di backend. */
function MilestoneTimeline({ result }: { result: CalculatorResult }) {
  const { ring } = trimesterStyle(result.trimester);

  return (
    <ol className="space-y-0">
      {result.milestones.map((milestone, index) => {
        const isLast = index === result.milestones.length - 1;

        return (
          <li key={milestone.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                  milestone.passed ? "border-transparent text-white" : "border-border bg-white"
                )}
                style={milestone.passed ? { backgroundColor: ring } : undefined}
              >
                {milestone.passed && <Check className="size-2.5" strokeWidth={4} />}
              </span>
              {!isLast && <span className="w-0.5 grow bg-border" />}
            </div>

            <div className={cn("flex flex-wrap items-baseline gap-x-2 pb-4", isLast && "pb-0")}>
              <span
                className={cn(
                  "text-sm font-semibold",
                  milestone.passed ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {milestone.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatLongDate(milestone.date)} · {milestone.week} minggu
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ShareActions({ result, lmpDate }: { result: CalculatorResult; lmpDate: string }) {
  function shareUrl(): string {
    const url = new URL("/kalkulator", window.location.origin);
    url.searchParams.set("hpht", lmpDate);

    return url.toString();
  }

  function handleWhatsApp() {
    const lines = [
      "Kalkulator Kehamilan (PrenaTalks)",
      `Usia kehamilan: ${result.gestational_age.text} (Trimester ${result.trimester})`,
      `Perkiraan lahir (HPL): ${formatLongDate(result.edd_date)}`,
      result.days_past_due > 0
        ? `Sudah lewat HPL ${result.days_past_due} hari`
        : `${result.days_remaining} hari lagi menuju HPL`,
      "",
      shareUrl(),
    ];

    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      toast.success("Tautan hasil disalin.");
    } catch {
      toast.error("Tidak bisa menyalin tautan di peramban ini.");
    }
  }

  function handleAddToCalendar() {
    downloadIcs(
      `hpl-${result.edd_date}.ics`,
      buildAllDayEventIcs({
        date: result.edd_date,
        title: "Perkiraan Hari Lahir (HPL)",
        description:
          "Perkiraan tanggal lahir dari kalkulator kehamilan PrenaTalks. Perkiraan ini bukan jadwal pasti — ikuti anjuran bidan atau dokter Anda.",
        uid: `hpl-${result.edd_date}-${lmpDate}@prenatalks.id`,
      })
    );
    toast.success("Berkas kalender diunduh.");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={handleWhatsApp} className="rounded-full">
        <Share2 className="size-4" />
        Bagikan ke WhatsApp
      </Button>
      <Button type="button" variant="outline" onClick={handleCopyLink} className="rounded-full">
        <Link2 className="size-4" />
        Salin tautan
      </Button>
      <Button type="button" variant="outline" onClick={handleAddToCalendar} className="rounded-full">
        <CalendarPlus className="size-4" />
        Tambah HPL ke kalender
      </Button>
    </div>
  );
}

/** Artikel sesuai trimester berjalan — endpoint publik, aman dipanggil tamu. */
function RecommendedArticles({ trimester }: { trimester: number }) {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    apiGet<ArticleSummary[]>(`/articles?trimester=${trimester}&per_page=3`)
      .then((data) => {
        if (!cancelled) setArticles(data.slice(0, 3));
      })
      // Rekomendasi bersifat pelengkap — kegagalannya tidak boleh mengganggu hasil hitung.
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [trimester]);

  if (articles.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-bold text-foreground">
        Bacaan untuk Trimester {trimester}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

export function CalculatorResultView({
  result,
  lmpDate,
  footer,
}: {
  result: CalculatorResult;
  lmpDate: string;
  /** Aksi khusus mode (CTA daftar untuk tamu, tombol simpan untuk dashboard). */
  footer?: React.ReactNode;
}) {
  const { badge } = trimesterStyle(result.trimester);

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border shadow-soft">
        <CardContent className="space-y-6 px-6 py-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
            <GestationalRing
              trimester={result.trimester}
              progressPercent={result.progress_percent}
              weeks={result.gestational_age.weeks}
              display="percent"
            />

            <div className="w-full max-w-sm space-y-3 text-center sm:text-left">
              <Badge className={badge}>Trimester {result.trimester}</Badge>
              <p className="font-display text-xl font-bold text-foreground">
                {result.gestational_age.text}
              </p>
              <DueDateSummary
                eddDate={result.edd_date}
                daysRemaining={result.days_remaining}
                daysPastDue={result.days_past_due}
                eddOverridden={result.edd_overridden}
              />
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="mb-4 font-display text-sm font-bold text-foreground">Tanggal penting</h2>
            <MilestoneTimeline result={result} />
          </div>

          <div className="border-t border-border pt-6">
            <ShareActions result={result} lmpDate={lmpDate} />
          </div>

          {footer && <div className="border-t border-border pt-6">{footer}</div>}
        </CardContent>
      </Card>

      <RecommendedArticles trimester={result.trimester} />

      <div className="flex flex-wrap gap-2">
        {NEXT_STEPS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-primary-soft hover:text-primary-text"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
