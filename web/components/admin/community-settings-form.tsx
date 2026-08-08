"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { TelegramIcon, WhatsappIcon } from "@/components/shared/social-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiPut, ApiRequestError } from "@/lib/api-client";
import type { CommunitySettings } from "@/lib/types";
import {
  communitySettingsSchema,
  toCommunitySettingsFormValues,
  toCommunitySettingsPayload,
  type CommunitySettingsInput,
  type CommunitySettingsOutput,
} from "@/lib/validations/settings";

/**
 * Form pengaturan komunitas (PRD §9 F-12) — berlabel per pengaturan, bukan
 * editor key-value mentah, karena penggunanya persona P2 yang bukan orang
 * teknis (PRD §4).
 */
export function CommunitySettingsForm({ initialData }: { initialData: CommunitySettings }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CommunitySettingsInput, unknown, CommunitySettingsOutput>({
    resolver: zodResolver(communitySettingsSchema),
    defaultValues: toCommunitySettingsFormValues(initialData),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "rules" });

  async function onSubmit(values: CommunitySettingsOutput) {
    setServerError(null);
    try {
      const saved = await apiPut<CommunitySettings>(
        "/admin/settings",
        toCommunitySettingsPayload(values)
      );
      toast.success("Pengaturan komunitas disimpan");
      // Reset dengan nilai dari server: tautan yang dinormalisasi backend
      // (mis. ditambahi https://) ikut terlihat di form, dan `isDirty`
      // kembali false sehingga tombol simpan menonaktifkan diri lagi.
      reset(toCommunitySettingsFormValues(saved));
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan pengaturan, coba lagi."
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
          <h2 className="font-display text-lg font-bold text-foreground">Isi Halaman</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tampil di bagian atas halaman <code className="text-xs">/komunitas</code>.
          </p>
        </div>

        <FormField label="Judul komunitas" htmlFor="heading" error={errors.heading?.message}>
          <Input id="heading" className="h-11 rounded-xl" {...register("heading")} />
        </FormField>

        <FormField
          label="Penjelasan komunitas"
          htmlFor="description"
          error={errors.description?.message}
          hint="Jelaskan apa yang pengguna dapatkan bila bergabung."
        >
          <Textarea id="description" rows={5} {...register("description")} />
        </FormField>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Tautan Grup</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kosongkan salah satu bila kanalnya belum ada — tombolnya otomatis disembunyikan di
            halaman publik.
          </p>
        </div>

        <FormField
          label="Tautan grup WhatsApp"
          htmlFor="whatsappUrl"
          error={errors.whatsappUrl?.message}
          hint="Mis. chat.whatsapp.com/XXXX — https:// ditambahkan otomatis."
        >
          <div className="relative">
            <WhatsappIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="whatsappUrl" className="h-11 rounded-xl pl-10" {...register("whatsappUrl")} />
          </div>
        </FormField>

        <FormField
          label="Tautan grup Telegram"
          htmlFor="telegramUrl"
          error={errors.telegramUrl?.message}
          hint="Mis. t.me/XXXX — https:// ditambahkan otomatis."
        >
          <div className="relative">
            <TelegramIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="telegramUrl" className="h-11 rounded-xl pl-10" {...register("telegramUrl")} />
          </div>
        </FormField>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Aturan Komunitas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Maksimal 12 butir. Ditampilkan sebagai daftar bercentang.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={fields.length >= 12}
            onClick={() => append({ text: "" })}
          >
            <Plus className="size-4" />
            Tambah butir
          </Button>
        </div>

        {errors.rules?.message && (
          <p className="text-xs font-medium text-danger">{errors.rules.message}</p>
        )}

        {fields.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Belum ada aturan. Seksi ini disembunyikan di halaman publik selama daftarnya kosong.
          </p>
        ) : (
          <ul className="space-y-3">
            {fields.map((field, index) => (
              <li key={field.id}>
                <div className="flex items-start gap-2">
                  <span className="mt-3 w-5 shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
                    {index + 1}.
                  </span>
                  <Input
                    aria-label={`Butir aturan ${index + 1}`}
                    className="h-11 rounded-xl"
                    {...register(`rules.${index}.text`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-1.5"
                    onClick={() => remove(index)}
                    aria-label={`Hapus butir aturan ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {errors.rules?.[index]?.text && (
                  <p className="mt-1 ml-7 text-xs font-medium text-danger">
                    {errors.rules[index]?.text?.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </div>
    </form>
  );
}
