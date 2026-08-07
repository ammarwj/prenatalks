import { BookOpen, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/shared/reveal";

/**
 * Nilai berikut mengikuti mockup landing page. PRD F-01 mengharuskan angka
 * ini diambil dari GET /api/v1/stats (ISR 1 jam) — sambungkan begitu
 * endpoint backend tersedia.
 */
const STATS: { icon: LucideIcon; value: string; label: string; tone: "pink" | "purple" | "teal" }[] = [
  { icon: Users, value: "1000+", label: "Ibu hamil terbantu", tone: "pink" },
  { icon: BookOpen, value: "200+", label: "Artikel & video edukasi", tone: "purple" },
  { icon: ShieldCheck, value: "Aman", label: "Privasi data terjaga", tone: "teal" },
  { icon: HeartHandshake, value: "Didampingi Ahli", label: "Bidan & tenaga kesehatan", tone: "pink" },
];

const TONE_STYLES = {
  pink: "bg-primary-soft text-primary-text",
  purple: "bg-brand-purple-soft text-brand-purple",
  teal: "bg-brand-teal-soft text-brand-teal-text",
};

export function StatsBar() {
  return (
    <div className="relative z-10 -mt-14 px-4 sm:px-6 lg:px-8 md:-mt-16">
      <Reveal>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-6 rounded-3xl border border-border bg-white p-6 shadow-soft sm:gap-y-8 md:grid-cols-4 md:divide-x md:divide-border md:gap-0 md:p-8">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 md:px-5 md:first:pl-0 md:last:pr-0"
            >
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-full ${TONE_STYLES[stat.tone]}`}
              >
                <stat.icon className="size-5" />
              </span>
              <div>
                <p className="font-display text-xl font-extrabold tabular-nums text-foreground leading-tight">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
