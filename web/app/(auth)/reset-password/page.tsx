"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { AuthCard } from "@/components/shared/auth-card";
import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPost, ApiRequestError } from "@/lib/api-client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    try {
      await apiPost("/auth/reset-password", { ...values, token, email });
      setSuccess(true);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi."
      );
    }
  }

  if (success) {
    return (
      <AuthCard
        eyebrow="PrenaTalks"
        title="Password diperbarui"
        subtitle="Password baru Anda sudah tersimpan. Silakan masuk kembali."
      >
        <Link
          href="/masuk"
          className="flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#EC4899]"
        >
          Ke halaman masuk
        </Link>
      </AuthCard>
    );
  }

  if (!token || !email) {
    return (
      <AuthCard
        eyebrow="PrenaTalks"
        title="Tautan tidak lengkap"
        subtitle="Tautan atur ulang password ini tidak valid atau sudah kedaluwarsa."
      >
        <Link
          href="/lupa-password"
          className="flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#EC4899]"
        >
          Minta tautan baru
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="PrenaTalks"
      title="Buat password baru"
      subtitle={`Atur ulang password untuk ${email}.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <FormField
          label="Password baru"
          htmlFor="password"
          hint="Minimal 8 karakter, kombinasi huruf dan angka"
          error={errors.password?.message}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Masukkan password baru"
              className="h-11 rounded-xl pr-11"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </FormField>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-full bg-primary text-base text-white shadow-soft hover:bg-[#EC4899]"
        >
          <KeyRound className="size-4" />
          {isSubmitting ? "Menyimpan..." : "Simpan password baru"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
