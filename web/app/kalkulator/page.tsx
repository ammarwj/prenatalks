import type { Metadata } from "next";
import { Suspense } from "react";

import { CALCULATOR_FAQS, CalculatorFaq } from "@/components/calculator/calculator-faq";
import { CalculatorForm } from "@/components/calculator/calculator-form";
import { CalculatorExplainer } from "@/components/calculator/calculator-explainer";
import { Footer } from "@/components/shared/footer";
import { PublicHeader } from "@/components/shared/public-header";
import { RiskDisclaimer } from "@/components/shared/risk-disclaimer";

const TITLE = "Kalkulator Kehamilan — Hitung Usia Kehamilan & HPL";
const DESCRIPTION =
  "Hitung usia kehamilan, perkiraan hari lahir (HPL) dengan rumus Naegele, dan trimester berjalan dari HPHT Anda. Gratis, tanpa perlu daftar.";

export const metadata: Metadata = {
  title: `${TITLE} — PrenaTalks`,
  description: DESCRIPTION,
  // Hasil hitung hidup di `?hpht=` supaya bisa dibagikan — tapi permutasi
  // tanggal tak terbatas tidak layak diindeks, jadi semuanya dikanonikalkan
  // ke halaman dasar.
  alternates: { canonical: "/kalkulator" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
};

export default function KalkulatorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Kalkulator Kehamilan PrenaTalks",
      description: DESCRIPTION,
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      inLanguage: "id-ID",
      offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: CALCULATOR_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            Kalkulator Kehamilan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Masukkan Hari Pertama Haid Terakhir (HPHT) untuk mengetahui usia kehamilan, perkiraan
            tanggal lahir, dan trimester berjalan.
          </p>
        </div>

        {/* useSearchParams butuh Suspense agar halaman tetap bisa diprerender statis. */}
        <Suspense fallback={null}>
          <CalculatorForm mode="guest" />
        </Suspense>

        <div className="mt-12 space-y-12">
          <CalculatorExplainer />
          <CalculatorFaq />
          <RiskDisclaimer />
        </div>
      </main>

      <Footer />
    </div>
  );
}
