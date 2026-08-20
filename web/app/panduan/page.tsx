import Link from "next/link";
import { BookOpen } from "lucide-react";

import { GuideAccordion, type SanitizedGuide } from "@/components/panduan/guide-accordion";
import { Footer } from "@/components/shared/footer";
import { PublicHeader } from "@/components/shared/public-header";
import { apiServerGet } from "@/lib/api-server";
import { GUIDES_TAG } from "@/lib/public-cache";
import { sanitizeRichTextHtml } from "@/lib/sanitize-html";
import type { Guide } from "@/lib/types";

export const metadata = {
  title: "Panduan Penggunaan — PrenaTalks",
  description:
    "Langkah demi langkah memakai PrenaTalks: membuat akun, mengisi data kehamilan, cek risiko, kalkulator, checklist persiapan, dan berbagi hasil dengan bidan.",
};

/**
 * Isi panduan disanitasi **di sini**, bukan di komponen accordion-nya:
 * `sanitizeRichTextHtml()` menarik DOMPurify, dan menjalankannya di Server
 * Component menjaga pustaka itu tetap di luar bundel browser. Halaman legal
 * memperlakukan `body`-nya dengan cara yang sama.
 *
 * Galat API ditelan seperti `getFooterSettings()` dan `getDocument()` di
 * halaman legal — halaman tetap tampil dengan keadaan kosong.
 */
async function getGuides(): Promise<SanitizedGuide[]> {
  try {
    const { data } = await apiServerGet<Guide[]>("/guides", 300, [GUIDES_TAG]);
    return (data ?? []).map((guide) => ({
      id: guide.id,
      title: guide.title,
      summary: guide.summary,
      body: sanitizeRichTextHtml(guide.body),
    }));
  } catch {
    return [];
  }
}

export default async function PanduanPage() {
  const guides = await getGuides();

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            Panduan Penggunaan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Ikuti langkah-langkah di bawah untuk memakai PrenaTalks, dari membuat akun sampai
            berbagi hasil cek risiko dengan bidan Anda.
          </p>
        </div>

        {guides.length === 0 ? (
          /*
            Sengaja 200 dengan keadaan kosong, bukan `notFound()`: tautannya
            ada di footer setiap halaman, jadi mengantar pembaca ke "halaman
            tidak ditemukan" adalah kegagalan yang lebih buruk — alasan yang
            sama dipakai halaman legal.
          */
          <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-soft">
            <BookOpen className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Panduan sedang disusun dan belum diterbitkan. Sementara itu, jawaban singkat seputar
              PrenaTalks bisa Anda baca di{" "}
              <Link href="/faq" className="font-semibold text-primary-text hover:underline">
                halaman FAQ
              </Link>
              .
            </p>
          </div>
        ) : (
          <GuideAccordion guides={guides} />
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Masih bingung?{" "}
          <Link href="/kontak" className="font-semibold text-primary-text hover:underline">
            Hubungi kami
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
