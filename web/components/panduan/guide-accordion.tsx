"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type SanitizedGuide = {
  id: number;
  title: string;
  summary: string | null;
  /** Sudah lewat `sanitizeRichTextHtml()` di Server Component pemanggilnya. */
  body: string;
};

/**
 * Daftar langkah bernomor. Berbeda dari `FaqAccordion`: tanpa pencarian dan
 * tanpa pengelompokan kategori, karena urutan di sini bermakna — pembaca
 * menyusurinya dari langkah 1 ke bawah, bukan melompat ke satu jawaban.
 *
 * Nomornya dihitung dari posisi, bukan dari kolom di database, supaya
 * menghapus satu langkah tidak meninggalkan lubang di penomoran.
 */
export function GuideAccordion({ guides }: { guides: SanitizedGuide[] }) {
  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-3xl border border-border bg-white px-5 shadow-soft"
    >
      {guides.map((guide, index) => (
        <AccordionItem key={guide.id} value={String(guide.id)}>
          <AccordionTrigger>
            <span className="flex items-start gap-3 text-left">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-purple-soft text-xs font-bold text-brand-purple">
                {index + 1}
              </span>
              <span>
                <span className="block font-semibold">{guide.title}</span>
                {guide.summary && (
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                    {guide.summary}
                  </span>
                )}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div
              className="prose prose-sm sm:prose-base max-w-none sm:pl-10"
              dangerouslySetInnerHTML={{ __html: guide.body }}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
