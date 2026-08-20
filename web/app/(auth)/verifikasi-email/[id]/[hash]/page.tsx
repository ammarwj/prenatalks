"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

import { AuthCard } from "@/components/shared/auth-card";
import { InlineLoader } from "@/components/shared/loading-state";
import { apiPost, ApiRequestError } from "@/lib/api-client";

type Status = "loading" | "success" | "error";

/**
 * Tautan di email verifikasi (lihat api/app/Providers/AppServiceProvider.php)
 * meneruskan id/hash sebagai path dan expires/signature sebagai query persis
 * seperti signed route Laravel-nya — diteruskan apa adanya ke
 * `POST /auth/verify-email/{id}/{hash}` supaya tanda tangannya tetap valid.
 */
function VerifyEmailContent() {
  const params = useParams<{ id: string; hash: string }>();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const expires = searchParams.get("expires");
    const signature = searchParams.get("signature");

    if (!expires || !signature) {
      setStatus("error");
      setMessage("Tautan verifikasi ini tidak lengkap.");
      return;
    }

    const query = new URLSearchParams({ expires, signature }).toString();

    apiPost(`/auth/verify-email/${params.id}/${params.hash}?${query}`)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(
          err instanceof ApiRequestError
            ? err.message
            : "Terjadi kesalahan, coba lagi."
        );
      });
  }, [params.id, params.hash, searchParams]);

  if (status === "loading") {
    return (
      <AuthCard
        title="Memverifikasi email..."
        subtitle="Mohon tunggu sebentar."
      >
        <div className="flex justify-center py-4">
          <InlineLoader label="Memverifikasi email" />
        </div>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard
        title="Email terverifikasi"
        subtitle="Terima kasih! Email Anda sudah berhasil diverifikasi."
      >
        <div className="flex justify-center pb-2">
          <CheckCircle2 className="size-10 text-success" />
        </div>
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
      title="Tautan tidak valid"
      subtitle={message ?? "Tautan verifikasi ini tidak valid atau sudah kedaluwarsa."}
    >
      <div className="flex justify-center pb-2">
        <XCircle className="size-10 text-destructive" />
      </div>
      <Link
        href="/masuk"
        className="flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#EC4899]"
      >
        Kembali ke halaman masuk
      </Link>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
