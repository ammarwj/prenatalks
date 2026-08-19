"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiPatch, ApiRequestError } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { User } from "@/lib/types";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/auth";

const inputClass = "h-11 rounded-xl";

/**
 * Ubah nama & nomor telepon (`PATCH /auth/me`).
 *
 * Sesi di `auth-store` ikut diperbarui setelah berhasil supaya nama di kaki
 * sidebar berubah seketika — kalau tidak, pengguna melihat nama lamanya
 * tetap terpampang dan mengira simpanannya gagal.
 */
export function ProfileForm({ user }: { user: User }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name, phone: user.phone ?? "" },
  });

  async function onSubmit(values: UpdateProfileInput) {
    try {
      const { user: updated } = await apiPatch<{ user: User }>("/auth/me", {
        name: values.name,
        phone: values.phone?.trim() ? values.phone.trim() : null,
      });

      if (accessToken) {
        setSession(accessToken, updated);
      }
      reset({ name: updated.name, phone: updated.phone ?? "" });
      toast.success("Profil tersimpan.");
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan profil, coba lagi."
      );
    }
  }

  return (
    <Card className="rounded-3xl border border-border shadow-soft">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="font-display text-base">Data Diri</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormField label="Nama" htmlFor="name" error={errors.name?.message}>
            <Input id="name" className={inputClass} autoComplete="name" {...register("name")} />
          </FormField>

          <FormField
            label="Nomor telepon"
            htmlFor="phone"
            error={errors.phone?.message}
            hint="Opsional. Dipakai bidan untuk menghubungi Anda bila Anda memberi izin akses."
          >
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              className={inputClass}
              autoComplete="tel"
              {...register("phone")}
            />
          </FormField>

          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="h-11 gap-1.5 rounded-full px-6"
          >
            <Save className="size-4" />
            {isSubmitting ? "Menyimpan..." : "Simpan perubahan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
