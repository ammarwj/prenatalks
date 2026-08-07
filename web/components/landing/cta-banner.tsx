import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[#F9A8D4] to-primary px-8 py-10 text-center sm:flex-row sm:justify-between sm:text-left md:px-14 md:py-12">
          <Heart
            className="pointer-events-none absolute -left-6 -top-6 size-32 text-white/10"
            fill="currentColor"
            strokeWidth={0}
          />
          <Heart
            className="pointer-events-none absolute -right-10 bottom-[-2rem] size-40 text-white/10"
            fill="currentColor"
            strokeWidth={0}
          />

          <div className="relative">
            <h2 className="font-display text-2xl md:text-[28px] font-extrabold text-white text-balance">
              Yuk, jadi ibu hamil yang siap dan tenang!
            </h2>
            <p className="mt-2 text-sm md:text-base text-white/90">
              Mulai perjalanan kehamilan sehat Anda bersama PrenaTalks.
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="relative h-12 shrink-0 rounded-full bg-white px-6 text-base text-primary-text hover:bg-white/90"
          >
            <Link href="/daftar">
              Mulai Sekarang
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
