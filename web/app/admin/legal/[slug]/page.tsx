"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { LegalDocumentForm } from "@/components/admin/legal-document-form";
import { SuperAdminRestricted, useSuperAdminGuard } from "@/components/admin/super-admin-guard";
import { FormSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { AdminLegalDocument } from "@/lib/types";

export default function EditLegalDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isSuperAdmin } = useSuperAdminGuard();
  const [document, setDocument] = useState<AdminLegalDocument | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setNotFound(false);
    try {
      setDocument(await apiGet<AdminLegalDocument>(`/admin/legal-documents/${slug}`));
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat dokumen.");
      }
    }
  }, [slug]);

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [isSuperAdmin, load]);

  if (!isSuperAdmin) {
    return (
      <SuperAdminRestricted description="Dokumen legal mengikat pengguna yang menyetujuinya saat mendaftar, jadi hanya peran Super Admin yang bisa mengubahnya." />
    );
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>Dokumen legal tidak ditemukan.</AlertDescription>
        </Alert>
        <Link href="/admin/legal" className="text-sm font-semibold text-primary-text underline">
          Kembali ke daftar dokumen
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            {document?.title ?? "Edit Dokumen Legal"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Perubahan langsung tampil di halaman publiknya setelah disimpan.
          </p>
        </div>
        {document && (
          <Link
            href={`/${document.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <ExternalLink className="size-4" />
            Lihat halaman publik
          </Link>
        )}
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {/*
        Teks bawaan dari seeder disusun dari PRD §12.3 dan belum ditinjau ahli
        hukum. Peringatan ini hilang begitu tanggal berlaku diisi — mengisinya
        adalah tindakan sadar "teks ini sudah saya tinjau".
      */}
      {document && !document.effective_date && (
        <Alert className="rounded-xl border-warning/30 bg-feature-amber-soft">
          <AlertDescription>
            Teks awal dokumen ini disusun dari PRD §12.3 sebagai draf dan belum ditinjau. Tinjau
            isinya, lalu isi &quot;Berlaku sejak&quot; untuk menandainya sudah final.
          </AlertDescription>
        </Alert>
      )}

      {document === null && !loadError ? (
        <FormSkeleton fields={2} withTextarea label="Memuat dokumen" />
      ) : document ? (
        // TipTap tidak mengikuti perubahan prop `content` setelah mount, jadi
        // form di-remount lewat `key` supaya isi editor benar-benar ikut
        // berganti setelah simpan — pola yang sama dengan halaman edit artikel.
        <LegalDocumentForm
          key={document.updated_at}
          initialData={document}
          onSaved={setDocument}
        />
      ) : null}
    </div>
  );
}
