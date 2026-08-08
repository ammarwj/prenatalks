"use client";

import { useState } from "react";
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
import { apiPost, apiPut, ApiRequestError } from "@/lib/api-client";
import type { AdminChecklistItem } from "@/lib/types";
import {
  checklistItemSchema,
  toChecklistItemFormValues,
  toChecklistItemPayload,
  type ChecklistItemInput,
} from "@/lib/validations/checklist";

/**
 * Pola sama seperti `FaqFormDialog`: isi dialog hanya di-mount saat terbuka
 * dan di-key oleh id item, sehingga form selalu mulai dari nilai yang benar
 * tanpa effect pereset.
 */
export function ChecklistItemFormDialog({
  open,
  onOpenChange,
  initialData,
  groups,
  defaultGroup,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AdminChecklistItem | null;
  groups: readonly string[];
  defaultGroup: string;
  onSaved: (result: AdminChecklistItem) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Item Checklist" : "Tambah Item Checklist"}</DialogTitle>
        </DialogHeader>
        {open && (
          <ChecklistItemDialogForm
            key={initialData?.id ?? `new-${defaultGroup}`}
            initialData={initialData}
            groups={groups}
            defaultGroup={defaultGroup}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChecklistItemDialogForm({
  initialData,
  groups,
  defaultGroup,
  onCancel,
  onSaved,
}: {
  initialData?: AdminChecklistItem | null;
  groups: readonly string[];
  defaultGroup: string;
  onCancel: () => void;
  onSaved: (result: AdminChecklistItem) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ChecklistItemInput>({
    resolver: zodResolver(checklistItemSchema),
    defaultValues: toChecklistItemFormValues(initialData ?? undefined, defaultGroup),
  });

  async function onSubmit(values: ChecklistItemInput) {
    setServerError(null);
    try {
      const payload = toChecklistItemPayload(values);
      const result =
        isEditing && initialData
          ? await apiPut<AdminChecklistItem>(`/admin/checklist-items/${initialData.id}`, payload)
          : await apiPost<AdminChecklistItem>("/admin/checklist-items", payload);
      onSaved(result);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <FormField label="Kelompok" htmlFor="groupName" error={errors.groupName?.message}>
        <Controller
          name="groupName"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="groupName" className="h-11 w-full rounded-xl">
                <SelectValue placeholder="Pilih kelompok" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField label="Judul item" htmlFor="title" error={errors.title?.message}>
        <Input id="title" className="h-11 rounded-xl" {...register("title")} />
      </FormField>

      <FormField
        label="Keterangan"
        htmlFor="description"
        error={errors.description?.message}
        hint="Opsional — penjelasan singkat yang membantu ibu, mis. jumlah atau kapan disiapkan."
      >
        <Textarea id="description" rows={3} {...register("description")} />
      </FormField>

      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <label className="flex items-start gap-2.5 text-sm text-foreground">
            <Checkbox
              className="mt-0.5"
              checked={field.value}
              onCheckedChange={(next) => field.onChange(next === true)}
            />
            <span>
              Tampilkan item ini di checklist pengguna
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Menonaktifkan item menyembunyikannya dari pengguna tanpa menghapus progres yang
                sudah tersimpan.
              </span>
            </span>
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
