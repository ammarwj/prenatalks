"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { apiPut, ApiRequestError } from "@/lib/api-client";
import { LEGAL_DOCUMENTS_TAG, revalidatePublicCache } from "@/lib/public-cache";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { AdminLegalDocument } from "@/lib/types";
import {
  legalDocumentSchema,
  toLegalDocumentFormValues,
  toLegalDocumentPayload,
  type LegalDocumentInput,
} from "@/lib/validations/legal-document";

export function LegalDocumentForm({
  initialData,
  onSaved,
}: {
  initialData: AdminLegalDocument;
  onSaved: (result: AdminLegalDocument) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<LegalDocumentInput>({
    resolver: zodResolver(legalDocumentSchema),
    defaultValues: toLegalDocumentFormValues(initialData),
  });

  // Editor dibaca lewat useWatch + setValue, bukan Controller — pola yang
  // sama dengan `article-form.tsx`, karena RichTextEditor mengelola state
  // TipTap-nya sendiri dan hanya melaporkan HTML lewat onChange.
  const body = useWatch({ control, name: "body" });

  async function onSubmit(values: LegalDocumentInput) {
    setServerError(null);
    try {
      const saved = await apiPut<AdminLegalDocument>(
        `/admin/legal-documents/${initialData.slug}`,
        toLegalDocumentPayload(values)
      );
      toast.success("Dokumen legal disimpan");
      onSaved(saved);
      await revalidatePublicCache([LEGAL_DOCUMENTS_TAG], accessToken);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan dokumen, coba lagi."
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
        <FormField label="Judul" htmlFor="title" error={errors.title?.message}>
          <Input id="title" className="h-11 rounded-xl" {...register("title")} />
        </FormField>

        <FormField label="Isi dokumen" htmlFor="body" error={errors.body?.message}>
          <RichTextEditor
            value={body}
            onChange={(html) => setValue("body", html, { shouldDirty: true })}
            error={errors.body?.message}
          />
        </FormField>
      </section>

      <section className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
        <FormField
          label="Berlaku sejak"
          htmlFor="effectiveDate"
          error={errors.effectiveDate?.message}
          hint="Kosongkan selama teksnya belum ditinjau. Tanggal ini tampil di halaman publik."
        >
          <Controller
            name="effectiveDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="effectiveDate"
                value={field.value}
                onChange={field.onChange}
                placeholder="Belum ditetapkan"
              />
            )}
          />
        </FormField>

        <Controller
          name="isPublished"
          control={control}
          render={({ field }) => (
            <label className="flex items-start gap-2.5 text-sm text-foreground">
              <Checkbox
                className="mt-0.5"
                checked={field.value}
                onCheckedChange={(next) => field.onChange(next === true)}
              />
              <span>
                Terbitkan dokumen ini
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Bila dimatikan, halaman publiknya menampilkan keterangan &quot;sedang
                  difinalisasi&quot; — bukan halaman 404, karena tautannya dipakai di form
                  pendaftaran.
                </span>
              </span>
            </label>
          )}
        />
      </section>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan Dokumen"}
        </Button>
      </div>
    </form>
  );
}
