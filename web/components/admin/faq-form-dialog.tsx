"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost, apiPut, ApiRequestError } from "@/lib/api-client";
import type { AdminFaq, Category } from "@/lib/types";
import { faqSchema, toFaqFormValues, toFaqPayload, type FaqInput } from "@/lib/validations/faq";

/**
 * Dialog dibungkus di luar form-nya dan hanya me-mount `FaqDialogForm` saat
 * terbuka, di-key oleh `initialData?.id` — remount penuh menggantikan
 * effect yang mereset form (menghindari setState sinkron di dalam effect).
 */
export function FaqFormDialog({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AdminFaq | null;
  onSaved: (result: AdminFaq) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit FAQ" : "Tambah FAQ"}</DialogTitle>
        </DialogHeader>
        {open && (
          <FaqDialogForm
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

function FaqDialogForm({
  initialData,
  onCancel,
  onSaved,
}: {
  initialData?: AdminFaq | null;
  onCancel: () => void;
  onSaved: (result: AdminFaq) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FaqInput>({
    resolver: zodResolver(faqSchema),
    defaultValues: toFaqFormValues(initialData ?? undefined),
  });

  useEffect(() => {
    apiGet<Category[]>("/categories?type=faq")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  async function onSubmit(values: FaqInput) {
    setServerError(null);
    try {
      const payload = toFaqPayload(values);
      const result = isEditing && initialData
        ? await apiPut<AdminFaq>(`/admin/faqs/${initialData.id}`, payload)
        : await apiPost<AdminFaq>("/admin/faqs", payload);
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

      <FormField label="Pertanyaan" htmlFor="question" error={errors.question?.message}>
        <Input id="question" className="h-11 rounded-xl" {...register("question")} />
      </FormField>

      <FormField label="Jawaban" htmlFor="answer" error={errors.answer?.message}>
        <Textarea id="answer" rows={4} {...register("answer")} />
      </FormField>

      <FormField label="Kategori" htmlFor="categoryId" hint="Opsional">
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
              <SelectTrigger id="categoryId" className="h-11 w-full rounded-xl">
                <SelectValue placeholder="Tanpa kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <Controller
        name="isPublished"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={field.value} onCheckedChange={(next) => field.onChange(next === true)} />
            Terbitkan FAQ ini
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
