"use client";

import { useState } from "react";
import Image from "next/image";
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

      <FormField label="Foto" htmlFor="photo" hint="Opsional. JPG/PNG/WebP, maksimal 2 MB.">
        <div className="space-y-3">
          {/*
            Status "hapus foto" dibaca lewat Controller, bukan `watch()`:
            `watch` membuat React Compiler melewatkan komponen ini (bailout),
            sedangkan nilainya memang hanya dibutuhkan di dalam blok ini.
          */}
          <Controller
            name="removePhoto"
            control={control}
            render={({ field }) => (
              <>
                {initialData?.photo_url && !field.value && (
                  <div className="flex items-center gap-3">
                    <Image
                      src={initialData.photo_url}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 rounded-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => field.onChange(true)}
                    >
                      Hapus foto
                    </Button>
                  </div>
                )}
                {field.value && (
                  <p className="text-xs font-medium text-danger">
                    Foto akan dihapus saat disimpan.{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => field.onChange(false)}
                    >
                      Batalkan
                    </button>
                  </p>
                )}
              </>
            )}
          />
          <Controller
            name="photo"
            control={control}
            render={({ field }) => (
              <Input
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="h-11 rounded-xl"
                onChange={(e) => field.onChange(e.target.files?.[0])}
              />
            )}
          />
        </div>
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
