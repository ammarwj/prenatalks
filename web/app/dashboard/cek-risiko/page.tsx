"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { CardSkeleton } from "@/components/shared/loading-state";
import { RiskDisclaimer } from "@/components/shared/risk-disclaimer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet, apiPost, ApiRequestError } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Questionnaire } from "@/lib/types";

/**
 * Titik masuk F-05: jelaskan kuesioner lalu mulai assessment baru. Setiap
 * kunjungan membuat entri assessment baru (PRD: "pengguna dapat mengulang
 * assessment kapan saja; setiap hasil tersimpan sebagai entri riwayat") —
 * tidak ada mekanisme "lanjutkan yang belum selesai" karena backend belum
 * mengekspos daftar assessment `in_progress` (`GET /assessments` hanya
 * mengembalikan yang `completed`).
 */
export default function CekRisikoPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null | undefined>(undefined);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestionnaire = useCallback(async () => {
    try {
      const data = await apiGet<Questionnaire>("/questionnaires/active");
      setQuestionnaire(data);
    } catch (err) {
      setQuestionnaire(null);
      setError(
        err instanceof ApiRequestError && err.status !== 404
          ? err.message
          : "Belum ada kuesioner cek risiko yang aktif saat ini."
      );
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuestionnaire();
  }, [loadQuestionnaire]);

  const emailVerified = !!user?.email_verified_at;

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const result = await apiPost<{ assessment: { id: number } }>("/assessments");
      router.push(`/dashboard/cek-risiko/isi/${result.assessment.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal memulai cek risiko.");
      setStarting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          Cek Risiko Kehamilan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kuesioner singkat berbasis skor untuk membantu Anda mengenali kondisi yang perlu
          diwaspadai selama kehamilan.
        </p>
      </div>

      <RiskDisclaimer />

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {questionnaire === undefined ? (
        <CardSkeleton lines={3} withIcon withAction className="sm:p-6" />
      ) : questionnaire ? (
        <Card className="rounded-3xl border border-border shadow-soft">
          <CardContent className="space-y-5 px-6 py-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-teal-soft text-brand-teal-text">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  {questionnaire.title}
                </h2>
                {questionnaire.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{questionnaire.description}</p>
                )}
              </div>
            </div>

            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• {questionnaire.questions.length} pertanyaan, dapat diselesaikan dalam ±3 menit</li>
              <li>• Jawaban tersimpan otomatis di setiap langkah</li>
              <li>• Hasil bukan diagnosis — sekadar penilaian mandiri berbasis skor</li>
            </ul>

            {!emailVerified && (
              <Alert className="rounded-xl border-warning/30 bg-feature-amber-soft">
                <AlertDescription className="text-warning">
                  Email Anda belum terverifikasi, jadi hasil cek risiko belum bisa disimpan. Cek
                  tautan verifikasi yang kami kirim ke email Anda terlebih dahulu.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="button"
              onClick={handleStart}
              disabled={starting || !emailVerified}
              className="h-11 w-full rounded-full bg-primary text-base text-white shadow-soft hover:bg-[#EC4899] sm:w-auto sm:px-8"
            >
              {starting ? "Memulai..." : "Mulai Cek Risiko"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
