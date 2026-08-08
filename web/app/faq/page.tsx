import { FaqAccordion } from "@/components/faq/faq-accordion";
import { PublicHeader } from "@/components/shared/public-header";
import { apiServerGet } from "@/lib/api-server";
import type { Faq } from "@/lib/types";

export const metadata = {
  title: "FAQ — PrenaTalks",
  description: "Pertanyaan yang sering diajukan seputar PrenaTalks.",
};

export default async function FaqPage() {
  const { data } = await apiServerGet<Faq[]>("/faqs");
  const faqs = data ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            Pertanyaan Umum
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Jawaban singkat seputar PrenaTalks. Tidak menemukan yang Anda cari? Hubungi kami lewat
            komunitas.
          </p>
        </div>

        {faqs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
            Belum ada pertanyaan yang diterbitkan.
          </div>
        ) : (
          <FaqAccordion faqs={faqs} />
        )}
      </main>
    </div>
  );
}
