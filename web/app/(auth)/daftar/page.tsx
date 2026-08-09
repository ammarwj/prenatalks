"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff, UserPlus } from "lucide-react";

import { AuthCard } from "@/components/shared/auth-card";
import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { apiPost, ApiRequestError } from "@/lib/api-client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export default function DaftarPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { agree: false },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      await apiPost("/auth/register", values);
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
        title="Cek email Anda"
        subtitle="Kami sudah mengirim tautan verifikasi. Buka email Anda untuk mengaktifkan akun."
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

  return (
    <AuthCard
      title="Yuk, kita mulai"
      subtitle="Buat akun untuk menyimpan riwayat kehamilan dan hasil cek risiko Anda."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-semibold text-primary-text hover:underline">
            Masuk
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

        <FormField label="Nama lengkap" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Nama Anda"
            className="h-11 rounded-xl"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </FormField>

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

        <FormField
          label="No. HP"
          htmlFor="phone"
          hint="Opsional"
          error={errors.phone?.message}
        >
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="08xxxxxxxxxx"
            className="h-11 rounded-xl"
            {...register("phone")}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          hint="Minimal 8 karakter, kombinasi huruf dan angka"
          error={errors.password?.message}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Buat password"
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

        <div className="flex items-start gap-2.5">
          <Controller
            name="agree"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="agree"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={!!errors.agree}
                className="mt-0.5"
              />
            )}
          />
          <label htmlFor="agree" className="text-sm leading-snug text-muted-foreground">
            Saya menyetujui{" "}
            <Link href="#" className="font-semibold text-brand-purple hover:underline">
              Syarat & Ketentuan
            </Link>{" "}
            dan{" "}
            <Link href="#" className="font-semibold text-brand-purple hover:underline">
              Kebijakan Privasi
            </Link>{" "}
            PrenaTalks.
          </label>
        </div>
        {errors.agree && (
          <p className="text-xs font-medium text-danger">{errors.agree.message}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-full bg-primary text-base text-white shadow-soft hover:bg-[#EC4899]"
        >
          <UserPlus className="size-4" />
          {isSubmitting ? "Memproses..." : "Daftar"}
        </Button>
      </form>
    </AuthCard>
  );
}
