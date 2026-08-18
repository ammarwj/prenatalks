"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPost, ApiRequestError } from "@/lib/api-client";
import { healthWorkerNoteSchema } from "@/lib/validations/consent";
import type { HealthWorkerNote, RiskAssessmentSummary } from "@/lib/types";

/** Nilai sentinel: `Select` tidak menerima string kosong sebagai value. */
const GENERAL_NOTE = "general";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Menulis catatan edukasi — PRD §9 F-15.
 *
 * Catatan boleh menunjuk satu hasil cek risiko atau berdiri sendiri. Yang
 * ditulis di sini dibaca pasien apa adanya dan tidak bisa disunting maupun
 * dihapus setelah terkirim — itu konsekuensi yang disengaja: catatan yang
 * sudah dibaca pasien tidak boleh berubah diam-diam di belakangnya.
 */
export function NoteForm({
  consentId,
  assessments,
  selectedAssessmentId,
  onSelectAssessment,
  onCreated,
}: {
  consentId: number;
  assessments: RiskAssessmentSummary[];
  selectedAssessmentId: number | null;
  onSelectAssessment: (assessmentId: number | null) => void;
  onCreated: (note: HealthWorkerNote) => void;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsed = healthWorkerNoteSchema.safeParse({ body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Catatan tidak valid");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const note = await apiPost<HealthWorkerNote>(
        `/health-worker/patients/${consentId}/notes`,
        { body: parsed.data.body, risk_assessment_id: selectedAssessmentId }
      );
      setBody("");
      onSelectAssessment(null);
      onCreated(note);
    } catch (err) {
      // 404 di sini hampir selalu berarti izinnya baru saja dicabut pasien —
      // pesan backend sudah menjelaskan itu, jadi diteruskan apa adanya.
      setError(err instanceof ApiRequestError ? err.message : "Gagal menyimpan catatan, coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      {assessments.length > 0 && (
        <Select
          value={selectedAssessmentId ? String(selectedAssessmentId) : GENERAL_NOTE}
          onValueChange={(value) =>
            onSelectAssessment(value === GENERAL_NOTE ? null : Number(value))
          }
        >
          <SelectTrigger className="h-11 w-full rounded-xl sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GENERAL_NOTE}>Catatan umum (tanpa hasil tertentu)</SelectItem>
            {assessments.map((assessment) => (
              <SelectItem key={assessment.id} value={String(assessment.id)}>
                Hasil {formatDate(assessment.completed_at)} · skor {assessment.total_score}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Textarea
        aria-label="Catatan edukasi"
        placeholder="Tulis penjelasan dan saran yang bisa dibaca langsung oleh pasien..."
        rows={5}
        className="rounded-xl"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      {error && <p className="text-xs font-medium text-danger">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Catatan langsung terlihat oleh pasien dan tidak dapat disunting setelah terkirim.
        </p>
        <Button
          type="submit"
          disabled={isSaving}
          className="gap-1.5 rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {isSaving ? "Mengirim..." : "Kirim catatan"}
        </Button>
      </div>
    </form>
  );
}
