import { z } from "zod";

import type { AdminLegalDocument } from "@/lib/types";

/**
 * TipTap mengirim `<p></p>` untuk editor kosong, jadi "kosong" tidak bisa
 * diperiksa dengan `min(1)` — idiom yang sama dipakai `lib/validations/article.ts`.
 */
function isContentEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

/**
 * Dokumen legal — PRD §12.3. `slug` tidak ada di sini: keduanya dikunci di
 * backend karena ditautkan dari footer dan checkbox persetujuan halaman daftar.
 */
export const legalDocumentSchema = z.object({
  title: z.string().min(1, "Judul dokumen wajib diisi").max(150, "Maksimal 150 karakter"),
  body: z.string().refine((value) => !isContentEmpty(value), "Isi dokumen wajib diisi"),
  effectiveDate: z.string(),
  isPublished: z.boolean(),
});

export type LegalDocumentInput = z.infer<typeof legalDocumentSchema>;

export function toLegalDocumentFormValues(document: AdminLegalDocument): LegalDocumentInput {
  return {
    title: document.title,
    body: document.body,
    effectiveDate: document.effective_date ?? "",
    isPublished: document.is_published,
  };
}

/** Payload persis bentuk aturan di `AdminLegalDocumentRequest`. */
export function toLegalDocumentPayload(values: LegalDocumentInput) {
  return {
    title: values.title.trim(),
    body: values.body,
    effective_date: values.effectiveDate || null,
    is_published: values.isPublished,
  };
}
