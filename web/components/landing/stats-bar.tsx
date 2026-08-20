import { BookOpen, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/shared/reveal";
import type { StatItem, StatKey } from "@/lib/types";

/**
 * Ikon dan warna tiap kartu tetap di kode: yang dipetakan bukan teks,
 * melainkan komponen React dan kelas Tailwind, dan keduanya tidak bisa hidup
 * di database. Angka serta keterangannya datang dari `GET /stats`
 * (PRD §9 F-01) — angkanya dihitung backend, keterangannya disunting super
 * admin lewat `/admin/pengaturan`.
 */
const CARD_STYLES: Record<StatKey, { icon: LucideIcon; tone: "pink" | "purple" | "teal" }> = {
  mothers: { icon: Users, tone: "pink" },
  contents: { icon: BookOpen, tone: "purple" },
  assessments: { icon: ShieldCheck, tone: "teal" },
  health_workers: { icon: HeartHandshake, tone: "pink" },
};

const TONE_STYLES = {
  pink: "bg-primary-soft text-primary-text",
  purple: "bg-brand-purple-soft text-brand-purple",
  teal: "bg-brand-teal-soft text-brand-teal-text",
};

export function StatsBar({ items }: { items: StatItem[] }) {
  return (
    <div className="relative z-10 -mt-14 px-4 sm:px-6 lg:px-8 md:-mt-16">
      <Reveal>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-6 rounded-3xl border border-border bg-white p-6 shadow-soft sm:gap-y-8 md:grid-cols-4 md:divide-x md:divide-border md:gap-0 md:p-8">
          {items.map((stat) => {
            const { icon: Icon, tone } = CARD_STYLES[stat.key];

            return (
              <div
                key={stat.key}
                className="flex items-center gap-3 md:px-5 md:first:pl-0 md:last:pr-0"
              >
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full ${TONE_STYLES[tone]}`}
                >
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-display text-xl font-extrabold tabular-nums text-foreground leading-tight">
                    {stat.display}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </div>
  );
}
