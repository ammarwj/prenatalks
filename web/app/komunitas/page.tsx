import Link from "next/link";
import { CheckCircle2, ShieldAlert } from "lucide-react";

import { PublicHeader } from "@/components/shared/public-header";
import { TelegramIcon, WhatsappIcon } from "@/components/shared/social-icons";
import { apiServerGet } from "@/lib/api-server";
import type { CommunitySettings } from "@/lib/types";

export const metadata = {
  title: "Komunitas — PrenaTalks",
  description:
    "Ruang berbagi sesama ibu hamil dan keluarga. Gabung grup WhatsApp atau Telegram PrenaTalks.",
};

/**
 * Halaman komunitas — PRD §9 F-12.
 *
 * Judul, penjelasan, aturan, dan kedua tautan dibaca dari `GET /settings`
 * (kelompok `community`) sehingga admin bisa menyuntingnya lewat
 * `/admin/pengaturan` tanpa deploy ulang. Yang **tidak** ikut disunting admin
 * adalah catatan "bukan kanal gawat darurat" di bawah — teks keselamatan itu
 * sejenis disclaimer wajib PRD §12.4, jadi sengaja tetap di kode agar tidak
 * bisa terhapus dari panel.
 */
export default async function KomunitasPage() {
  const { data } = await apiServerGet<CommunitySettings>("/settings");

  const heading = data?.community_heading ?? "Komunitas PrenaTalks";
  const description = data?.community_description ?? "";
  const rules = data?.community_rules ?? [];
  const whatsappUrl = data?.community_whatsapp_url ?? null;
  const telegramUrl = data?.community_telegram_url ?? null;
  const hasLinks = !!whatsappUrl || !!telegramUrl;

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            {heading}
          </h1>
          {description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>

        <section className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
          <h2 className="font-display text-lg font-bold text-foreground">Gabung Sekarang</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilih kanal yang paling nyaman untuk Anda. Keduanya berisi anggota yang sama.
          </p>

          {hasLinks ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#EC4899] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <WhatsappIcon className="size-5" />
                  Gabung Grup WhatsApp
                </a>
              )}
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-purple px-6 text-sm font-semibold text-brand-purple transition-colors hover:bg-brand-purple-soft focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <TelegramIcon className="size-5" />
                  Gabung Grup Telegram
                </a>
              )}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Tautan komunitas belum tersedia. Silakan cek kembali sebentar lagi.
            </p>
          )}
        </section>

        {rules.length > 0 && (
          <section className="mt-6 rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
            <h2 className="font-display text-lg font-bold text-foreground">Aturan Komunitas</h2>
            <ul className="mt-4 space-y-3">
              {rules.map((rule) => (
                <li key={rule} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-teal-text" />
                  <span className="text-sm leading-relaxed text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-warning/30 bg-feature-amber-soft p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <h2 className="font-display text-base font-bold text-warning">
                Komunitas bukan kanal layanan gawat darurat
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                Pesan di grup dijawab oleh sesama anggota dan bisa terlambat dibaca. Bila Anda
                mengalami tanda bahaya seperti perdarahan, nyeri hebat, demam tinggi, atau
                berkurangnya gerakan janin, jangan menunggu balasan di grup —{" "}
                <strong>segera hubungi bidan, dokter, atau fasilitas kesehatan terdekat.</strong>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Informasi yang dibagikan di komunitas bersifat edukatif dan bukan pengganti
                pemeriksaan atau nasihat tenaga kesehatan.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Belum yakin kondisi kehamilan Anda?{" "}
          <Link href="/kalkulator" className="font-semibold text-primary-text hover:underline">
            Coba kalkulator kehamilan
          </Link>{" "}
          atau{" "}
          <Link href="/faq" className="font-semibold text-primary-text hover:underline">
            baca pertanyaan umum
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
