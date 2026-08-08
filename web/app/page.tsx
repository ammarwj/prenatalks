import { PublicHeader } from "@/components/shared/public-header";
import { Footer } from "@/components/shared/footer";
import { Hero } from "@/components/landing/hero";
import { StatsBar } from "@/components/landing/stats-bar";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Testimonials } from "@/components/landing/testimonials";
import { CtaBanner } from "@/components/landing/cta-banner";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Hero />
        <StatsBar />
        <FeatureGrid />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
