"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { QuestionnaireForm } from "@/components/admin/questionnaire-form";
import { SuperAdminRestricted, useSuperAdminGuard } from "@/components/admin/super-admin-guard";
import { FormSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { AdminQuestionnaire } from "@/lib/types";

export default function EditQuestionnairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isSuperAdmin } = useSuperAdminGuard();
  const router = useRouter();
  const [questionnaire, setQuestionnaire] = useState<AdminQuestionnaire | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setNotFound(false);
    try {
      const data = await apiGet<AdminQuestionnaire>(`/admin/questionnaires/${id}`);
      setQuestionnaire(data);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat kuesioner.");
      }
    }
  }, [id]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [isSuperAdmin, load]);

  if (!isSuperAdmin) return <SuperAdminRestricted />;

  function handleSaved(result: AdminQuestionnaire, isNewVersion: boolean) {
    if (isNewVersion) {
      // Backend membuat baris Questionnaire baru (id berbeda) karena versi
      // lama sudah punya riwayat hasil — replace (bukan push) supaya tombol
      // back tidak kembali ke halaman edit id lama yang sudah basi.
      toast.success("Kuesioner disimpan sebagai versi baru");
      router.replace(`/admin/kuesioner/${result.id}`);
      return;
    }
    toast.success("Kuesioner diperbarui");
    setQuestionnaire(result);
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>Kuesioner tidak ditemukan. Mungkin sudah dihapus.</AlertDescription>
        </Alert>
        <Link
          href="/admin/kuesioner"
          className="text-sm font-semibold text-primary-text underline"
        >
          Kembali ke daftar kuesioner
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Edit Kuesioner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perubahan pada kuesioner yang sudah punya riwayat hasil akan disimpan sebagai versi
          baru, supaya riwayat lama tetap tertaut ke struktur & skor saat diisi.
        </p>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {questionnaire === null && !loadError ? (
        <FormSkeleton fields={4} withTextarea />
      ) : questionnaire ? (
        // key = updated_at supaya form remount & defaultValues di-refresh dari
        // data server setiap kali simpan berhasil (in-place update).
        <QuestionnaireForm
          key={questionnaire.updated_at}
          initialData={questionnaire}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
