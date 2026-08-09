"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Save } from "lucide-react";

import { FormField } from "@/components/shared/form-field";
import { HphtDatePicker } from "@/components/shared/hpht-date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPost, apiPut, ApiRequestError } from "@/lib/api-client";
import { addDays, formatLongDate, naegeleEdd, parseIsoDate, toIsoDate, today } from "@/lib/date-utils";
import type { Pregnancy } from "@/lib/types";
import {
  BLOOD_TYPE_OPTIONS,
  MEDICAL_HISTORY_OPTIONS,
  pregnancySchema,
  toPregnancyPayload,
  type PregnancyInput,
} from "@/lib/validations/pregnancy";

const inputClass = "h-11 rounded-xl";

function toFormValues(pregnancy?: Pregnancy): Partial<PregnancyInput> {
  if (!pregnancy) return { medical_history: [] };

  const toStr = (v: number | null) => (v == null ? undefined : String(v));

  return {
    lmp_date: pregnancy.lmp_date.slice(0, 10),
    // Hanya prefill saat benar-benar ditimpa manual — HPL hasil hitung otomatis
    // tidak boleh muncul di field ini, nanti tersimpan sebagai override palsu.
    edd_date: pregnancy.edd_overridden ? (pregnancy.edd_date?.slice(0, 10) ?? undefined) : undefined,
    gravida: toStr(pregnancy.gravida),
    para: toStr(pregnancy.para),
    abortus: toStr(pregnancy.abortus),
    height_cm: toStr(pregnancy.height_cm),
    weight_prepregnancy_kg: toStr(pregnancy.weight_prepregnancy_kg),
    weight_current_kg: toStr(pregnancy.weight_current_kg),
    blood_type: pregnancy.blood_type ?? undefined,
    medical_history: pregnancy.medical_history ?? [],
    facility_name: pregnancy.facility_name ?? undefined,
    facility_contact: pregnancy.facility_contact ?? undefined,
  };
}

export function PregnancyForm({
  pregnancy,
  onSaved,
}: {
  pregnancy?: Pregnancy;
  onSaved: (pregnancy: Pregnancy) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isEditing = !!pregnancy;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PregnancyInput>({
    resolver: zodResolver(pregnancySchema),
    defaultValues: toFormValues(pregnancy),
  });

  const lmpDate = useWatch({ control, name: "lmp_date" });
  const eddDate = useWatch({ control, name: "edd_date" });
  const automaticEdd = lmpDate ? naegeleEdd(lmpDate) : null;

  async function onSubmit(values: PregnancyInput) {
    setServerError(null);
    setSaved(false);
    try {
      const payload = toPregnancyPayload(values);
      const result = isEditing
        ? await apiPut<Pregnancy>(`/pregnancies/${pregnancy.id}`, payload)
        : await apiPost<Pregnancy>("/pregnancies", payload);
      setSaved(true);
      onSaved(result);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      {saved && !serverError && (
        <Alert className="rounded-xl border-brand-teal-soft bg-brand-teal-soft">
          <AlertDescription className="text-brand-teal-text">
            Data kehamilan tersimpan.
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Hari Pertama Haid Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <FormField label="HPHT" htmlFor="lmp_date" error={errors.lmp_date?.message}>
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
          <p className="mt-2 text-xs text-muted-foreground">
            HPL dan usia kehamilan dihitung otomatis dari tanggal ini di seluruh dashboard.
          </p>

          {/* HPL manual dari USG — PRD F-03 "HPL (otomatis, dapat ditimpa manual)".
              Mengosongkannya mengembalikan perhitungan Naegele di backend. */}
          <div className="mt-5 border-t border-border pt-5">
            <FormField
              label="HPL dari USG (opsional)"
              htmlFor="edd_date"
              error={errors.edd_date?.message}
              hint={
                automaticEdd
                  ? `Kosongkan untuk memakai perhitungan otomatis: ${formatLongDate(automaticEdd)}.`
                  : "Isi bila bidan atau dokter memberi HPL berbeda berdasarkan USG."
              }
            >
              <Controller
                name="edd_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="edd_date"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    min={lmpDate ? toIsoDate(addDays(parseIsoDate(lmpDate) ?? today(), 1)) : undefined}
                    placeholder="Pakai perhitungan otomatis"
                    aria-invalid={!!errors.edd_date}
                    className={inputClass}
                  />
                )}
              />
            </FormField>
            {eddDate && (
              <button
                type="button"
                onClick={() => setValue("edd_date", "", { shouldDirty: true, shouldValidate: true })}
                className="mt-2 text-xs font-semibold text-brand-purple hover:underline"
              >
                Kembali ke perhitungan otomatis
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Riwayat Kehamilan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-6 pb-6 sm:grid-cols-3">
          <FormField label="Gravida" htmlFor="gravida" hint="Jumlah kehamilan">
            <Input id="gravida" type="number" min={0} className={inputClass} {...register("gravida")} />
          </FormField>
          <FormField label="Para" htmlFor="para" hint="Jumlah persalinan">
            <Input id="para" type="number" min={0} className={inputClass} {...register("para")} />
          </FormField>
          <FormField label="Abortus" htmlFor="abortus" hint="Jumlah keguguran">
            <Input id="abortus" type="number" min={0} className={inputClass} {...register("abortus")} />
          </FormField>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Data Fisik &amp; Golongan Darah</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-6 pb-6 sm:grid-cols-2">
          <FormField label="Tinggi badan (cm)" htmlFor="height_cm">
            <Input id="height_cm" type="number" step="0.1" className={inputClass} {...register("height_cm")} />
          </FormField>
          <FormField label="Golongan darah" htmlFor="blood_type">
            <Controller
              name="blood_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="blood_type" className={`w-full ${inputClass}`}>
                    <SelectValue placeholder="Pilih golongan darah" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Berat sebelum hamil (kg)" htmlFor="weight_prepregnancy_kg">
            <Input
              id="weight_prepregnancy_kg"
              type="number"
              step="0.1"
              className={inputClass}
              {...register("weight_prepregnancy_kg")}
            />
          </FormField>
          <FormField label="Berat saat ini (kg)" htmlFor="weight_current_kg">
            <Input
              id="weight_current_kg"
              type="number"
              step="0.1"
              className={inputClass}
              {...register("weight_current_kg")}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Riwayat Penyakit</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Controller
            name="medical_history"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {MEDICAL_HISTORY_OPTIONS.map((option) => {
                  const checked = field.value?.includes(option.value) ?? false;

                  return (
                    <label
                      key={option.value}
                      htmlFor={`medical-${option.value}`}
                      className="flex items-center gap-2.5 text-sm text-foreground"
                    >
                      <Checkbox
                        id={`medical-${option.value}`}
                        checked={checked}
                        onCheckedChange={(next) => {
                          const current = field.value ?? [];
                          field.onChange(
                            next === true
                              ? [...current, option.value]
                              : current.filter((v) => v !== option.value)
                          );
                        }}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Fasilitas Kesehatan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-6 pb-6 sm:grid-cols-2">
          <FormField label="Nama faskes" htmlFor="facility_name" hint="Opsional">
            <Input id="facility_name" className={inputClass} {...register("facility_name")} />
          </FormField>
          <FormField label="Kontak faskes" htmlFor="facility_contact" hint="Opsional">
            <Input id="facility_contact" className={inputClass} {...register("facility_contact")} />
          </FormField>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-full bg-primary text-base text-white shadow-soft hover:bg-[#EC4899] sm:w-auto sm:px-8"
      >
        <Save className="size-4" />
        {isSubmitting ? "Menyimpan..." : "Simpan Data Kehamilan"}
      </Button>
    </form>
  );
}
