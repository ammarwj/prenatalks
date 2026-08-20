"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { RiskLevelBadge } from "@/components/dashboard/risk-level-badge";
import { RiskScoreTrendChart } from "@/components/dashboard/risk-score-trend-chart";
import { ListSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { RiskAssessmentSummary } from "@/lib/types";

export default function RiwayatCekRisikoPage() {
  const [history, setHistory] = useState<RiskAssessmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<RiskAssessmentSummary[]>("/assessments");
      setHistory(data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal memuat riwayat cek risiko.");
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Riwayat Cek Risiko
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semua hasil cek risiko yang pernah Anda selesaikan.
          </p>
        </div>
        <Link
          href="/dashboard/cek-risiko"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-[#EC4899]"
        >
          <Plus className="size-4" />
          Cek Risiko Baru
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {history === null ? (
        <ListSkeleton rows={4} framed={false} withAvatar label="Memuat riwayat" />
      ) : history.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada hasil cek risiko. Mulai yang pertama lewat tombol di atas.
          </CardContent>
        </Card>
      ) : (
        <>
          {history.length > 1 && (
            <Card className="rounded-3xl border border-border shadow-soft">
              <CardContent className="px-6 py-6">
                <h2 className="mb-4 font-display text-base font-bold text-foreground">
                  Tren Skor
                </h2>
                <RiskScoreTrendChart history={history} />
              </CardContent>
            </Card>
          )}

          <Card className="rounded-3xl border border-border shadow-soft">
            <CardContent className="divide-y divide-border px-6 py-2">
              {history.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/cek-risiko/hasil/${item.id}`}
                  className="flex items-center justify-between gap-4 py-4 text-sm hover:bg-muted/60"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {new Date(item.completed_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-muted-foreground">Skor: {item.total_score}</p>
                  </div>
                  <RiskLevelBadge level={item.risk_level} />
                </Link>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
