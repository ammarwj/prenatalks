import { PublicHeader } from "@/components/shared/public-header";
import { Footer } from "@/components/shared/footer";
import { Hero } from "@/components/landing/hero";
import { StatsBar } from "@/components/landing/stats-bar";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Testimonials } from "@/components/landing/testimonials";
import { CtaBanner } from "@/components/landing/cta-banner";
import { apiServerGet } from "@/lib/api-server";
import { STATS_TAG, TESTIMONIALS_TAG } from "@/lib/public-cache";
import type { PublicStats, Testimonial } from "@/lib/types";

/**
 * Statistik dan testimoni dibaca dari backend (PRD §9 F-01) supaya bisa
 * dikelola dari panel admin tanpa deploy ulang. Keduanya dibungkus try/catch
 * seperti `getBrand()` di root layout: API yang sedang mati boleh
 * menyembunyikan dua seksi, tapi tidak boleh menjatuhkan seluruh landing page.
 *
 * Statistik memakai ISR 1 jam sesuai PRD; testimoni 5 menit seperti data
 * publik lain. Panel admin membatalkan keduanya lebih cepat lewat tag cache
 * (`app/api/revalidate-public/route.ts`).
 */
async function getLandingData() {
  const [stats, testimonials] = await Promise.all([
    apiServerGet<PublicStats>("/stats", 3600, [STATS_TAG])
      .then((response) => response.data)
      .catch(() => null),
    apiServerGet<Testimonial[]>("/testimonials", 300, [TESTIMONIALS_TAG])
      .then((response) => response.data)
      .catch(() => null),
  ]);

  return { stats, testimonials: testimonials ?? [] };
}

export default async function Home() {
  const { stats, testimonials } = await getLandingData();
  const showStats = !!stats?.enabled && stats.items.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Hero />
        {showStats ? (
          <StatsBar items={stats.items} />
        ) : (
          // Bar statistik menumpuk di atas hero lewat margin negatif; tanpa
          // pengganti ini, seksi berikutnya ikut naik dan menempel ke hero.
          <div className="h-10" />
        )}
        <FeatureGrid />
        {testimonials.length > 0 && <Testimonials items={testimonials} />}
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
