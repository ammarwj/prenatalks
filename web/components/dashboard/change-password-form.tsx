"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiRequestError } from "@/lib/api-error";
import { authChangePassword } from "@/lib/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth";

const inputClass = "h-11 rounded-xl";

/**
 * Ganti kata sandi tanpa keluar dari sesi.
 *
 * Backend mencabut seluruh refresh token pengguna dan menerbitkan sepasang
 * yang baru untuk perangkat ini; sesi baru itu dipasang ke `auth-store` di
 * bawah. Perangkat lain yang sedang masuk memang sengaja terlempar keluar —
 * itulah gunanya mengganti kata sandi.
 */
export function ChangePasswordForm() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });

  async function onSubmit(values: ChangePasswordInput) {
    try {
      const session = await authChangePassword(accessToken, values);
      setSession(session.access_token, session.user);
      reset();
      toast.success("Kata sandi diperbarui. Perangkat lain yang masuk telah dikeluarkan.");
    } catch (err) {
      // Kata sandi saat ini yang salah dilaporkan di fieldnya sendiri, bukan
      // sebagai toast — di situlah pengguna sedang melihat.
      if (err instanceof ApiRequestError && err.fieldErrors?.current_password) {
        setError("current_password", { message: err.fieldErrors.current_password[0] });
        return;
      }
      toast.error(
        err instanceof ApiRequestError ? err.message : "Gagal mengganti kata sandi, coba lagi."
      );
    }
  }

  return (
    <Card className="rounded-3xl border border-border shadow-soft">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="font-display text-base">Kata Sandi</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormField
            label="Kata sandi saat ini"
            htmlFor="current_password"
            error={errors.current_password?.message}
          >
            <Input
              id="current_password"
              type="password"
              className={inputClass}
              autoComplete="current-password"
              {...register("current_password")}
            />
          </FormField>

          <FormField
            label="Kata sandi baru"
            htmlFor="password"
            error={errors.password?.message}
            hint="Minimal 8 karakter, mengandung huruf dan angka."
          >
            <Input
              id="password"
              type="password"
              className={inputClass}
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
              className={inputClass}
              autoComplete="new-password"
              {...register("password_confirmation")}
            />
          </FormField>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 gap-1.5 rounded-full px-6"
          >
            <KeyRound className="size-4" />
            {isSubmitting ? "Menyimpan..." : "Ganti kata sandi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
