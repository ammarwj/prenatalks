import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, HeartHandshake, Users } from "lucide-react";

import { Footer } from "@/components/shared/footer";
import { PublicHeader } from "@/components/shared/public-header";
import { apiServerGet } from "@/lib/api-server";
import type { BrandColors, PublicSettings, TeamMember } from "@/lib/types";

const OG_IMAGE = "/brand/logo.png";

export const metadata = {
  title: "Tentang PrenaTalks — Empowerment Women's Health",
  description:
    "Filosofi nama, sejarah sejak 2020, komitmen berbasis bukti ilmiah, makna logo dan warna, serta tim di balik PrenaTalks.",
  openGraph: {
    title: "Tentang PrenaTalks — Empowerment Women's Health",
    description:
      "Ruang belajar dan berbagi yang mengedepankan edukasi kesehatan berbasis bukti ilmiah untuk perempuan dan keluarga.",
    type: "website",
    // Logo penuh warna, sesuai kriteria terima PRD §9 F-16.
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Logo PrenaTalks" }],
  },
};

/**
 * Halaman Tentang — PRD §9 F-16, tujuh seksi sesuai urutan di sana.
 *
 * Seksi 1–5 dibaca dari `GET /settings` (kelompok `about`) supaya admin bisa
 * menyuntingnya tanpa deploy ulang; seksi 6 dari `GET /team-members`. PRD
 * meminta halaman ini "di-render statis (SSG)" sekaligus "dapat disunting
 * admin tanpa deploy ulang" — dua hal yang hanya bisa berjalan bersama lewat
 * ISR, jadi halaman ini statis dengan revalidasi berkala seperti /faq.
 */
export default async function TentangPage() {
  const [settingsResult, teamResult] = await Promise.all([
    apiServerGet<PublicSettings>("/settings"),
    apiServerGet<TeamMember[]>("/team-members"),
  ]);

  const about = settingsResult.data;
  const brand = (settingsResult.meta?.brand_colors as BrandColors | undefined) ?? {
    purple: "#7C3AED",
    teal: "#14B8A6",
  };
  const team = teamResult.data ?? [];

  const namePhilosophy = about?.about_name_philosophy ?? [];
  const milestones = about?.about_milestones ?? [];

  const colorBlocks = [
    { label: "Ungu", hex: brand.purple, meaning: about?.about_color_purple_meaning ?? "" },
    { label: "Hijau Toska", hex: brand.teal, meaning: about?.about_color_teal_meaning ?? "" },
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-wide text-primary-text uppercase">
            Tentang Kami
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            <span className="text-primary-text">Prena</span>
            <span className="text-brand-purple">Talks</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Teman Ibu Hamil untuk Persalinan Aman · Sejak 2020
          </p>
        </div>

        {/* 1 — Filosofi nama */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-bold text-foreground">Filosofi Nama</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {namePhilosophy.map((part) => (
              <div
                key={part.term}
                className="rounded-3xl border border-border bg-white p-5 shadow-soft"
              >
                <p className="font-display text-2xl font-extrabold text-brand-purple">
                  {part.term}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{part.meaning}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2 — Sejarah */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-bold text-foreground">Sejarah</h2>
          {about?.about_history_intro && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {about.about_history_intro}
            </p>
          )}

          {milestones.length > 0 && (
            <ol className="mt-6 space-y-0">
              {milestones.map((milestone, index) => (
                <li key={`${milestone.year}-${milestone.title}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex size-3 shrink-0 rounded-full bg-primary" />
                    {index < milestones.length - 1 && (
                      <span className="w-px flex-1 bg-border" aria-hidden="true" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className="font-display text-sm font-extrabold tabular-nums text-primary-text">
                      {milestone.year}
                    </p>
                    <p className="font-semibold text-foreground">{milestone.title}</p>
                    {milestone.description && (
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* 3 — Komitmen */}
        <section className="mb-12 rounded-3xl border border-border bg-brand-purple-soft p-6 text-center sm:p-10">
          <HeartHandshake className="mx-auto size-8 text-brand-purple" />
          <h2 className="mt-3 font-display text-2xl font-extrabold text-brand-purple sm:text-3xl">
            {about?.about_commitment_heading}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-foreground sm:text-base">
            {about?.about_commitment_body}
          </p>
        </section>

        {/* 4 — Filosofi logo */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-bold text-foreground">Filosofi Logo</h2>
          <div className="mt-4 flex flex-col items-center gap-6 rounded-3xl border border-border bg-white p-6 shadow-soft sm:flex-row sm:p-8">
            <Image
              src={OG_IMAGE}
              alt="Logo PrenaTalks: siluet ibu, ayah, dan anak menyatu dalam satu lingkaran"
              width={160}
              height={160}
              className="size-32 shrink-0 object-contain sm:size-40"
            />
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {about?.about_logo_philosophy}
            </p>
          </div>
        </section>

        {/* 5 — Filosofi warna */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-bold text-foreground">Filosofi Warna</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {colorBlocks.map((color) => (
              <div
                key={color.label}
                className="overflow-hidden rounded-3xl border border-border bg-white shadow-soft"
              >
                <div className="h-20" style={{ backgroundColor: color.hex }} />
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-display font-bold text-foreground">{color.label}</p>
                    <code className="text-xs text-muted-foreground tabular-nums">{color.hex}</code>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {color.meaning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6 — Profil tim */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-bold text-foreground">Tim Kami</h2>
          {team.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Profil tim sedang kami siapkan.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {team.map((member) => (
                <li
                  key={member.id}
                  className="flex gap-4 rounded-3xl border border-border bg-white p-5 shadow-soft"
                >
                  {member.photo_url ? (
                    <Image
                      src={member.photo_url}
                      alt=""
                      width={72}
                      height={72}
                      className="size-18 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-18 shrink-0 items-center justify-center rounded-full bg-brand-purple-soft text-brand-purple">
                      <Users className="size-7" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-display font-bold text-foreground">{member.name}</p>
                    <p className="text-sm text-primary-text">{member.role_title}</p>
                    {member.credential && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-purple-soft px-2.5 py-0.5 text-xs font-semibold text-brand-purple">
                        <BadgeCheck className="size-3.5" />
                        {member.credential}
                      </p>
                    )}
                    {member.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {member.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 7 — CTA */}
        <section className="rounded-3xl bg-gradient-to-r from-[#F9A8D4] to-[#F472B6] p-8 text-center">
          <h2 className="font-display text-2xl font-extrabold text-white">
            Yuk, mulai perjalanan Anda bersama kami
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/90">
            Bergabung ke komunitas untuk berbagi dengan sesama ibu, atau daftar untuk memakai cek
            risiko, kalkulator kehamilan, dan checklist persiapan.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/daftar"
              className="inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-primary-text shadow-soft hover:bg-white/90"
            >
              Daftar Sekarang
            </Link>
            <Link
              href="/komunitas"
              className="inline-flex min-h-11 items-center rounded-full border border-white px-6 text-sm font-semibold text-white hover:bg-white/10"
            >
              Gabung Komunitas
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
