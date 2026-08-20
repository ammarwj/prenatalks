import {
  ArrowRight,
  Backpack,
  BookOpenText,
  ClipboardCheck,
  GraduationCap,
  MessageCircle,
  Siren,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Reveal } from "@/components/shared/reveal";
import { FEATURE_LINKS, type FeatureId } from "@/lib/feature-links";

/**
 * `id` diketikkan `FeatureId`, bukan `string`: kartu tanpa tujuan di
 * `FEATURE_LINKS` langsung gagal saat `tsc` alih-alih diam-diam jadi kartu
 * mati seperti sebelumnya, ketika panahnya cuma hiasan.
 */
const FEATURES: {
  id: FeatureId;
  icon: LucideIcon;
  title: string;
  desc: string;
  titleColor: string;
  iconBg: string;
  iconColor: string;
  arrowBg: string;
}[] = [
  {
    id: "belajar",
    icon: GraduationCap,
    title: "Belajar",
    desc: "Edukasi lengkap seputar kehamilan trimester demi trimester.",
    titleColor: "text-primary-text",
    iconBg: "bg-primary-soft",
    iconColor: "text-primary-text",
    arrowBg: "bg-primary",
  },
  {
    id: "cek-risiko",
    icon: ClipboardCheck,
    title: "Cek Risiko",
    desc: "Cek risiko kehamilan Anda dengan mudah dan dapatkan rekomendasi yang tepat.",
    titleColor: "text-brand-teal-text",
    iconBg: "bg-brand-teal-soft",
    iconColor: "text-brand-teal-text",
    arrowBg: "bg-brand-teal",
  },
  {
    id: "siap-lahiran",
    icon: Backpack,
    title: "Siap Lahiran",
    desc: "Checklist persiapan persalinan agar Anda lebih siap dan tenang.",
    titleColor: "text-brand-purple",
    iconBg: "bg-brand-purple-soft",
    iconColor: "text-brand-purple",
    arrowBg: "bg-brand-purple",
  },
  {
    id: "tanda-bahaya",
    icon: Siren,
    title: "Tanda Bahaya",
    desc: "Kenali tanda bahaya kehamilan yang harus diwaspadai.",
    titleColor: "text-danger",
    iconBg: "bg-feature-danger-soft",
    iconColor: "text-danger",
    arrowBg: "bg-primary",
  },
  {
    id: "tanya-bidan",
    icon: MessageCircle,
    title: "Tanya Bidan",
    desc: "Konsultasi gratis bersama bidan kami seputar kehamilan Anda.",
    titleColor: "text-warning",
    iconBg: "bg-feature-amber-soft",
    iconColor: "text-warning",
    arrowBg: "bg-warning",
  },
  {
    id: "artikel",
    icon: BookOpenText,
    title: "Artikel",
    desc: "Tips, informasi, dan cerita inspiratif untuk ibu hamil.",
    titleColor: "text-feature-blue",
    iconBg: "bg-feature-blue-soft",
    iconColor: "text-feature-blue",
    arrowBg: "bg-feature-blue",
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl md:text-[34px] font-extrabold text-foreground text-balance">
          Semua yang Ibu Hamil Butuhkan
          <br className="hidden sm:block" /> dalam{" "}
          <span className="text-primary-text">Satu Platform</span>
        </h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.id} delay={(i % 3) * 0.06}>
            {/*
              `id` dan `scroll-mt-24` wajib tetap di elemen terluar: dua tombol
              CTA di hero menaut ke `#belajar` dan `#cek-risiko`, dan
              `scroll-mt-24` yang menjaga kartunya tidak tertutup header sticky
              saat anchor itu dipakai.

              Cincin fokus ditambahkan karena kartunya kini target klik seukuran
              kartu — tanpa itu pengguna keyboard tidak tahu sedang di mana.
            */}
            <Link
              id={feature.id}
              href={FEATURE_LINKS[feature.id]}
              className="group scroll-mt-24 flex h-full flex-col items-center rounded-3xl border border-border bg-white p-6 text-center outline-none transition-all duration-200 hover:-translate-y-1 hover:shadow-soft focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className={`flex size-16 items-center justify-center rounded-full ${feature.iconBg}`}
              >
                <feature.icon className={`size-7 ${feature.iconColor}`} />
              </span>
              <h3
                className={`font-display mt-5 text-lg font-bold ${feature.titleColor}`}
              >
                {feature.title}
              </h3>
              {/*
                `grow` membuat deskripsi menyerap sisa tinggi kartu sehingga
                panah keenam kartu sebaris meski jumlah barisnya beda — idiom
                yang sama dipakai kartu testimoni. Sebelumnya kerataan itu tidak
                terlalu terlihat karena isinya rata kiri; setelah rata tengah,
                panah yang tidak sejajar langsung mencolok.
              */}
              <p className="mt-2 grow text-sm leading-relaxed text-muted-foreground">
                {feature.desc}
              </p>
              <span
                className={`mt-5 flex size-9 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:translate-x-1 ${feature.arrowBg}`}
              >
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
