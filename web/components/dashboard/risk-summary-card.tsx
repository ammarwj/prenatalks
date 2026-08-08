import { ShieldAlert, ShieldCheck } from "lucide-react";

import { RiskLevelBadge } from "@/components/dashboard/risk-level-badge";
import { SummaryCard, SummaryEmpty } from "@/components/dashboard/summary-card";
import type { DashboardAssessment } from "@/lib/types";

function formatDateTime(value: string | null): string {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Status risiko terakhir + tanggalnya (PRD §9 F-13). */
export function RiskSummaryCard({ assessment }: { assessment: DashboardAssessment | null }) {
  return (
    <SummaryCard
      title="Status Risiko Terakhir"
      icon={assessment?.has_danger_sign ? ShieldAlert : ShieldCheck}
      accentClassName={
        assessment?.has_danger_sign
          ? "bg-feature-danger-soft text-danger"
          : "bg-brand-teal-soft text-brand-teal-text"
      }
      actionHref={assessment ? `/dashboard/cek-risiko/hasil/${assessment.id}` : "/dashboard/cek-risiko"}
      actionLabel={assessment ? "Lihat hasil lengkap" : "Mulai cek risiko"}
    >
      {assessment ? (
        <div className="space-y-3">
          <RiskLevelBadge level={assessment.risk_level} />
          <p className="text-sm text-muted-foreground">
            Skor <span className="font-bold text-foreground tabular-nums">{assessment.total_score}</span>{" "}
            · dicek {formatDateTime(assessment.completed_at)}
          </p>
          {assessment.has_danger_sign && (
            <p className="rounded-xl bg-feature-danger-soft px-3 py-2 text-sm font-semibold text-danger">
              Ada tanda bahaya yang Anda pilih. Segera hubungi bidan atau fasilitas kesehatan
              terdekat.
            </p>
          )}
        </div>
      ) : (
        <SummaryEmpty>
          Anda belum pernah melakukan cek risiko. Pengisiannya sekitar 3 menit dan hasilnya bisa
          Anda bagikan ke bidan.
        </SummaryEmpty>
      )}
    </SummaryCard>
  );
}
