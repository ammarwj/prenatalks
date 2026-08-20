"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { toast } from "sonner";

import { NoteForm } from "@/components/nakes/note-form";
import { PatientAssessmentList } from "@/components/nakes/patient-assessment-list";
import { DetailSkeleton } from "@/components/shared/loading-state";
import { RiskDisclaimer } from "@/components/shared/risk-disclaimer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { HealthWorkerPatientDetail } from "@/lib/types";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Halaman satu pasien — PRD §9 F-15, BUSINESS_FLOWS §9.
 *
 * Apa yang tampil di sini adalah seluruh cakupan izin, tidak lebih: usia
 * kehamilan, hasil cek risiko, dan catatan edukasi. Batasnya ditentukan
 * backend (HealthWorkerPatientService), jadi menambah kartu di sini tidak
 * akan memunculkan data baru tanpa keputusan sadar di sisi sana.
 */
export default function PasienPage({ params }: { params: Promise<{ consentId: string }> }) {
  const { consentId } = use(params);
  const [patient, setPatient] = useState<HealthWorkerPatientDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const noteFormRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setPatient(await apiGet<HealthWorkerPatientDetail>(`/health-worker/patients/${consentId}`));
    } catch (err) {
      setLoadError(
        err instanceof ApiRequestError && err.status === 404
          ? "Izin ini sudah tidak berlaku — pasien mencabutnya, masa berlakunya habis, atau tautannya bukan untuk akun Anda."
          : "Gagal memuat data pasien."
      );
    }
  }, [consentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function handleWriteNote(assessmentId: number) {
    setSelectedAssessmentId(assessmentId);
    noteFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <Button asChild type="button" variant="outline" className="gap-1.5 rounded-full">
          <Link href="/nakes">
            <ArrowLeft className="size-4" />
            Kembali ke daftar pasien
          </Link>
        </Button>
      </div>
    );
  }

  if (!patient) {
    return (
      <DetailSkeleton paragraphs={2} label="Memuat data pasien" />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/nakes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Daftar pasien
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-foreground">
          {patient.patient_name ?? "Pasien"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Izin aktif sejak {formatDateTime(patient.granted_at)}
          {patient.expires_at ? ` · berakhir otomatis ${formatDateTime(patient.expires_at)}` : ""}
        </p>
      </div>

      <RiskDisclaimer />

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardContent className="px-6 py-5">
          <h2 className="font-display text-base font-bold text-foreground">Konteks Kehamilan</h2>
          {patient.pregnancy ? (
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Usia kehamilan</dt>
                <dd className="text-sm font-semibold text-foreground">
                  {patient.pregnancy.gestational_age.text}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Trimester</dt>
                <dd className="text-sm font-semibold text-foreground">
                  {patient.pregnancy.trimester}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Perkiraan lahir</dt>
                <dd className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  {new Date(patient.pregnancy.edd_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Pasien belum mengisi data kehamilan aktif.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardContent className="px-6 py-5">
          <h2 className="mb-3 font-display text-base font-bold text-foreground">
            Riwayat Cek Risiko
          </h2>
          <PatientAssessmentList
            consentId={Number(consentId)}
            assessments={patient.assessments}
            onWriteNote={handleWriteNote}
          />
        </CardContent>
      </Card>

      <Card ref={noteFormRef} className="rounded-3xl border border-border shadow-soft">
        <CardContent className="space-y-4 px-6 py-5">
          <h2 className="font-display text-base font-bold text-foreground">Catatan Edukasi</h2>

          <NoteForm
            consentId={Number(consentId)}
            assessments={patient.assessments}
            selectedAssessmentId={selectedAssessmentId}
            onSelectAssessment={setSelectedAssessmentId}
            onCreated={(note) => {
              toast.success("Catatan edukasi terkirim ke pasien.");
              setPatient((current) =>
                current ? { ...current, notes: [note, ...current.notes] } : current
              );
            }}
          />

          {patient.notes.length > 0 && (
            <ul className="space-y-3 border-t border-border pt-4">
              {patient.notes.map((note) => (
                <li key={note.id} className="rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {note.health_worker_name ?? "Tenaga kesehatan"} ·{" "}
                    {formatDateTime(note.created_at)}
                    {note.risk_assessment_id ? " · menanggapi satu hasil cek risiko" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
