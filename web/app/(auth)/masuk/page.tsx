"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { AuthCard } from "@/components/shared/auth-card";
import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPost, ApiRequestError } from "@/lib/api-client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export default function MasukPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      await apiPost("/auth/login", values);
      setSuccess(true);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi."
      );
    }
  }

  if (success) {
    return (
      <AuthCard eyebrow="PrenaTalks" title="Berhasil masuk" subtitle="Selamat datang kembali.">
        <Link
          href="/"
          className="flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#EC4899]"
        >
          Ke beranda
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="PrenaTalks"
      title="Yuk, masuk dulu"
      subtitle="Lanjutkan pantau kehamilan dan cek risiko Anda."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-semibold text-primary-text hover:underline">
            Daftar sekarang
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            className="h-11 rounded-xl"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Masukkan password"
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

        <div className="text-right">
          <Link
            href="/lupa-password"
            className="text-sm font-semibold text-brand-purple hover:underline"
          >
            Lupa password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-full bg-primary text-base text-white shadow-soft hover:bg-[#EC4899]"
        >
          <LogIn className="size-4" />
          {isSubmitting ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    </AuthCard>
  );
}
