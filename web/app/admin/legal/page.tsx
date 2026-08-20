"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";

import { SuperAdminRestricted, useSuperAdminGuard } from "@/components/admin/super-admin-guard";
import { ListSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import { formatLongDate } from "@/lib/date-utils";
import type { AdminLegalDocument } from "@/lib/types";

/**
 * Syarat & Ketentuan dan Kebijakan Privasi — PRD §12.3, Lampiran C
 * ("Kebijakan privasi & syarat ketentuan terpublikasi").
 *
 * Tidak ada tombol Tambah maupun Hapus, dan itu disengaja: himpunannya tetap
 * dua, keduanya ditautkan dari footer serta checkbox persetujuan di halaman
 * daftar, dan backend pun tidak mendaftarkan rute create/delete.
 *
 * Halaman tersendiri, bukan seksi di `/admin/pengaturan`: halaman itu terbuka
 * untuk admin biasa sedangkan rute di sini dijaga `role:super_admin` — alasan
 * yang sama seperti `/admin/brand`.
 */
export default function LegalAdminPage() {
  const { isSuperAdmin } = useSuperAdminGuard();
  const [documents, setDocuments] = useState<AdminLegalDocument[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setDocuments(await apiGet<AdminLegalDocument[]>("/admin/legal-documents"));
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat dokumen legal.");
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [isSuperAdmin, load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Halaman Legal</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Syarat &amp; Ketentuan dan Kebijakan Privasi. Keduanya ditautkan dari footer dan dari
          checkbox persetujuan di halaman pendaftaran, jadi tidak bisa dihapus — hanya disunting
          atau disembunyikan sementara.
        </p>
      </div>

      {!isSuperAdmin ? (
        <SuperAdminRestricted description="Dokumen legal mengikat pengguna yang menyetujuinya saat mendaftar, jadi hanya peran Super Admin yang bisa mengubahnya. Hubungi Super Admin bila teksnya perlu diperbarui." />
      ) : (
        <>
          {loadError && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}

          {documents === null ? (
            !loadError && <ListSkeleton rows={3} framed={false} label="Memuat dokumen" />
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <DocumentRow key={document.slug} document={document} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DocumentRow({ document }: { document: AdminLegalDocument }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-white p-5 shadow-soft">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display font-bold text-foreground">{document.title}</p>
          <StatusBadge document={document} />
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {document.effective_date
            ? `Berlaku sejak ${formatLongDate(document.effective_date)}`
            : "Tanggal berlaku belum ditetapkan"}
          {" · "}
          Diperbarui {formatLongDate(document.updated_at.slice(0, 10))}
          {document.updated_by && ` oleh ${document.updated_by.name}`}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/${document.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
        >
          <ExternalLink className="size-4" />
          Lihat halaman publik
        </Link>
        <Link
          href={`/admin/legal/${document.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-[#EC4899]"
        >
          <Pencil className="size-4" />
          Edit
        </Link>
      </div>
    </div>
  );
}

/**
 * "Perlu ditinjau" muncul selama tanggal berlaku belum diisi — itulah penanda
 * bahwa isinya masih draf bawaan dari seeder, bukan teks yang sudah disetujui.
 */
function StatusBadge({ document }: { document: AdminLegalDocument }) {
  if (!document.is_published) {
    return <Badge variant="outline">Disembunyikan</Badge>;
  }
  if (!document.effective_date) {
    return <Badge className="bg-warning/15 text-warning-text">Perlu ditinjau</Badge>;
  }
  return <Badge className="bg-brand-teal-soft text-brand-teal-text">Terbit</Badge>;
}
