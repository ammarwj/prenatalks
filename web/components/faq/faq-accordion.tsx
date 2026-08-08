"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import type { Faq } from "@/lib/types";

/** Accordion dikelompokkan per kategori + pencarian sisi klien (PRD §9 F-10). */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? faqs.filter(
          (faq) =>
            faq.question.toLowerCase().includes(term) || faq.answer.toLowerCase().includes(term)
        )
      : faqs;

    const byCategory = new Map<string, Faq[]>();
    for (const faq of filtered) {
      const key = faq.category?.name ?? "Lainnya";
      byCategory.set(key, [...(byCategory.get(key) ?? []), faq]);
    }

    return Array.from(byCategory.entries());
  }, [faqs, search]);

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pertanyaan..."
          className="h-11 rounded-full pl-10"
        />
      </div>

      {groups.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Tidak ada pertanyaan yang cocok dengan pencarian Anda.
        </p>
      ) : (
        groups.map(([category, items]) => (
          <div key={category}>
            <h2 className="mb-3 font-display text-lg font-bold text-foreground">{category}</h2>
            <Accordion
              type="single"
              collapsible
              className="rounded-3xl border border-border bg-white px-5 shadow-soft"
            >
              {items.map((faq) => (
                <AccordionItem key={faq.id} value={String(faq.id)}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))
      )}
    </div>
  );
}
