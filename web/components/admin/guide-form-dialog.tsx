"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiPost, apiPut, ApiRequestError } from "@/lib/api-client";
import type { AdminGuide } from "@/lib/types";
import { guideSchema, toGuideFormValues, toGuidePayload, type GuideInput } from "@/lib/validations/guide";

/**
 * Dialog dibungkus di luar form-nya dan hanya me-mount `GuideDialogForm` saat
 * terbuka, di-key oleh `initialData?.id` — alasannya sama seperti
 * `faq-form-dialog.tsx`, ditambah satu yang khusus di sini: TipTap mengabaikan
 * perubahan prop `content` setelah mount, jadi tanpa remount penuh editor akan
 * tetap menampilkan isi panduan yang disunting sebelumnya.
 */
export function GuideFormDialog({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AdminGuide | null;
  onSaved: (result: AdminGuide) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Panduan" : "Tambah Panduan"}</DialogTitle>
        </DialogHeader>
        {open && (
          <GuideDialogForm
            key={initialData?.id ?? "new"}
            initialData={initialData}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function GuideDialogForm({
  initialData,
  onCancel,
  onSaved,
}: {
  initialData?: AdminGuide | null;
  onCancel: () => void;
  onSaved: (result: AdminGuide) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GuideInput>({
    resolver: zodResolver(guideSchema),
    defaultValues: toGuideFormValues(initialData ?? undefined),
  });

  // Editor dibaca lewat useWatch + setValue, bukan Controller — pola yang sama
  // dengan `legal-document-form.tsx` dan `article-form.tsx`, karena
  // RichTextEditor mengelola state TipTap-nya sendiri dan hanya melaporkan
  // HTML lewat onChange.
  const body = useWatch({ control, name: "body" });

  async function onSubmit(values: GuideInput) {
    setServerError(null);
    try {
      const payload = toGuidePayload(values);
      const result =
        isEditing && initialData
          ? await apiPut<AdminGuide>(`/admin/guides/${initialData.id}`, payload)
          : await apiPost<AdminGuide>("/admin/guides", payload);
      onSaved(result);
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <FormField label="Judul langkah" htmlFor="title" error={errors.title?.message}>
        <Input
          id="title"
          className="h-11 rounded-xl"
          placeholder="Mis. Mengisi Cek Risiko Kehamilan"
          {...register("title")}
        />
      </FormField>

      <FormField
        label="Ringkasan"
        htmlFor="summary"
        hint="Opsional — satu kalimat yang tampil di bawah judul"
        error={errors.summary?.message}
      >
        <Textarea id="summary" rows={2} {...register("summary")} />
      </FormField>

      <FormField label="Isi panduan" htmlFor="body" error={errors.body?.message}>
        <RichTextEditor
          value={body}
          onChange={(html) => setValue("body", html, { shouldValidate: true })}
          error={errors.body?.message}
        />
      </FormField>

      <Controller
        name="isPublished"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={field.value} onCheckedChange={(next) => field.onChange(next === true)} />
            Terbitkan panduan ini
          </label>
        )}
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}
