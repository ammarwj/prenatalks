"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { InlineLoader } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiPost, ApiRequestError } from "@/lib/api-client";
import type { HealthWorkerPatientDetail } from "@/lib/types";

/**
 * Titik pendaratan tautan akses — PRD §9 F-15, BUSINESS_FLOWS §9.
 *
 * Halaman ini tidak menampilkan data apa pun; tugasnya menukar kode lalu
 * meneruskan ke halaman pasien. Kode dikirim di body `POST
 * /health-worker/access`, bukan sebagai query, supaya tidak ikut tercatat
 * di access log server.
 *
 * Sengaja diarahkan dengan `router.replace`: kode di URL adalah kredensial,
 * dan meninggalkannya di riwayat "kembali" peramban bersama membuatnya
 * gampang tidak sengaja terlihat orang lain di layar yang sama.
 */
export default function AksesTautanPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const redeem = useCallback(async () => {
    try {
      const detail = await apiPost<HealthWorkerPatientDetail>("/health-worker/access", { code });
      router.replace(`/nakes/pasien/${detail.consent_id}`);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Gagal membuka tautan akses. Periksa koneksi Anda dan coba lagi."
      );
    }
  }, [code, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    redeem();
  }, [redeem]);

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Tautan bisa jadi sudah dicabut pasien, sudah kedaluwarsa, atau ditujukan untuk akun tenaga
          kesehatan lain. Mintalah pasien membuat tautan baru bila akses masih dibutuhkan.
        </p>
        <Button asChild type="button" variant="outline" className="rounded-full">
          <Link href="/nakes">Kembali ke daftar pasien</Link>
        </Button>
      </div>
    );
  }

  return (
    <InlineLoader label="Membuka tautan akses" className="py-12" />
  );
}
