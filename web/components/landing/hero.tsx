import Image from "next/image";
import { BookOpen, Phone, Rocket, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";

const FLOATING_CARDS: {
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: "teal" | "pink" | "purple";
}[] = [
  {
    icon: ShieldCheck,
    title: "Informasi Terpercaya",
    desc: "Edukasi berbasis bukti dari tenaga kesehatan",
    tone: "teal",
  },
  {
    icon: Users,
    title: "Untuk Ibu & Janin",
    desc: "Kesehatan ibu terjaga, bayi lahir selamat",
    tone: "pink",
  },
  {
    icon: Phone,
    title: "Akses Kapan Saja",
    desc: "Bisa diakses di HP kapan pun & di mana pun",
    tone: "purple",
  },
];

const TONE_STYLES = {
  teal: "bg-brand-teal-soft text-brand-teal-text",
  pink: "bg-primary-soft text-primary-text",
  purple: "bg-brand-purple-soft text-brand-purple",
};

function FloatingCard({
  icon: Icon,
  title,
  desc,
  tone,
}: (typeof FLOATING_CARDS)[number]) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 pr-5 shadow-soft max-w-[250px]">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${TONE_STYLES[tone]}`}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-bold text-foreground leading-tight">
          {title}
        </p>
        <p className="text-xs text-muted-foreground leading-snug mt-0.5">
          {desc}
        </p>
      </div>
    </div>
  );
}

/**
 * Ilustrasi lingkaran bertema logo — placeholder untuk foto hero asli.
 * Belum ada aset foto (lihat PRD, Pertanyaan Terbuka #5); ganti dengan
 * <Image src="/hero/ibu-hamil.jpg" .../> begitu foto tersedia.
 */
function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-soft via-white to-brand-purple-soft blur-2xl" />
      <div className="absolute inset-8 rounded-full bg-white/60 shadow-soft ring-1 ring-white" />
      <Image
        src="/brand/logo.png"
        alt="PrenaTalks — ibu, ayah, dan anak dalam satu lingkaran"
        fill
        sizes="(min-width: 1024px) 420px, 80vw"
        className="object-contain p-16 drop-shadow-xl"
        priority
      />
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="beranda"
      className="relative overflow-hidden bg-gradient-to-br from-[#FFF1F6] via-[#FDF2F8] to-[#F5F3FF] pt-12 pb-28 md:pt-16 md:pb-36 scroll-mt-20"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:px-8 lg:grid-cols-2 lg:items-center lg:gap-8">
        <Reveal>
          <h1 className="font-display text-4xl md:text-[52px] font-extrabold leading-[1.15] text-balance text-foreground">
            Persiapan Persalinan Lebih Tenang Bersama{" "}
            <span className="text-primary-text">Prena</span>
            <span className="text-brand-purple">Talks</span>
          </h1>
          <p className="mt-5 max-w-md text-base md:text-lg leading-relaxed text-muted-foreground">
            Dapatkan informasi kehamilan terpercaya, rencanakan persalinan
            dengan baik, dan cegah komplikasi sejak dini.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-primary px-6 text-base text-white shadow-soft hover:bg-[#EC4899]"
            >
              <a href="#cek-risiko">
                <Rocket className="size-4" />
                Mulai Sekarang
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-brand-purple px-6 text-base text-brand-purple hover:bg-brand-purple-soft"
            >
              <a href="#cek-risiko">
                <ShieldCheck className="size-4" />
                Cek Risiko
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 rounded-full border border-border bg-white/70 px-6 text-base hover:bg-white"
            >
              <a href="#belajar">
                <BookOpen className="size-4" />
                Belajar Gratis
              </a>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="relative">
          <HeroVisual />

          {/* Kartu mengambang — desktop */}
          <div className="hidden md:block">
            <div className="absolute right-0 top-2 animate-[float_6s_ease-in-out_infinite]">
              <FloatingCard {...FLOATING_CARDS[0]} />
            </div>
            <div className="absolute right-[-1rem] top-[42%] animate-[float_6s_ease-in-out_infinite] [animation-delay:-2s]">
              <FloatingCard {...FLOATING_CARDS[1]} />
            </div>
            <div className="absolute bottom-2 left-[-1.5rem] animate-[float_6s_ease-in-out_infinite] [animation-delay:-4s]">
              <FloatingCard {...FLOATING_CARDS[2]} />
            </div>
          </div>

          {/* Kartu — mobile: susun vertikal di bawah ilustrasi */}
          <div className="mt-6 flex flex-col gap-3 md:hidden">
            {FLOATING_CARDS.map((card) => (
              <FloatingCard key={card.title} {...card} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
