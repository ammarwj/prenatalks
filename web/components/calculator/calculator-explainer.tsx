import { CalendarHeart, Scan, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const TRIMESTERS = [
  {
    label: "Trimester 1",
    range: "Minggu 0 – 13",
    text: "Organ-organ utama janin terbentuk. Keluhan mual dan mudah lelah paling sering muncul di fase ini.",
    className: "bg-brand-teal-soft text-brand-teal-text",
  },
  {
    label: "Trimester 2",
    range: "Minggu 14 – 27",
    text: "Umumnya fase paling nyaman. Gerakan janin mulai terasa dan pertumbuhannya berlangsung cepat.",
    className: "bg-brand-purple-soft text-brand-purple",
  },
  {
    label: "Trimester 3",
    range: "Minggu 28 – lahir",
    text: "Janin bersiap untuk lahir. Pemeriksaan kehamilan menjadi lebih sering dan persiapan persalinan dimatangkan.",
    className: "bg-primary-soft text-primary-text",
  },
];

/**
 * Isi penjelas halaman kalkulator publik.
 *
 * Ini sumber nilai SEO halaman ini — tanpa teks yang bisa diindeks, mesin
 * pencari cuma melihat satu form kosong (hasil hitung dirender di klien).
 */
export function CalculatorExplainer() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-display text-xl font-extrabold text-foreground">
          Cara Kerja Perhitungan Ini
        </h2>

        <Card className="rounded-3xl border border-border shadow-soft">
          <CardContent className="space-y-4 px-6 py-6 text-sm leading-relaxed text-muted-foreground">
            <div className="flex gap-3">
              <CalendarHeart className="mt-0.5 size-5 shrink-0 text-primary-text" />
              <p>
                <span className="font-semibold text-foreground">Rumus Naegele.</span> HPL dihitung
                dengan mengambil HPHT, menambah 7 hari, mengurangi 3 bulan, lalu menambah 1 tahun —
                setara dengan 280 hari atau 40 minggu sejak HPHT. Usia kehamilan hari ini adalah
                jarak antara HPHT dan tanggal sekarang.
              </p>
            </div>

            <div className="flex gap-3">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-brand-purple" />
              <p>
                <span className="font-semibold text-foreground">HPL adalah perkiraan.</span> Hanya
                sekitar 1 dari 20 bayi lahir tepat pada HPL. Kelahiran pada usia 37 sampai 42 minggu
                masih tergolong normal, jadi anggap HPL sebagai titik tengah, bukan tenggat.
              </p>
            </div>

            <div className="flex gap-3">
              <Scan className="mt-0.5 size-5 shrink-0 text-brand-teal-text" />
              <p>
                <span className="font-semibold text-foreground">Kapan USG lebih akurat.</span> Rumus
                ini mengasumsikan siklus haid 28 hari. Bila siklus Anda tidak teratur atau Anda tidak
                yakin dengan tanggal HPHT, USG trimester pertama memberi perkiraan yang jauh lebih
                tepat. HPL dari USG bisa Anda catat di halaman Data Kehamilan agar dipakai di seluruh
                dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-extrabold text-foreground">Pembagian Trimester</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {TRIMESTERS.map((trimester) => (
            <Card key={trimester.label} className="rounded-3xl border border-border shadow-soft">
              <CardContent className="space-y-2 px-5 py-5">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${trimester.className}`}
                >
                  {trimester.label}
                </span>
                <p className="text-sm font-semibold text-foreground">{trimester.range}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{trimester.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
