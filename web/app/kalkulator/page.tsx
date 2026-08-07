import Link from "next/link";

import { CalculatorForm } from "@/components/calculator/calculator-form";
import { Logo } from "@/components/shared/logo";

export const metadata = {
  title: "Kalkulator Kehamilan — PrenaTalks",
  description:
    "Hitung usia kehamilan, perkiraan tanggal lahir (HPL), dan trimester berjalan dari HPHT Anda.",
};

export default function KalkulatorPage() {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo withTagline={false} />
          <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Kembali ke Beranda
          </Link>
        </div>
      </header>

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

        <CalculatorForm mode="guest" />
      </main>
    </div>
  );
}
