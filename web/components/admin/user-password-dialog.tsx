"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiPost, ApiRequestError } from "@/lib/api-client";
import { adminResetPasswordSchema, type AdminResetPasswordInput } from "@/lib/validations/auth";
import type { AdminUser } from "@/lib/types";

/**
 * Ubah kata sandi pengguna lain langsung dari panel super admin.
 *
 * Isi dialog hanya di-mount saat terbuka dan di-key oleh id pengguna (pola
 * yang sama dengan `UserRoleDialog`), jadi nilai awalnya selalu benar tanpa
 * effect pereset.
 */
export function UserPasswordDialog({
  user,
  onOpenChange,
  onSaved,
}: {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Kata Sandi Pengguna</DialogTitle>
          <DialogDescription>
            {user ? `${user.name} · ${user.email}` : ""}
          </DialogDescription>
        </DialogHeader>
        {user && (
          <UserPasswordForm
            key={user.id}
            user={user}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserPasswordForm({
  user,
  onCancel,
  onSaved,
}: {
  user: AdminUser;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminResetPasswordInput>({
    resolver: zodResolver(adminResetPasswordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  async function onSubmit(values: AdminResetPasswordInput) {
    setServerError(null);
    try {
      await apiPost<null>(`/admin/users/${user.id}/reset-password`, values);
      onSaved();
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal mengganti kata sandi, coba lagi."
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

      <FormField
        label="Kata sandi baru"
        htmlFor="password"
        error={errors.password?.message}
        hint="Minimal 8 karakter, mengandung huruf dan angka."
      >
        <Input
          id="password"
          type="password"
          className="h-11 rounded-xl"
          autoComplete="new-password"
          {...register("password")}
        />
      </FormField>

      <FormField
        label="Ulangi kata sandi baru"
        htmlFor="password_confirmation"
        error={errors.password_confirmation?.message}
      >
        <Input
          id="password_confirmation"
          type="password"
          className="h-11 rounded-xl"
          autoComplete="new-password"
          {...register("password_confirmation")}
        />
      </FormField>

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
