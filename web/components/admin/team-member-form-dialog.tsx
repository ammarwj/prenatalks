"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

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
import {
  teamMemberSchema,
  toTeamMemberFormData,
  toTeamMemberFormValues,
  type TeamMemberInput,
} from "@/lib/validations/about";
import type { AdminTeamMember } from "@/lib/types";

export function TeamMemberFormDialog({
  open,
  onOpenChange,
  initialData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AdminTeamMember | null;
  onSaved: (result: AdminTeamMember) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Profil Tim" : "Tambah Profil Tim"}</DialogTitle>
        </DialogHeader>
        {open && (
          <TeamMemberForm
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

function TeamMemberForm({
  initialData,
  onCancel,
  onSaved,
}: {
  initialData?: AdminTeamMember | null;
  onCancel: () => void;
  onSaved: (result: AdminTeamMember) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = !!initialData;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamMemberInput>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: toTeamMemberFormValues(initialData ?? undefined),
  });

  async function onSubmit(values: TeamMemberInput) {
    setServerError(null);
    try {
      const formData = toTeamMemberFormData(values, isEditing);
      const result = isEditing && initialData
        ? await apiPostForm<AdminTeamMember>(`/admin/team-members/${initialData.id}`, formData)
        : await apiPostForm<AdminTeamMember>("/admin/team-members", formData);
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
        label="Peran"
        htmlFor="roleTitle"
        error={errors.roleTitle?.message}
        hint="Mis. Penanggung Jawab Klinis, Penulis Konten."
      >
        <Input id="roleTitle" className="h-11 rounded-xl" {...register("roleTitle")} />
      </FormField>

      <FormField
        label="Kualifikasi"
        htmlFor="credential"
        error={errors.credential?.message}
        hint="Opsional — untuk tenaga kesehatan, tulis profesi dan nomor STR bila relevan. Inilah yang membuat klaim 'berbasis bukti' bisa diverifikasi pembaca."
      >
        <Input
          id="credential"
          className="h-11 rounded-xl"
          placeholder="Mis. Bidan · STR 1234567890"
          {...register("credential")}
        />
      </FormField>

      <FormField label="Deskripsi" htmlFor="description" error={errors.description?.message}>
        <Textarea id="description" rows={3} {...register("description")} />
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
            Tampilkan di halaman Tentang
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
