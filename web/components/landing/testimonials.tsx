"use client";

import { useCallback, useState } from "react";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote:
      "Informasinya lengkap dan mudah dipahami. Saya jadi lebih siap menghadapi persalinan.",
    name: "Siti",
    week: "28 minggu",
  },
  {
    quote:
      "Fitur cek risiko sangat membantu saya mengetahui kondisi kehamilan saya saat ini.",
    name: "Rina",
    week: "32 minggu",
  },
  {
    quote:
      "Bidan di PrenaTalks ramah dan selalu cepat menjawab pertanyaan saya.",
    name: "Dwi",
    week: "24 minggu",
  },
];

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function Testimonials() {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  const handleSetApi = useCallback((nextApi: CarouselApi) => {
    setApi(nextApi);
    if (!nextApi) return;
    setSelected(nextApi.selectedScrollSnap());
    nextApi.on("select", () => setSelected(nextApi.selectedScrollSnap()));
  }, []);

  return (
    <section className="bg-primary-soft py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl md:text-[34px] font-extrabold text-foreground">
            Apa Kata <span className="text-primary-text">Ibu Hamil</span>?
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <Carousel
            setApi={handleSetApi}
            opts={{ align: "start", loop: true }}
            className="mx-auto"
          >
            <CarouselContent>
              {TESTIMONIALS.map((t) => (
                <CarouselItem
                  key={t.name}
                  className="sm:basis-1/2 lg:basis-1/3"
                >
                  <figure className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-soft">
                    <div className="flex gap-0.5 text-star">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-4 fill-current" />
                      ))}
                    </div>
                    <blockquote className="mt-4 grow text-sm leading-relaxed text-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-5 flex items-center gap-3">
                      <Avatar size="lg">
                        <AvatarFallback className="bg-brand-purple-soft font-display font-bold text-brand-purple">
                          {initials(t.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {t.name}, {t.week}
                      </span>
                    </figcaption>
                  </figure>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="mt-8 flex justify-center gap-2">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.name}
                type="button"
                aria-label={`Ke testimoni ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  selected === i ? "w-6 bg-primary" : "w-2 bg-primary/30"
                )}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
