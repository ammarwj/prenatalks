"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiPut, ApiRequestError } from "@/lib/api-client";
import {
  aboutSettingsSchema,
  toAboutFormValues,
  toAboutPayload,
  type AboutSettingsInput,
} from "@/lib/validations/about";
import type { AboutSettings, BrandColors } from "@/lib/types";

/**
 * Form seksi 1–5 halaman Tentang — PRD §9 F-16 kriteria terima
 * ("disimpan di `settings` sehingga dapat disunting admin tanpa deploy ulang").
 */
export function AboutSettingsForm({
  initialData,
  brandColors,
}: {
  initialData: AboutSettings;
  brandColors: BrandColors;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AboutSettingsInput>({
    resolver: zodResolver(aboutSettingsSchema),
    defaultValues: toAboutFormValues(initialData),
  });

  const philosophy = useFieldArray({ control, name: "namePhilosophy" });
  const milestones = useFieldArray({ control, name: "milestones" });

  async function onSubmit(values: AboutSettingsInput) {
    setServerError(null);
    try {
      const saved = await apiPut<AboutSettings>("/admin/settings", toAboutPayload(values));
      toast.success("Isi halaman Tentang disimpan");
      reset(toAboutFormValues(saved));
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan, coba lagi."
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

      <section className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">1 · Filosofi Nama</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tiga kartu pemecahan nama: <em>pre · natal · talks</em>. Jumlahnya dikunci tiga karena
            memang itu pemecahan namanya.
          </p>
        </div>

        {philosophy.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <FormField
              label={`Bagian ${index + 1}`}
              htmlFor={`term-${index}`}
              error={errors.namePhilosophy?.[index]?.term?.message}
            >
              <Input
                id={`term-${index}`}
                className="h-11 rounded-xl"
                {...register(`namePhilosophy.${index}.term`)}
              />
            </FormField>
            <FormField
              label="Makna"
              htmlFor={`meaning-${index}`}
              error={errors.namePhilosophy?.[index]?.meaning?.message}
            >
              <Textarea id={`meaning-${index}`} rows={2} {...register(`namePhilosophy.${index}.meaning`)} />
            </FormField>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">2 · Sejarah</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pengantar singkat, lalu tonggak yang ditampilkan sebagai timeline.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={milestones.fields.length >= 12}
            onClick={() => milestones.append({ year: "", title: "", description: "" })}
          >
            <Plus className="size-4" />
            Tambah tonggak
          </Button>
        </div>

        <FormField label="Pengantar sejarah" htmlFor="historyIntro" error={errors.historyIntro?.message}>
          <Textarea id="historyIntro" rows={3} {...register("historyIntro")} />
        </FormField>

        {errors.milestones?.message && (
          <p className="text-xs font-medium text-danger">{errors.milestones.message}</p>
        )}

        {milestones.fields.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Belum ada tonggak. Timeline disembunyikan di halaman publik selama daftarnya kosong.
          </p>
        ) : (
          <ul className="space-y-3">
            {milestones.fields.map((field, index) => (
              <li key={field.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 gap-3 sm:grid-cols-[8rem_1fr]">
                    <FormField
                      label="Tahun"
                      htmlFor={`year-${index}`}
                      error={errors.milestones?.[index]?.year?.message}
                    >
                      <Input
                        id={`year-${index}`}
                        className="h-11 rounded-xl"
                        {...register(`milestones.${index}.year`)}
                      />
                    </FormField>
                    <FormField
                      label="Judul"
                      htmlFor={`milestone-title-${index}`}
                      error={errors.milestones?.[index]?.title?.message}
                    >
                      <Input
                        id={`milestone-title-${index}`}
                        className="h-11 rounded-xl"
                        {...register(`milestones.${index}.title`)}
                      />
                    </FormField>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-7"
                    onClick={() => milestones.remove(index)}
                    aria-label={`Hapus tonggak ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-3">
                  <FormField
                    label="Keterangan"
                    htmlFor={`milestone-desc-${index}`}
                    error={errors.milestones?.[index]?.description?.message}
                    hint="Opsional."
                  >
                    <Textarea
                      id={`milestone-desc-${index}`}
                      rows={2}
                      {...register(`milestones.${index}.description`)}
                    />
                  </FormField>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <h3 className="font-display text-lg font-bold text-foreground">3 · Komitmen</h3>

        <FormField
          label="Judul komitmen"
          htmlFor="commitmentHeading"
          error={errors.commitmentHeading?.message}
        >
          <Input id="commitmentHeading" className="h-11 rounded-xl" {...register("commitmentHeading")} />
        </FormField>

        <FormField
          label="Penjelasan"
          htmlFor="commitmentBody"
          error={errors.commitmentBody?.message}
          hint="Jelaskan pendekatan berbasis bukti ilmiah."
        >
          <Textarea id="commitmentBody" rows={5} {...register("commitmentBody")} />
        </FormField>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <h3 className="font-display text-lg font-bold text-foreground">4 · Filosofi Logo</h3>
        <FormField
          label="Makna logo"
          htmlFor="logoPhilosophy"
          error={errors.logoPhilosophy?.message}
          hint="Siluet ibu, ayah, anak, dan makna lingkarannya."
        >
          <Textarea id="logoPhilosophy" rows={5} {...register("logoPhilosophy")} />
        </FormField>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">5 · Filosofi Warna</h3>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            Kode warnanya dikunci karena melekat pada logo dan tidak boleh diubah. Yang bisa Anda
            sunting di sini hanya teks maknanya.
          </p>
        </div>

        {(
          [
            ["Ungu", brandColors.purple, "colorPurpleMeaning"],
            ["Hijau Toska", brandColors.teal, "colorTealMeaning"],
          ] as const
        ).map(([label, hex, fieldName]) => (
          <div key={fieldName} className="flex items-start gap-3">
            <span
              className="mt-7 size-11 shrink-0 rounded-xl border border-border"
              style={{ backgroundColor: hex }}
              aria-hidden="true"
            />
            <div className="flex-1">
              <FormField
                label={`Makna ${label} (${hex})`}
                htmlFor={fieldName}
                error={errors[fieldName]?.message}
              >
                <Textarea id={fieldName} rows={3} {...register(fieldName)} />
              </FormField>
            </div>
          </div>
        ))}
      </section>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan Isi Halaman"}
        </Button>
      </div>
    </form>
  );
}
