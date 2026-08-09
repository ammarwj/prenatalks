"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { CalendarHeart, Info, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { CalculatorResultView } from "@/components/calculator/calculator-result";
import { FormField } from "@/components/shared/form-field";
import { HphtDatePicker } from "@/components/shared/hpht-date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiPost, apiPut, ApiRequestError } from "@/lib/api-client";
import { formatLongDate } from "@/lib/date-utils";
import type { CalculatorResult, Pregnancy } from "@/lib/types";
import { calculatorSchema, type CalculatorInput } from "@/lib/validations/calculator";
import { isWithinHphtRange } from "@/lib/validations/pregnancy";

/** Query param yang membuat hasil bisa dibagikan & bertahan saat refresh. */
const HPHT_PARAM = "hpht";

export function CalculatorForm({
  mode,
  initialLmpDate,
  activePregnancyId,
  activePregnancyEddOverridden,
  activePregnancyEddDate,
  onSaved,
}: {
  mode: "guest" | "dashboard";
  initialLmpDate?: string;
  activePregnancyId?: number;
  /** HPL kehamilan aktif ditimpa manual — menyimpan HPHT baru akan meresetnya. */
  activePregnancyEddOverridden?: boolean;
  activePregnancyEddDate?: string | null;
  onSaved?: (pregnancy: Pregnancy) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [calculatedLmpDate, setCalculatedLmpDate] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const sharedLmpDate = searchParams.get(HPHT_PARAM);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CalculatorInput>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: { lmp_date: sharedLmpDate ?? initialLmpDate ?? "" },
  });

  /**
   * URL adalah satu-satunya sumber kebenaran: submit hanya menulis `?hpht=`,
   * dan efek di bawah yang menghitung. Dengan begitu tautan yang dibagikan,
   * tombol back, dan refresh semuanya melewati jalur yang sama persis.
   */
  function onSubmit(values: CalculatorInput) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(HPHT_PARAM, values.lmp_date);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Divalidasi lebih dulu supaya query param sembarangan tidak memicu 422.
  const pendingLmpDate = sharedLmpDate && isWithinHphtRange(sharedLmpDate) ? sharedLmpDate : null;

  useEffect(() => {
    if (!pendingLmpDate) return;

    let cancelled = false;

    void (async () => {
      try {
        const data = await apiPost<CalculatorResult>("/calculator", { lmp_date: pendingLmpDate });
        if (cancelled) return;

        setResult(data);
        setCalculatedLmpDate(pendingLmpDate);
        setServerError(null);
        setSaveState("idle");
      } catch (err) {
        if (cancelled) return;

        setResult(null);
        setCalculatedLmpDate(null);
        setServerError(
          err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingLmpDate]);

  // Diturunkan, bukan disimpan: hasil belum menyusul HPHT yang diminta URL.
  const isCalculating = Boolean(pendingLmpDate) && calculatedLmpDate !== pendingLmpDate && !serverError;

  async function handleSave(lmpDate: string) {
    setSaveState("saving");
    setServerError(null);
    try {
      const pregnancy = activePregnancyId
        ? await apiPut<Pregnancy>(`/pregnancies/${activePregnancyId}`, { lmp_date: lmpDate })
        : await apiPost<Pregnancy>("/pregnancies", { lmp_date: lmpDate });
      setSaveState("saved");
      toast.success("Tersimpan ke profil kehamilan Anda.");
      onSaved?.(pregnancy);
    } catch (err) {
      setSaveState("idle");
      setServerError(err instanceof ApiRequestError ? err.message : "Gagal menyimpan, coba lagi.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border shadow-soft">
        <CardContent className="px-6 py-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <FormField
                label="Hari Pertama Haid Terakhir (HPHT)"
                htmlFor="lmp_date"
                error={errors.lmp_date?.message}
              >
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
              disabled={isCalculating}
              className="h-11 rounded-full bg-primary text-white shadow-soft hover:bg-[#EC4899] sm:px-8"
            >
              <CalendarHeart className="size-4" />
              {isCalculating ? "Menghitung..." : "Hitung"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Alert className="rounded-xl border-border bg-muted/60">
        <Info className="size-4 text-muted-foreground" />
        <AlertDescription className="text-muted-foreground">
          Perhitungan ini berbasis siklus haid 28 hari. Bila siklus Anda tidak teratur, hasil USG
          lebih akurat — Anda dapat mencatat HPL dari USG di{" "}
          <Link href="/dashboard/kehamilan" className="font-semibold text-brand-purple hover:underline">
            Data Kehamilan
          </Link>
          .
        </AlertDescription>
      </Alert>

      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {result && calculatedLmpDate && (
        <CalculatorResultView
          result={result}
          lmpDate={calculatedLmpDate}
          footer={
            mode === "guest" ? (
              <div className="space-y-3 text-center sm:text-left">
                <p className="text-sm text-muted-foreground">
                  Hasil ini tidak disimpan. Buat akun gratis untuk menyimpan HPHT, mendapat artikel
                  sesuai trimester, checklist persiapan melahirkan, dan cek risiko kehamilan.
                </p>
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Link
                    href="/daftar"
                    className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#EC4899]"
                  >
                    Daftar gratis
                  </Link>
                  <Link
                    href="/masuk"
                    className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    Sudah punya akun
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 sm:items-start">
                {/* Dua hal sekaligus: endpoint /calculator bersifat publik & stateless
                    sehingga selalu memakai rumus Naegele (HPL di atas bisa berbeda dari
                    dashboard), dan menyimpan HPHT membuat withComputedEdd menghapus
                    override — keduanya harus disampaikan sebelum pengguna menekan simpan. */}
                {activePregnancyEddOverridden && (
                  <Alert className="rounded-xl border-warning/30 bg-feature-amber-soft">
                    <TriangleAlert className="size-4 text-warning" />
                    <AlertDescription className="text-xs text-foreground">
                      Dashboard Anda memakai HPL
                      {activePregnancyEddDate ? ` ${formatLongDate(activePregnancyEddDate.slice(0, 10))}` : ""}{" "}
                      yang disesuaikan manual dari USG, sedangkan kalkulator ini selalu menampilkan
                      hasil rumus Naegele. Menyimpan HPHT baru akan menghapus penyesuaian itu — Anda
                      bisa mengisinya kembali di{" "}
                      <Link
                        href="/dashboard/kehamilan"
                        className="font-semibold text-brand-purple hover:underline"
                      >
                        Data Kehamilan
                      </Link>
                      .
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={saveState === "saving"}
                  onClick={() => handleSave(calculatedLmpDate)}
                  className="rounded-full"
                >
                  {saveState === "saving" ? "Menyimpan..." : "Simpan sebagai HPHT saya"}
                </Button>
              </div>
            )
          }
        />
      )}
    </div>
  );
}
