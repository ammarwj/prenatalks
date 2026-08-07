"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Download, History, Loader2, Share2 } from "lucide-react";

import { RiskDangerAlert } from "@/components/dashboard/risk-danger-alert";
import { RiskLevelBadge } from "@/components/dashboard/risk-level-badge";
import { RiskDisclaimer } from "@/components/shared/risk-disclaimer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiDownload, apiGet, ApiRequestError } from "@/lib/api-client";
import type { RiskAssessment } from "@/lib/types";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HasilCekRisikoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const assessmentId = params.id;

  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<RiskAssessment>(`/assessments/${assessmentId}`);
      if (data.status !== "completed") {
        router.replace(`/dashboard/cek-risiko/isi/${assessmentId}`);
        return;
      }
      setAssessment(data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal memuat hasil cek risiko.");
    }
  }, [assessmentId, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDownloadPdf() {
    setDownloading(true);
    setError(null);
    try {
      await apiDownload(`/assessments/${assessmentId}/pdf`, `hasil-cek-risiko-${assessmentId}.pdf`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal mengunduh PDF.");
    } finally {
      setDownloading(false);
    }
  }

  function handleShareToBidan() {
    if (!assessment) return;
    const lines = [
      "Hasil Cek Risiko Kehamilan (PrenaTalks)",
      `Tingkat: ${assessment.risk_level?.name ?? "Belum diklasifikasikan"}`,
      `Skor: ${assessment.total_score ?? "-"}`,
      assessment.has_danger_sign ? "Ada tanda bahaya yang perlu segera diperiksa." : "",
      "Ini bukan diagnosis medis — mohon bantu tinjau hasil ini.",
    ].filter(Boolean);
    const url = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-xl">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Memuat hasil...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Hasil Cek Risiko
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(assessment.completed_at)}
          </p>
        </div>
        <Link
          href="/dashboard/cek-risiko/riwayat"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
        >
          <History className="size-4" />
          Riwayat
        </Link>
      </div>

      <RiskDisclaimer />

      {assessment.has_danger_sign && <RiskDangerAlert />}

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardContent className="space-y-5 px-6 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <RiskLevelBadge level={assessment.risk_level} />
            <div>
              <p className="text-3xl font-extrabold text-foreground">{assessment.total_score}</p>
              <p className="text-xs text-muted-foreground">Total skor</p>
            </div>
          </div>

          {assessment.risk_level?.recommendation && (
            <div className="rounded-2xl border border-brand-teal-soft bg-brand-teal-soft px-4 py-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-teal-text">
                Rekomendasi
              </p>
              <p className="mt-1 text-sm text-brand-teal-text">
                {assessment.risk_level.recommendation}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="h-11 flex-1 gap-1.5 rounded-full bg-primary text-white shadow-soft hover:bg-[#EC4899]"
            >
              <Download className="size-4" />
              {downloading ? "Mengunduh..." : "Unduh PDF Hasil"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleShareToBidan}
              className="h-11 flex-1 gap-1.5 rounded-full"
            >
              <Share2 className="size-4" />
              Bagikan ke Bidan
            </Button>
          </div>
        </CardContent>
      </Card>

      {assessment.contributing_factors.length > 0 && (
        <Card className="rounded-3xl border border-border shadow-soft">
          <CardContent className="space-y-3 px-6 py-6">
            <h2 className="font-display text-base font-bold text-foreground">
              Faktor Penyumbang Skor
            </h2>
            <ul className="divide-y divide-border">
              {assessment.contributing_factors.map((factor, i) => (
                <li key={i} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{factor.question_text}</p>
                    <p className="text-muted-foreground">{factor.answer_label}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-foreground">+{factor.score}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <RiskDisclaimer />
    </div>
  );
}
