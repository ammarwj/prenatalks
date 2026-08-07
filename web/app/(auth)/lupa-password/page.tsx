"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";

import { AuthCard } from "@/components/shared/auth-card";
import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPost, ApiRequestError } from "@/lib/api-client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

export default function LupaPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    try {
      await apiPost("/auth/forgot-password", values);
      setSentTo(values.email);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi."
      );
    }
  }

  if (sentTo) {
    return (
      <AuthCard
        eyebrow="PrenaTalks"
        title="Tautan terkirim"
        subtitle={`Kami sudah mengirim tautan atur ulang password ke ${sentTo}.`}
      >
        <Link
          href="/masuk"
          className="flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#EC4899]"
        >
          Kembali ke halaman masuk
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="PrenaTalks"
      title="Lupa password?"
      subtitle="Tidak masalah. Masukkan email Anda, kami kirimkan tautan untuk membuat password baru."
      footer={
        <Link href="/masuk" className="font-semibold text-primary-text hover:underline">
          Kembali ke halaman masuk
        </Link>
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

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-full bg-primary text-base text-white shadow-soft hover:bg-[#EC4899]"
        >
          <Mail className="size-4" />
          {isSubmitting ? "Mengirim..." : "Kirim tautan"}
        </Button>
      </form>
    </AuthCard>
  );
}
