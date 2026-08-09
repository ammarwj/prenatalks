"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { CalendarHeart, Info } from "lucide-react";

import { CircularProgress } from "@/components/shared/circular-progress";
import { FormField } from "@/components/shared/form-field";
import { HphtDatePicker } from "@/components/shared/hpht-date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatLongDate } from "@/lib/date-utils";
import { apiPost, apiPut, ApiRequestError } from "@/lib/api-client";
import type { CalculatorResult, Pregnancy } from "@/lib/types";
import { calculatorSchema, type CalculatorInput } from "@/lib/validations/calculator";

const TRIMESTER_STYLE: Record<1 | 2 | 3, { ring: string; badge: string }> = {
  1: { ring: "var(--brand-teal)", badge: "border-transparent bg-brand-teal-soft text-brand-teal-text" },
  2: { ring: "var(--brand-purple)", badge: "border-transparent bg-brand-purple-soft text-brand-purple" },
  3: { ring: "var(--primary)", badge: "border-transparent bg-primary-soft text-primary-text" },
};

export function CalculatorForm({
  mode,
  initialLmpDate,
  activePregnancyId,
  onSaved,
}: {
  mode: "guest" | "dashboard";
  initialLmpDate?: string;
  activePregnancyId?: number;
  onSaved?: (pregnancy: Pregnancy) => void;
}) {
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [calculatedLmpDate, setCalculatedLmpDate] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CalculatorInput>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: { lmp_date: initialLmpDate ?? "" },
  });

  async function onSubmit(values: CalculatorInput) {
    setServerError(null);
    setSaveState("idle");
    try {
      const data = await apiPost<CalculatorResult>("/calculator", values);
      setResult(data);
      setCalculatedLmpDate(values.lmp_date);
    } catch (err) {
      setResult(null);
      setServerError(
        err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi."
      );
    }
  }

  async function handleSave(lmpDate: string) {
    setSaveState("saving");
    setServerError(null);
    try {
      const pregnancy = activePregnancyId
        ? await apiPut<Pregnancy>(`/pregnancies/${activePregnancyId}`, { lmp_date: lmpDate })
        : await apiPost<Pregnancy>("/pregnancies", { lmp_date: lmpDate });
      setSaveState("saved");
      onSaved?.(pregnancy);
    } catch (err) {
      setSaveState("idle");
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan, coba lagi."
      );
    }
  }

  const trimesterStyle = result ? TRIMESTER_STYLE[result.trimester] : null;

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border shadow-soft">
        <CardContent className="px-6 py-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <FormField label="Hari Pertama Haid Terakhir (HPHT)" htmlFor="lmp_date" error={errors.lmp_date?.message}>
                <Controller
                  name="lmp_date"
                  control={control}
                  render={({ field }) => (
                    <HphtDatePicker
                      id="lmp_date"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-invalid={!!errors.lmp_date}
                    />
                  )}
                />
              </FormField>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-full bg-primary text-white shadow-soft hover:bg-[#EC4899] sm:px-8"
            >
              <CalendarHeart className="size-4" />
              {isSubmitting ? "Menghitung..." : "Hitung"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Alert className="rounded-xl border-border bg-muted/60">
        <Info className="size-4 text-muted-foreground" />
        <AlertDescription className="text-muted-foreground">
          Perhitungan ini berbasis siklus haid 28 hari. Bila siklus Anda tidak teratur, hasil USG
          lebih akurat untuk menentukan usia kehamilan dan HPL.
        </AlertDescription>
      </Alert>

      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {result && trimesterStyle && (
        <Card className="rounded-3xl border border-border shadow-soft">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-around">
            <CircularProgress percent={result.progress_percent} color={trimesterStyle.ring} size={168} strokeWidth={14}>
              <div className="flex flex-col items-center">
                <span className="font-display text-3xl font-extrabold text-foreground">
                  {result.progress_percent}%
                </span>
                <span className="text-xs text-muted-foreground">kehamilan</span>
              </div>
            </CircularProgress>

            <div className="w-full max-w-sm space-y-3 text-center sm:text-left">
              <Badge className={trimesterStyle.badge}>Trimester {result.trimester}</Badge>
              <p className="font-display text-xl font-bold text-foreground">
                {result.gestational_age.text}
              </p>
              <dl className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-4 sm:justify-start">
                  <dt className="text-muted-foreground">HPL (Naegele)</dt>
                  <dd className="font-semibold text-foreground">{formatLongDate(result.edd_date)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-start">
                  <dt className="text-muted-foreground">Sisa hari</dt>
                  <dd className="font-semibold text-foreground">
                    {result.days_remaining > 0 ? `${result.days_remaining} hari lagi` : "Sudah lewat HPL"}
                  </dd>
                </div>
              </dl>

              {mode === "guest" ? (
                <p className="pt-2 text-sm text-muted-foreground">
                  Hasil ini tidak disimpan.{" "}
                  <Link href="/masuk" className="font-semibold text-brand-purple hover:underline">
                    Masuk
                  </Link>{" "}
                  untuk menyimpan dan mempersonalisasi konten sesuai kehamilan Anda.
                </p>
              ) : (
                <div className="flex flex-col items-center gap-2 pt-2 sm:items-start">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saveState === "saving" || !calculatedLmpDate}
                    onClick={() => calculatedLmpDate && handleSave(calculatedLmpDate)}
                    className="rounded-full"
                  >
                    {saveState === "saving" ? "Menyimpan..." : "Simpan sebagai HPHT saya"}
                  </Button>
                  {saveState === "saved" && (
                    <span className="text-xs font-medium text-brand-teal-text">
                      Tersimpan ke profil kehamilan.
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
