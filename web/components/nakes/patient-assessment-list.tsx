"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, PenLine, TriangleAlert } from "lucide-react";

import { RiskLevelBadge } from "@/components/dashboard/risk-level-badge";
import { Button } from "@/components/ui/button";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { RiskAssessment, RiskAssessmentSummary } from "@/lib/types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Riwayat hasil cek risiko satu pasien — PRD §9 F-15.
 *
 * Rincian tiap hasil (faktor penyumbang skor) diambil per baris saat dibuka,
 * bukan sekaligus bersama daftar: hanya pembukaan rincian inilah yang
 * dicatat sebagai akses ke satu hasil tertentu di `audit_logs`, jadi
 * memuatnya di muka akan menulis jejak untuk hasil yang tidak pernah dilihat.
 */
export function PatientAssessmentList({
  consentId,
  assessments,
  onWriteNote,
}: {
  consentId: number;
  assessments: RiskAssessmentSummary[];
  onWriteNote: (assessmentId: number) => void;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, RiskAssessment>>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [errorId, setErrorId] = useState<{ id: number; message: string } | null>(null);

  async function toggle(id: number) {
    if (openId === id) {
      setOpenId(null);
      return;
    }

    setOpenId(id);
    if (details[id]) {
      return;
    }

    setLoadingId(id);
    setErrorId(null);
    try {
      const detail = await apiGet<RiskAssessment>(
        `/health-worker/patients/${consentId}/assessments/${id}`
      );
      setDetails((current) => ({ ...current, [id]: detail }));
    } catch (err) {
      setErrorId({
        id,
        message: err instanceof ApiRequestError ? err.message : "Gagal memuat rincian hasil.",
      });
    } finally {
      setLoadingId(null);
    }
  }

  if (assessments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Pasien ini belum pernah menyelesaikan cek risiko.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {assessments.map((assessment) => {
        const detail = details[assessment.id];
        const isOpen = openId === assessment.id;

        return (
          <li key={assessment.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <RiskLevelBadge level={assessment.risk_level} />
                  <span className="text-sm font-semibold text-foreground">
                    Skor {assessment.total_score}
                  </span>
                  {assessment.has_danger_sign && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
                      <TriangleAlert className="size-3.5" />
                      Tanda bahaya
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Diselesaikan {formatDate(assessment.completed_at)}
                </p>
              </div>

              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onWriteNote(assessment.id)}
                >
                  <PenLine className="size-4" />
                  Tulis catatan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full"
                  onClick={() => toggle(assessment.id)}
                >
                  {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  Rincian
                </Button>
              </div>
            </div>

            {isOpen && (
              <div className="mt-3 rounded-2xl bg-muted/50 px-4 py-3">
                {loadingId === assessment.id ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Memuat rincian...
                  </div>
                ) : errorId?.id === assessment.id ? (
                  <p className="text-sm font-medium text-danger">{errorId.message}</p>
                ) : detail ? (
                  <div className="space-y-3">
                    {detail.risk_level?.recommendation && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          Rekomendasi yang ditampilkan ke pasien
                        </p>
                        <p className="mt-0.5 text-sm text-foreground">
                          {detail.risk_level.recommendation}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">
                        Faktor penyumbang skor
                      </p>
                      {detail.contributing_factors.length === 0 ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Tidak ada jawaban yang menambah skor.
                        </p>
                      ) : (
                        <ul className="mt-1 divide-y divide-border">
                          {detail.contributing_factors.map((factor, index) => (
                            <li
                              key={index}
                              className="flex items-start justify-between gap-4 py-2 text-sm"
                            >
                              <div>
                                <p className="font-medium text-foreground">
                                  {factor.question_text}
                                </p>
                                <p className="text-muted-foreground">{factor.answer_label}</p>
                              </div>
                              <span className="shrink-0 font-semibold text-foreground">
                                +{factor.score}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Kuesioner versi {detail.questionnaire_version}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
