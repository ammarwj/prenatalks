import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Nunito_Sans } from "next/font/google";
import "./globals.css";

import { BrandProvider } from "@/components/shared/brand-provider";
import { Toaster } from "@/components/ui/sonner";
import { apiServerGet } from "@/lib/api-server";
import { BRAND_CACHE_TAG } from "@/lib/brand-cache";
import type { BrandSettings } from "@/lib/types";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const EMPTY_BRAND: BrandSettings = {
  brand_logo: null,
  brand_favicon: null,
  brand_hero: null,
};

/**
 * Aset identitas situs untuk seluruh aplikasi (PRD §1.4).
 *
 * Dibungkus try/catch bukan karena rewel: `apiServerGet` memang
 * mengembalikan `data: null` untuk respons non-OK, tapi `fetch` **melempar**
 * saat jaringan mati atau backend tidak menjawab. Tanpa penjagaan ini, API
 * yang tumbang akan membuat *seluruh situs* balas 500 — termasuk halaman
 * yang sebenarnya tidak butuh data apa pun. Gagal berarti pakai aset bawaan.
 *
 * Hasilnya dipakai dua kali per permintaan (metadata & layout); Next.js
 * men-dedupe `fetch` dengan argumen sama dalam satu render, jadi tetap satu
 * panggilan ke backend.
 */
async function getBrand(): Promise<BrandSettings> {
  try {
    const { data } = await apiServerGet<BrandSettings>("/settings", 300, [BRAND_CACHE_TAG]);

    return {
      brand_logo: data?.brand_logo ?? null,
      brand_favicon: data?.brand_favicon ?? null,
      brand_hero: data?.brand_hero ?? null,
    };
  } catch {
    return EMPTY_BRAND;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { brand_favicon: favicon } = await getBrand();

  return {
    // Tanpa ini, canonical & og:url per halaman tetap relatif — perayap lebih
    // menyukai URL absolut. Sumbernya sama dengan app/sitemap.ts.
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: "PrenaTalks — Teman Ibu Hamil untuk Persalinan Aman",
    description:
      "PrenaTalks menyederhanakan informasi kehamilan menjadi konten yang mudah dipahami, dilengkapi cek risiko kehamilan berbasis skor, kalkulator usia kehamilan, dan checklist persiapan persalinan.",

    // Selalu ditulis eksplisit, termasuk saat belum ada unggahan.
    //
    // Berkas cadangannya sengaja **tidak** bernama `public/favicon.ico`:
    // Next.js 16 mendeteksi nama itu sebagai berkas konvensi dan menyuntikkan
    // <link rel="icon"> sendiri. Tag itu akan berdampingan dengan tag dari
    // `icons` di bawah, dan browser dihadapkan pada dua ikon yang berbeda
    // tanpa aturan jelas mana yang menang — favicon yang baru diunggah bisa
    // kalah oleh berkas bawaan. Dengan nama lain, tag di sini satu-satunya.
    icons: {
      icon: [{ url: favicon?.url ?? "/brand/favicon-default.ico", type: "image/x-icon" }],
      ...(favicon && {
        apple: [{ url: favicon.apple_touch_url, sizes: "180x180", type: "image/png" }],
      }),
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const brand = await getBrand();

  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        <BrandProvider value={brand}>{children}</BrandProvider>
        <Toaster />
      </body>
    </html>
  );
}
