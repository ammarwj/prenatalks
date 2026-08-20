"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { RiskDangerAlert } from "@/components/dashboard/risk-danger-alert";
import {
  RiskQuestionStep,
  type QuestionAnswer,
} from "@/components/dashboard/risk-question-step";
import { QuestionnaireSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiGet, apiPatch, apiPost, ApiRequestError } from "@/lib/api-client";
import type { Question, Questionnaire, RiskAssessment } from "@/lib/types";

function isAnswered(answer: QuestionAnswer | undefined): boolean {
  if (!answer) return false;
  if ("option_id" in answer) return true;
  if ("option_ids" in answer) return answer.option_ids.length > 0;
  return answer.value_number !== undefined;
}

export default function IsiCekRisikoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const assessmentId = params.id;

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({});
  const [hasDangerSign, setHasDangerSign] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [assessment, active] = await Promise.all([
        apiGet<RiskAssessment>(`/assessments/${assessmentId}`),
        apiGet<Questionnaire>("/questionnaires/active"),
      ]);

      if (assessment.status === "completed") {
        router.replace(`/dashboard/cek-risiko/hasil/${assessmentId}`);
        return;
      }
      setHasDangerSign(!!assessment.has_danger_sign);
      setQuestionnaire(active);
    } catch (err) {
      setLoadError(
        err instanceof ApiRequestError ? err.message : "Gagal memuat kuesioner cek risiko."
      );
    }
  }, [assessmentId, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loadError) {
    return (
      <Alert variant="destructive" className="rounded-xl">
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  if (!questionnaire) {
    return (
      <QuestionnaireSkeleton questions={2} label="Memuat kuesioner" />
    );
  }

  const questions = questionnaire.questions;
  const question: Question | undefined = questions[stepIndex];
  const isLastStep = stepIndex === questions.length - 1;
  const currentAnswer = question ? answers[question.id] : undefined;
  const canProceed = !question || !question.is_required || isAnswered(currentAnswer);

  async function persistCurrentAnswer(): Promise<boolean> {
    if (!question || !isAnswered(currentAnswer)) return true;

    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = { question_id: question.id, ...currentAnswer };
      const result = await apiPatch<{ has_danger_sign: boolean }>(
        `/assessments/${assessmentId}/answers`,
        body
      );
      setHasDangerSign(result.has_danger_sign);
      return true;
    } catch (err) {
      setSaveError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan jawaban, coba lagi."
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    const ok = await persistCurrentAnswer();
    if (!ok) return;

    if (isLastStep) {
      await handleSubmit();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  async function handleSubmit() {
    setSaving(true);
    setSaveError(null);
    try {
      await apiPost(`/assessments/${assessmentId}/submit`);
      router.push(`/dashboard/cek-risiko/hasil/${assessmentId}`);
    } catch (err) {
      setSaveError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan hasil cek risiko."
      );
      setSaving(false);
    }
  }

  function handleBack() {
    setSaveError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  if (!question) {
    return (
      <Alert variant="destructive" className="rounded-xl">
        <AlertDescription>Kuesioner ini belum punya pertanyaan.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>
            Pertanyaan {stepIndex + 1} dari {questions.length}
          </span>
          {question.group_label && <span>{question.group_label}</span>}
        </div>
        <Progress
          value={((stepIndex + 1) / questions.length) * 100}
          className="mt-2 h-1.5"
        />
      </div>

      {hasDangerSign && <RiskDangerAlert />}

      <div className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">{question.text}</h2>
          {question.help_text && (
            <p className="mt-1 text-sm text-muted-foreground">{question.help_text}</p>
          )}
          {!question.is_required && (
            <p className="mt-1 text-xs text-muted-foreground">(Opsional)</p>
          )}
        </div>

        <RiskQuestionStep
          question={question}
          answer={currentAnswer}
          onChange={(next) => {
            setAnswers((prev) => ({ ...prev, [question.id]: next }));
          }}
        />
      </div>

      {saveError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          disabled={stepIndex === 0 || saving}
          className="gap-1.5 rounded-full"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || saving}
          className="h-11 gap-1.5 rounded-full bg-primary px-6 text-white shadow-soft hover:bg-[#EC4899]"
        >
          {saving ? "Menyimpan..." : isLastStep ? "Selesai" : "Lanjut"}
          {!saving && <ArrowRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
