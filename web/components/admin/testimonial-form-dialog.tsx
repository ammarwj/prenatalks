"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Star } from "lucide-react";

import { FileUpload } from "@/components/shared/file-upload";
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
import { apiPostForm, ApiRequestError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  testimonialSchema,
  toTestimonialFormData,
  toTestimonialFormValues,
  type TestimonialInput,
} from "@/lib/validations/testimonial";
import type { AdminTestimonial } from "@/lib/types";

export function TestimonialFormDialog({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AdminTestimonial | null;
  onSaved: (result: AdminTestimonial) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Testimoni" : "Tambah Testimoni"}</DialogTitle>
        </DialogHeader>
        {open && (
          <TestimonialForm
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

function TestimonialForm({
  initialData,
  onCancel,
  onSaved,
}: {
  initialData?: AdminTestimonial | null;
  onCancel: () => void;
  onSaved: (result: AdminTestimonial) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = !!initialData;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialInput>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: toTestimonialFormValues(initialData ?? undefined),
  });

  async function onSubmit(values: TestimonialInput) {
    setServerError(null);
    try {
      const formData = toTestimonialFormData(values, isEditing);
      const result = isEditing && initialData
        ? await apiPostForm<AdminTestimonial>(`/admin/testimonials/${initialData.id}`, formData)
        : await apiPostForm<AdminTestimonial>("/admin/testimonials", formData);
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

      <FormField label="Nama" htmlFor="name" error={errors.name?.message}>
        <Input id="name" className="h-11 rounded-xl" {...register("name")} />
      </FormField>

      <FormField
        label="Usia kehamilan"
        htmlFor="pregnancyAge"
        error={errors.pregnancyAge?.message}
        hint="Ditulis apa adanya seperti yang akan tampil, mis. 28 minggu."
      >
        <Input
          id="pregnancyAge"
          className="h-11 rounded-xl"
          placeholder="28 minggu"
          {...register("pregnancyAge")}
        />
      </FormField>

      <FormField
        label="Kutipan"
        htmlFor="quote"
        error={errors.quote?.message}
        hint="Maksimal 500 karakter. Tanda kutip ditambahkan otomatis saat ditampilkan."
      >
        <Textarea id="quote" rows={4} {...register("quote")} />
      </FormField>

      {/*
        Rating dipilih lewat lima tombol bintang, bukan kotak angka: bentuknya
        sama persis dengan yang akan dilihat pengunjung, jadi tidak ada
        terjemahan angka → tampilan yang perlu dibayangkan admin.

        Dibaca lewat Controller, bukan `watch()`: `watch` membuat React
        Compiler melewatkan komponen ini (bailout), sedangkan nilainya memang
        hanya dibutuhkan di dalam blok ini.
      */}
      <FormField label="Rating" htmlFor="rating" error={errors.rating?.message}>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <div id="rating" className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  aria-label={`Beri ${value} bintang`}
                  aria-pressed={field.value === value}
                  className="rounded-md p-1 text-star transition-transform hover:scale-110"
                >
                  <Star
                    className={cn("size-6", value <= field.value ? "fill-current" : "opacity-30")}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">{field.value} dari 5</span>
            </div>
          )}
        />
      </FormField>

      <FormField label="Foto" htmlFor="photo">
        <Controller
          name="photo"
          control={control}
          render={({ field }) => (
            <Controller
              name="removePhoto"
              control={control}
              render={({ field: removeField }) => (
                <FileUpload
                  id="photo"
                  accept="image/jpeg,image/png,image/webp"
                  maxSizeKb={2048}
                  previewShape="circle"
                  value={field.value}
                  onChange={(file) => {
                    field.onChange(file);
                    if (file) removeField.onChange(false);
                  }}
                  existingUrl={initialData?.photo_url}
                  removed={removeField.value}
                  onRemoveExisting={() => removeField.onChange(true)}
                  onUndoRemove={() => removeField.onChange(false)}
                  error={errors.photo?.message}
                />
              )}
            />
          )}
        />
      </FormField>

      <Controller
        name="isPublished"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox
              checked={field.value}
              onCheckedChange={(next) => field.onChange(next === true)}
            />
            Tampilkan di landing page
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
