import Link from "next/link";
import { FileText } from "lucide-react";

import { Footer } from "@/components/shared/footer";
import { PublicHeader } from "@/components/shared/public-header";
import { apiServerGet } from "@/lib/api-server";
import { formatLongDate } from "@/lib/date-utils";
import { LEGAL_DOCUMENTS_TAG } from "@/lib/public-cache";
import { sanitizeRichTextHtml } from "@/lib/sanitize-html";
import type { LegalDocument, LegalDocumentSlug } from "@/lib/types";

/**
 * Kerangka bersama halaman `/syarat-ketentuan` dan `/kebijakan-privasi`
 * (PRD §12.3, Lampiran C). Strukturnya identik, hanya isinya yang berbeda,
 * jadi keduanya cukup mengoper `slug` beserta judul & metadata sendiri.
 *
 * Di-render statis dengan ISR seperti `/komunitas` dan `/tentang` — bedanya
 * halaman ini mengoper tag cache, sehingga super admin yang baru menyimpan
 * langsung melihat hasilnya alih-alih menunggu 5 menit.
 */
async function getDocument(slug: LegalDocumentSlug): Promise<LegalDocument | null> {
  try {
    const { data } = await apiServerGet<LegalDocument>(`/legal-documents/${slug}`, 300, [
      LEGAL_DOCUMENTS_TAG,
    ]);
    return data;
  } catch {
    // API tidak terjangkau — halaman tetap tampil dengan keadaan kosong di
    // bawah, sama seperti `getBrand()` di root layout.
    return null;
  }
}

export async function LegalDocumentPage({
  slug,
  fallbackTitle,
}: {
  slug: LegalDocumentSlug;
  /** Dipakai saat dokumen belum terbit, supaya judul halaman tidak kosong. */
  fallbackTitle: string;
}) {
  const document = await getDocument(slug);

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            {document?.title ?? fallbackTitle}
          </h1>
          {document && (
            <p className="mt-2 text-sm text-muted-foreground">
              {document.effective_date && (
                <>Berlaku sejak {formatLongDate(document.effective_date)} · </>
              )}
              Terakhir diperbarui {formatLongDate(document.updated_at.slice(0, 10))}
            </p>
          )}
        </div>

        {document ? (
          <section className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
            <div
              className="prose prose-sm sm:prose-base max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(document.body) }}
            />
          </section>
        ) : (
          /*
            Sengaja 200 dengan keadaan kosong, bukan `notFound()`: halaman ini
            ditautkan dari checkbox persetujuan di form pendaftaran, dan
            mengantar pengguna ke "halaman tidak ditemukan" saat mereka
            memeriksa apa yang mereka setujui adalah kegagalan yang lebih
            buruk daripada mengatakan dokumennya sedang difinalisasi.
          */
          <section className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-soft">
            <FileText className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Dokumen ini sedang difinalisasi dan belum diterbitkan. Silakan hubungi kami lewat
              kontak di bawah bila Anda membutuhkannya sekarang.
            </p>
          </section>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Ada pertanyaan?{" "}
          <Link href="/kontak" className="font-semibold text-primary-text hover:underline">
            Hubungi kami
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
